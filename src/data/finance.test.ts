// Regression coverage for every calculation/date bug found in the v1.0 production
// readiness audit (see the audit's §3.2 "Incorrect financial calculations"). Each
// `it` below is named after the audit finding it guards.

import {
  addMonthsClamped,
  addTenure,
  daysBetween,
  fdAccruedAmount,
  fdMaturityDate,
  finiteOr,
  isLeapYear,
  isPayoutFd,
  parseIsoDate,
  payoutInterestTotal,
  payoutPerPeriod,
  payoutSchedule,
  rdAccruedAmount,
  rdInterestTotal,
  rdMaturityAmount,
  rdMaturityDate,
  toIsoDate,
  todayIso,
  yearsBetween,
} from './finance';

describe('parseIsoDate / toIsoDate (C1 — timezone-safe date handling)', () => {
  it('round-trips a date string without shifting days', () => {
    expect(toIsoDate(parseIsoDate('2026-08-15'))).toBe('2026-08-15');
    expect(toIsoDate(parseIsoDate('2024-02-29'))).toBe('2024-02-29');
    expect(toIsoDate(parseIsoDate('2026-01-01'))).toBe('2026-01-01');
  });

  it('parses as local midnight, not UTC midnight', () => {
    const d = parseIsoDate('2026-08-15');
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(7); // August
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });

  it('todayIso() matches the platform\'s local calendar date in every timezone', () => {
    // This is the exact bug from the audit: today().toISOString().slice(0,10) converts
    // local midnight through UTC and returns yesterday's date for any timezone with a
    // positive UTC offset. toIsoDate() must never go through toISOString().
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(todayIso()).toBe(expected);
  });
});

describe('addMonthsClamped / addTenure (C6 — month-end and leap-day rollover)', () => {
  it('clamps 31 Jan + 1 month to the last day of February, not into March', () => {
    expect(toIsoDate(addMonthsClamped(parseIsoDate('2025-01-31'), 1))).toBe('2025-02-28');
    expect(toIsoDate(addMonthsClamped(parseIsoDate('2024-01-31'), 1))).toBe('2024-02-29'); // leap year
  });

  it('clamps 31 Aug + 6 months to the last day of February', () => {
    expect(toIsoDate(addMonthsClamped(parseIsoDate('2024-08-31'), 6))).toBe('2025-02-28');
  });

  it('clamps 29 Feb (leap day) + 1 year to 28 Feb the following year', () => {
    expect(toIsoDate(addMonthsClamped(parseIsoDate('2024-02-29'), 12))).toBe('2025-02-28');
  });

  it('clamps 31 May + 1 month to 30 June', () => {
    expect(toIsoDate(addMonthsClamped(parseIsoDate('2024-05-31'), 1))).toBe('2024-06-30');
  });

  it('does not clamp when the day already exists in the target month', () => {
    expect(toIsoDate(addMonthsClamped(parseIsoDate('2026-01-15'), 1))).toBe('2026-02-15');
  });

  it('addTenure combines years/months (clamped) with exact day offsets', () => {
    expect(toIsoDate(addTenure(parseIsoDate('2025-01-31'), 0, 1, 0))).toBe('2025-02-28');
    expect(toIsoDate(addTenure(parseIsoDate('2026-01-01'), 1, 0, 0))).toBe('2027-01-01');
    expect(toIsoDate(addTenure(parseIsoDate('2026-01-01'), 0, 0, 10))).toBe('2026-01-11');
    // fdMaturityDate is the string-in/string-out wrapper screens actually call — same result.
    expect(fdMaturityDate('2025-01-31', 0, 1, 0)).toBe('2025-02-28');
    expect(fdMaturityDate('2026-01-01', 1, 0, 0)).toBe('2027-01-01');
    expect(fdMaturityDate('2026-01-01', 0, 0, 10)).toBe('2026-01-11');
  });

  it('handles a zero tenure without throwing', () => {
    expect(fdMaturityDate('2026-01-01', 0, 0, 0)).toBe('2026-01-01');
  });
});

