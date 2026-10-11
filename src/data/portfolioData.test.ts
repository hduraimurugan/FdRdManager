import { calcFD, calcRD, formatINR, formatCompactINR, formatDate, daysBetween } from './portfolioData';
describe('CAL: calculator and formatting contracts', () => {
  it.each(['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'])('CAL-001 independently calculates %s compound FD and tax', compounding => {
    const n = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Yearly: 1 }[compounding]!;
    const result = calcFD({ principal: 100000, ratePct: 8, startDate: '2026-01-01', years: 1, compounding, tdsPercent: 20 });
    const amount = 100000 * (1 + 0.08 / n) ** n;
    expect(result.simpleInterest).toBeCloseTo(8000);
    expect(result.compoundMaturity).toBeCloseTo(amount);
    expect(result.afterTaxInterest).toBeCloseTo((amount - 100000) * 0.8);
    expect(result.roi).toBeCloseTo((amount / 100000 - 1) * 100);
  });
  it.each([0, 6.5])('CAL-002 independently sums RD installments at rate %i', rate => {
    const result = calcRD({ monthlyInstallment: 5000, ratePct: rate, startDate: '2026-01-31', months: 12 });
    const expected = Array.from({ length: 12 }, (_, i) => 5000 * (1 + rate / 400) ** ((12 - i) / 3)).reduce((a, b) => a + b, 0);
    expect(result.maturityAmount).toBeCloseTo(expected);
    expect(result.totalDeposited).toBe(60000);
    expect(result.interestEarned).toBeCloseTo(expected - 60000);
  });
  it('CAL-003 zero amounts and tenure do not emit non-finite results', () => {
    const f = calcFD({ principal: 0, ratePct: 0, startDate: '2026-01-01' });
    const r = calcRD({ monthlyInstallment: 0, ratePct: 0, startDate: '2026-01-01' });
    for (const result of [f, r]) for (const value of Object.values(result)) if (typeof value === 'number') expect(Number.isFinite(value)).toBe(true);
  });
  it.each([[null, '—'], [undefined, '—'], [NaN, '—'], [100000, '₹1,00,000'], [-100, '-₹100']])('FMT-001 formats %s', (value, expected) => expect(formatINR(value as number)).toBe(expected));
  it('FMT-002 handles signed and compact INR thresholds', () => {
    expect(formatINR(100, { signed: true })).toBe('+₹100');
    expect([999, 1000, 100000, 10000000, -1000].map(formatCompactINR)).toEqual(['999', '1 K', '1 L', '1 Cr', '-1 K']);
  });
  it('FMT-003 preserves local date-only values and missing dates', () => {
    expect(formatDate('2024-02-29')).toBe('29 Feb 2024');
    expect(formatDate('2024-02-29', 'monthYear')).toBe('Feb 2024');
    expect(formatDate(null)).toBe('—');
    expect(daysBetween('2024-02-28', '2024-03-01')).toBe(2);
  });
});
