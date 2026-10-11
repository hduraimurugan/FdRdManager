import { FixedDeposit, RecurringDeposit } from './portfolioData';
import { planReminders, planPortfolioReminders, REMINDER_ID_PREFIX } from './reminders';

function sampleFd(overrides: Partial<FixedDeposit> = {}): FixedDeposit {
  return {
    id: 'fd-1', fdNumber: 'FD001', bankName: 'HDFC Bank', branch: '', bankAccountNumber: '', customerId: '',
    fdHolderName: '', jointHolder: null, fdType: 'Regular', mode: 'Online', status: 'Active',
    principalAmount: 100000, depositDate: '2026-01-01', startDate: '2026-01-01', maturityDate: '2027-01-01',
    tenureYears: 1, tenureMonths: 0, tenureDays: 0, interestRate: 7, interestType: 'Compound',
    compoundingFrequency: 'Quarterly', interestPayoutMode: 'At Maturity', interestCreditMethod: 'Reinvested into FD',
    autoRenewal: 'No', renewalOption: 'Do Not Renew', remarks: '', maturityAmount: 107000, currentValue: 100000,
    interestEarnedTotal: 7000, interestEarnedSoFar: 0, daysRemaining: 365, totalDays: 365, elapsedDays: 0,
    nextPayoutAmount: null, nextPayoutDate: null, isPayoutFD: false, nominee: '', nomineeRelationship: '',
    tdsApplicable: 'Yes', tdsPercent: 10, panSubmitted: 'Yes', form15G: 'No', renewalCount: 0,
    ...overrides,
  };
}

function sampleRd(overrides: Partial<RecurringDeposit> = {}): RecurringDeposit {
  return {
    id: 'rd-1', rdNumber: 'RD001', bankName: 'ICICI Bank', branch: '', bankAccountNumber: '', customerId: '',
    rdHolderName: '', jointHolder: null, rdType: 'Regular', mode: 'Online', status: 'Active',
    monthlyInstallment: 5000, startDate: '2026-01-01', maturityDate: '2027-01-01', tenureYears: 1, tenureMonths: 0,
    totalMonths: 12, interestRate: 6.5, interestType: 'Compound', compoundingFrequency: 'Quarterly',
    maturityAmount: 62143, totalDeposited: 60000, interestEarnedSoFar: 0, interestEarnedTotal: 2143,
    currentValue: 60000, installmentsTotal: 12, installmentsPaid: 0, installmentsMissed: 0,
    nextInstallmentDate: null, daysRemaining: 365, remarks: '', autoDebit: 'Yes', renewalCount: 0,
    ...overrides,
  };
}

const settings = { enabled: true, leadDays: 3 };
const now = new Date(2026, 5, 1); // 2026-06-01, well before either sample's maturity

describe('planPortfolioReminders', () => {
  it('keeps every notification disabled when the master setting is off', () => {
    expect(planPortfolioReminders([sampleFd()], [sampleRd()], { enabled: false, leadDays: 3 }, now)).toEqual([]);
  });

  it('plans later interest periods as well as FD/RD maturity payouts', () => {
    const planned = planPortfolioReminders([sampleFd({ isPayoutFD: true, interestPayoutMode: 'Monthly' })], [sampleRd()], settings, now);
    expect(planned).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'FD001 interest payout due today', fireDate: '2026-06-01', catchUp: true }),
      expect.objectContaining({ title: 'FD001 interest payout due today', fireDate: '2026-07-01' }),
      expect.objectContaining({ title: 'FD001 interest payout due in 3 days', fireDate: '2026-06-28' }),
      expect.objectContaining({ title: 'FD001 maturity payout due today', fireDate: '2027-01-01' }),
      expect.objectContaining({ title: 'RD001 maturity payout due today', fireDate: '2027-01-01' }),
    ]));
    expect(new Set(planned.map(r => r.id)).size).toBe(planned.length);
  });

  it('mirrors current maturity and auto-renewal attention cards with stable IDs', () => {
    const fd = sampleFd({ maturityDate: '2026-06-12', daysRemaining: 11, autoRenewal: 'Yes' });
    const planned = planPortfolioReminders([fd], [], settings, now);
    expect(planned).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'FD001 matures in 11 days', catchUp: true }),
      expect.objectContaining({ title: 'FD001 auto-renewal pending', catchUp: true }),
    ]));
    const tomorrow = planPortfolioReminders([{ ...fd, daysRemaining: 10 }], [], settings, new Date(2026, 5, 2));
    expect(tomorrow.find(r => r.title === 'FD001 matures in 10 days')?.id).toBe(planned.find(r => r.title === 'FD001 matures in 11 days')?.id);
  });

  it('includes matured and missed-installment alerts but excludes closed records', () => {
    const planned = planPortfolioReminders([sampleFd({ status: 'Matured' }), sampleFd({ id: 'closed', status: 'Closed' })], [sampleRd({ installmentsMissed: 2, nextInstallmentDate: '2026-04-01' })], settings, now);
    expect(planned).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'FD001 matured — action needed', catchUp: true }),
      expect.objectContaining({ title: 'RD001 has 2 missed installments', catchUp: true }),
      expect.objectContaining({ title: 'RD001 installment due today', fireDate: '2026-07-01' }),
    ]));
    expect(planned.some(r => r.recordId === 'closed')).toBe(false);
  });
});