describe('daysBetween / yearsBetween / isLeapYear (C12 — leap years)', () => {
  it('counts calendar days independent of time-of-day', () => {
    expect(daysBetween('2026-01-01', '2026-01-02')).toBe(1);
    expect(daysBetween('2026-01-01', '2027-01-01')).toBe(365);
    expect(daysBetween('2024-01-01', '2025-01-01')).toBe(366); // leap year
  });

  it('identifies leap years correctly, including century exceptions', () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2026)).toBe(false);
    expect(isLeapYear(1900)).toBe(false); // divisible by 100, not 400
    expect(isLeapYear(2000)).toBe(true); // divisible by 400
  });

  it('yearsBetween a tenure spanning a leap day is slightly over one year', () => {
    const years = yearsBetween('2024-01-01', '2025-01-01');
    expect(years).toBeGreaterThan(1);
    expect(years).toBeCloseTo(366 / 365, 5);
  });
});

describe('isPayoutFd / payoutPerPeriod / payoutSchedule (C7, C8 — payout FD interest)', () => {
  it('is not a payout FD when interest reinvests at maturity', () => {
    expect(isPayoutFd('At Maturity')).toBe(false);
    expect(isPayoutFd(undefined)).toBe(false);
  });

  it('is a payout FD for any periodic payout mode', () => {
    expect(isPayoutFd('Monthly')).toBe(true);
    expect(isPayoutFd('Quarterly')).toBe(true);
  });

  it('C8 — payout amount is keyed on payout frequency, not compounding frequency', () => {
    // Audit finding: a ₹10L, 7% FD compounding quarterly but paying out monthly used to
    // show ₹17,500/month (a full quarter's interest) instead of the correct ₹5,833.
    const monthly = payoutPerPeriod(1000000, 7, 'Monthly');
    const quarterly = payoutPerPeriod(1000000, 7, 'Quarterly');
    expect(Math.round(monthly)).toBe(5833);
    expect(Math.round(quarterly)).toBe(17500);
    // Compounding frequency must have zero influence on the payout amount.
    expect(payoutPerPeriod(1000000, 7, 'Monthly')).toBe(monthly);
  });

  it('builds a monthly payout schedule that never runs past maturity', () => {
    const maturity = fdMaturityDate('2026-01-01', 1, 0, 0); // 2027-01-01
    const schedule = payoutSchedule('2026-01-01', 'Monthly', maturity);
    expect(schedule).toHaveLength(12);
    expect(schedule[0]).toBe('2026-02-01');
    expect(schedule[schedule.length - 1]).toBe(maturity);
  });

  it('returns an empty schedule for an at-maturity FD', () => {
    expect(payoutSchedule('2026-01-01', 'At Maturity', '2027-01-01')).toEqual([]);
  });

  it('C7 — payout FD total interest is no longer forced to zero', () => {
    // Audit finding: interestEarnedTotal was computed as maturityAmount - principal, but
    // maturityAmount was set equal to principal for payout FDs, so it was always 0.
    const start = '2026-01-01';
    const maturity = fdMaturityDate(start, 1, 0, 0);
    const total = payoutInterestTotal(1000000, 7, 'Quarterly', start, maturity);
    expect(total).toBeGreaterThan(0);
    expect(Math.round(total)).toBe(70000); // 4 quarterly payouts of 17,500
  });
});

describe('fdAccruedAmount (C10 — interestType is honoured)', () => {
  it('C10 — a Simple-interest FD is no longer silently compounded', () => {
    const principal = 100000;
    const rate = 7;
    const years = 3;
    const simple = fdAccruedAmount(principal, rate, 'Simple', 'Quarterly', years);
    const compound = fdAccruedAmount(principal, rate, 'Compound', 'Quarterly', years);
    expect(simple).toBeCloseTo(principal * (1 + (rate / 100) * years), 6);
    expect(compound).toBeGreaterThan(simple); // compounding must earn strictly more
  });

  it('treats an unrecognised interestType as compound (form default)', () => {
    const compound = fdAccruedAmount(100000, 7, 'Compound', 'Quarterly', 1);
    const unspecified = fdAccruedAmount(100000, 7, undefined, 'Quarterly', 1);
    expect(unspecified).toBeCloseTo(compound, 6);
  });

  it('returns the principal unchanged for a zero or negative tenure', () => {
    expect(fdAccruedAmount(100000, 7, 'Compound', 'Quarterly', 0)).toBe(100000);
  });
});

