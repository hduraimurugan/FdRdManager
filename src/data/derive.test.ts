import { computeInstallmentsDue, deriveFd, deriveRd, deriveEvents, deriveNotifications } from './derive';
import { fd, rd, NOW } from '../../tests/support/fixtures';

describe('DER: derived records', () => {
  it('DER-001 computes simple FD values independently and clamps accrual before start/after maturity', () => {
    const terms = fd({ interestType: 'Simple', interestRate: 10 });
    expect(deriveFd(terms, new Date(2025, 11, 1)).currentValue).toBe(100000);
    expect(deriveFd(terms, new Date(2027, 1, 1))).toMatchObject({ currentValue: 110000, maturityAmount: 110000, status: 'Matured' });
    expect(terms.status).toBe('Active');
  });
  it('DER-002 compounds quarterly using an independent equation', () => {
    expect(deriveFd(fd(), NOW).maturityAmount).toBe(Math.round(100000 * (1 + 0.07 / 4) ** 4));
  });
  it('DER-003 payout FD retains principal and exposes next interest event', () => {
    const record = deriveFd(fd({ interestPayoutMode: 'Monthly', interestRate: 12 }), NOW);
    expect(record).toMatchObject({ currentValue: 100000, maturityAmount: 100000, nextPayoutDate: '2026-07-01', nextPayoutAmount: 1000, interestEarnedSoFar: 5000 });
    expect(deriveEvents([record], []).map(e => e.type)).toEqual(['Maturity (P+I)', 'Interest']);
  });
  it.each(['Closed', 'Prematurely Closed'])('DER-004 excludes %s records from events and notices', status => {
    const f = deriveFd(fd({ status, interestPayoutMode: 'Monthly' }), NOW);
    const r = deriveRd(rd({ status }), NOW);
    expect(deriveEvents([f], [r])).toEqual([]);
    expect(deriveNotifications([f], [r], NOW)).toEqual([]);
    expect(f.nextPayoutDate).toBeNull();
    expect(r.nextInstallmentDate).toBeNull();
  });
  it('DER-005 handles leap-year month-end maturity', () => {
    expect(deriveFd(fd({ startDate: '2024-01-31', tenureYears: 0, tenureMonths: 1 }), NOW).maturityDate).toBe('2024-02-29');
  });
  it('DER-006 zero-rate RD totals reflect paid installments', () => {
    expect(deriveRd(rd({ interestRate: 0, installmentsPaid: 3 }), NOW)).toMatchObject({ totalDeposited: 15000, currentValue: 15000, installmentsMissed: 3, nextInstallmentDate: '2026-04-01', maturityAmount: 60000 });
  });
  it.each([[0, 0], [12, 12], [24, 12]])('DER-007 caps installment due count for tenure %i', (months, expected) => {
    expect(computeInstallmentsDue('2026-01-01', months, new Date(2026, 11, 1))).toBe(expected);
  });
  it('DER-008 generates stable, linked overdue RD events', () => {
    const events = deriveEvents([], [deriveRd(rd({ installmentsPaid: 0 }), NOW)]);
    expect(events.find(e => e.type === 'Installment Due')).toMatchObject({ recordId: 'rd-1', kind: 'RD', overdue: true, amount: 5000 });
  });
  it('DER-009 ranks matured and missed-installment notices before medium notices', () => {
    const notices = deriveNotifications([deriveFd(fd({ startDate: '2025-01-01' }), NOW)], [deriveRd(rd({ installmentsPaid: 0 }), NOW)], NOW);
    expect(notices).toHaveLength(2);
    expect(notices.every(n => n.severity === 'high')).toBe(true);
    expect(new Set(notices.map(n => n.id)).size).toBe(2);
  });
  it.each([1, 7, 8, 14, 30, 31])('DER-010 maturity notice threshold at %i days', days => {
    const record = { ...deriveFd(fd(), NOW), daysRemaining: days, autoRenewal: 'Yes' };
    const notices = deriveNotifications([record], [], NOW);
    expect(notices).toHaveLength(days > 30 ? 0 : days <= 14 ? 2 : 1);
    if (days <= 30) expect(notices[0].severity).toBe(days <= 7 ? 'high' : 'medium');
  });
  it('BUG-001 future RD has no installments due before its start', () => {
    expect(computeInstallmentsDue('2026-07-01', 12, NOW)).toBe(0);
    expect(deriveRd(rd({ startDate: '2026-07-01', installmentsPaid: 0 }), NOW).installmentsMissed).toBe(0);
  });
  it.each([
    [new Date(2026, 5, 30, 23, 59, 59, 999), 0],
    [new Date(2026, 6, 1), 1],
    [new Date(2026, 6, 1, 12), 1],
    [new Date(2026, 6, 31, 23, 59), 1],
    [new Date(2026, 7, 1), 2],
  ] as const)('BUG-001 as of %s has %i installments due at the start boundary', (now, expected) => {
    expect(computeInstallmentsDue('2026-07-01', 12, now)).toBe(expected);
  });
  it('BUG-001 future RD has no missed-installment alert across a year boundary', () => {
    const record = deriveRd(rd({ startDate: '2027-01-31', installmentsPaid: 0 }), NOW);
    expect(computeInstallmentsDue('2027-01-31', 12, NOW)).toBe(0);
    expect(record.installmentsMissed).toBe(0);
    expect(deriveNotifications([], [record], NOW)).toEqual([]);
    expect(computeInstallmentsDue('2026-07-01', 0, new Date(2026, 6, 1))).toBe(0);
  });
  it('BUG-002 month-end RD installment is due on its clamped date', () => {
    expect(computeInstallmentsDue('2026-01-31', 12, new Date(2026, 1, 28))).toBe(2);
  });
  it.each([
    ['2026-01-31', new Date(2026, 1, 27, 23, 59), 1],
    ['2026-01-31', new Date(2026, 2, 30), 2],
    ['2026-01-31', new Date(2026, 2, 31), 3],
    ['2026-01-31', new Date(2026, 3, 29), 3],
    ['2026-01-31', new Date(2026, 3, 30), 4],
    ['2024-01-31', new Date(2024, 1, 28), 1],
    ['2024-01-31', new Date(2024, 1, 29), 2],
    ['2026-01-30', new Date(2026, 1, 28), 2],
    ['2026-01-29', new Date(2026, 1, 28), 2],
    ['2025-12-31', new Date(2026, 1, 28), 3],
  ] as const)('BUG-002 start %s as of %s has %i installments due', (start, now, expected) => {
    expect(computeInstallmentsDue(start, 12, now)).toBe(expected);
  });
  it('BUG-002 clamped due date updates missed installments and alerts', () => {
    const now = new Date(2026, 1, 28);
    const record = deriveRd(rd({ startDate: '2026-01-31', installmentsPaid: 1 }), now);
    expect(record.installmentsMissed).toBe(1);
    expect(record.nextInstallmentDate).toBe('2026-02-28');
    expect(deriveNotifications([], [record], now)).toEqual(expect.arrayContaining([
      expect.objectContaining({ recordId: 'rd-1', severity: 'high' }),
    ]));
    expect(computeInstallmentsDue('2026-01-31', 2, new Date(2026, 3, 30))).toBe(2);
  });
});