describe('planReminders', () => {
  it('returns nothing when reminders are disabled, regardless of the portfolio', () => {
    expect(planReminders([sampleFd()], [sampleRd()], { enabled: false, leadDays: 3 }, now)).toEqual([]);
  });

  it('plans one reminder per active FD, leadDays before its maturity date', () => {
    const [reminder] = planReminders([sampleFd({ maturityDate: '2027-01-01' })], [], { enabled: true, leadDays: 3 }, now);
    expect(reminder.fireDate).toBe('2026-12-29');
    expect(reminder.kind).toBe('FD');
    expect(reminder.recordId).toBe('fd-1');
  });

  it('plans one reminder per active RD, leadDays before its maturity date', () => {
    const [reminder] = planReminders([], [sampleRd({ maturityDate: '2027-01-01' })], { enabled: true, leadDays: 7 }, now);
    expect(reminder.fireDate).toBe('2026-12-25');
    expect(reminder.kind).toBe('RD');
  });

  it('skips matured, closed, and prematurely-closed records', () => {
    const fds = [
      sampleFd({ id: 'fd-matured', status: 'Matured' }),
      sampleFd({ id: 'fd-closed', status: 'Closed' }),
      sampleFd({ id: 'fd-prem', status: 'Prematurely Closed' }),
      sampleFd({ id: 'fd-active', status: 'Active' }),
    ];
    const planned = planReminders(fds, [], settings, now);
    expect(planned).toHaveLength(1);
    expect(planned[0].recordId).toBe('fd-active');
  });

  it('excludes a reminder whose fire date has already passed', () => {
    // Maturity is only 1 day out, but the lead time wants 3 days' notice — that
    // reminder date is in the past relative to `now` and shouldn't be (re)scheduled.
    const fd = sampleFd({ maturityDate: '2026-06-02' });
    expect(planReminders([fd], [], { enabled: true, leadDays: 3 }, now)).toEqual([]);
  });

  it('includes a reminder whose fire date is exactly today', () => {
    const fd = sampleFd({ maturityDate: '2026-06-04' }); // now + 3 days = fire date of "today"
    const planned = planReminders([fd], [], { enabled: true, leadDays: 3 }, now);
    expect(planned).toHaveLength(1);
    expect(planned[0].fireDate).toBe('2026-06-01');
  });

  it('produces a stable, deterministic id per record so re-planning updates rather than duplicates', () => {
    const fd = sampleFd({ id: 'fd-42' });
    const first = planReminders([fd], [], settings, now);
    const second = planReminders([fd], [], settings, now);
    expect(first[0].id).toBe(second[0].id);
    expect(first[0].id).toBe(`${REMINDER_ID_PREFIX}fd-fd-42`);
  });

  it('produces distinct ids for an FD and RD that happen to share a numeric id suffix', () => {
    const fd = sampleFd({ id: 'x' });
    const rd = sampleRd({ id: 'x' });
    const planned = planReminders([fd], [rd], settings, now);
    const ids = planned.map(r => r.id);
    expect(new Set(ids).size).toBe(2);
  });

  it('includes the bank name and formatted maturity amount in the body', () => {
    const fd = sampleFd({ bankName: 'State Bank of India', maturityAmount: 123456 });
    const [reminder] = planReminders([fd], [], settings, now);
    expect(reminder.body).toContain('State Bank of India');
    expect(reminder.body).toContain('1,23,456');
  });

  it('mixes FD and RD reminders together when both are present', () => {
    const planned = planReminders([sampleFd({ id: 'fd-a' })], [sampleRd({ id: 'rd-a' })], settings, now);
    expect(planned.map(r => r.kind).sort()).toEqual(['FD', 'RD']);
  });
});