describe('rdMaturityAmount / rdInterestTotal (C9 — RD bank-standard formula)', () => {
  // Reference values are the standard Indian bank RD formula
  // M = R·[(1+i)^n − 1]/(1−(1+i)^(−1/3)), independently computed.
  it('matches the bank formula at 12/36/60/120 months for ₹5,000 @ 6.5%', () => {
    expect(Math.round(rdMaturityAmount(5000, 6.5, 12))).toBe(62143);
    expect(Math.round(rdMaturityAmount(5000, 6.5, 36))).toBe(199122);
    expect(Math.round(rdMaturityAmount(5000, 6.5, 60))).toBe(354954);
    expect(Math.round(rdMaturityAmount(5000, 6.5, 120))).toBe(844940);
  });

  it('is no longer the old simple-interest-on-reducing-balance approximation', () => {
    // The old formula (R * r * n(n+1)/24) gave 796,625 at 120 months — 6% below the
    // correct bank figure. The new formula must clear that old (wrong) value.
    const oldApproximation = 5000 * (6.5 / 100) * 120 * 121 / 24;
    const corrected = rdMaturityAmount(5000, 6.5, 120);
    expect(corrected).toBeGreaterThan(oldApproximation);
    expect(corrected - oldApproximation).toBeGreaterThan(40000);
  });

  it('interest total equals maturity amount minus total deposited', () => {
    const maturity = rdMaturityAmount(5000, 6.5, 24);
    const interest = rdInterestTotal(5000, 6.5, 24);
    expect(interest).toBeCloseTo(maturity - 5000 * 24, 6);
  });

  it('handles a zero rate as pure deposit with no interest', () => {
    expect(rdMaturityAmount(5000, 0, 12)).toBe(5000 * 12);
    expect(rdInterestTotal(5000, 0, 12)).toBe(0);
  });

  it('handles zero installment or zero tenure without NaN', () => {
    expect(rdMaturityAmount(0, 6.5, 12)).toBe(0);
    expect(rdMaturityAmount(5000, 6.5, 0)).toBe(0);
    expect(Number.isFinite(rdMaturityAmount(0, 6.5, 0))).toBe(true);
  });
});

describe('rdAccruedAmount', () => {
  it('accrued value at full tenure equals the maturity amount', () => {
    const totalMonths = 24;
    expect(rdAccruedAmount(5000, 6.5, totalMonths)).toBeCloseTo(rdMaturityAmount(5000, 6.5, totalMonths), 6);
  });

  it('accrued value is zero with no installments paid', () => {
    expect(rdAccruedAmount(5000, 6.5, 0)).toBe(0);
  });
});

describe('rdMaturityDate', () => {
  it('adds months with end-of-month clamping, same as FD tenure', () => {
    expect(rdMaturityDate('2025-01-31', 1)).toBe('2025-02-28');
    expect(rdMaturityDate('2026-01-01', 24)).toBe('2028-01-01');
  });
});

describe('finiteOr (C12 — NaN guards)', () => {
  it('replaces NaN and Infinity with the fallback', () => {
    expect(finiteOr(NaN)).toBe(0);
    expect(finiteOr(Infinity, -1)).toBe(-1);
    expect(finiteOr(-Infinity)).toBe(0);
  });

  it('passes finite numbers through unchanged, including zero and negatives', () => {
    expect(finiteOr(42)).toBe(42);
    expect(finiteOr(0)).toBe(0);
    expect(finiteOr(-3.5)).toBe(-3.5);
  });
});
