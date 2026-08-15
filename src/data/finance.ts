// Single source of truth for every FD/RD date and money calculation.
//
// Before this module existed the same formulas were written three times each — once in
// the standalone calculators (portfolioData.ts), once in the live portfolio derivation
// (derive.ts), and once in the "estimated maturity" hint on the Add/Edit forms
// (selectors.ts). They had drifted apart and disagreed with each other. Everything now
// delegates here so a fix lands in exactly one place.
//
// Date convention: every 'YYYY-MM-DD' string in the app is a *calendar date*, with no
// time or timezone attached. `parseIsoDate` reads one into a **local**-midnight Date and
// `toIsoDate` writes one back from **local** components. Never use `new Date(iso)` (which
// parses as UTC midnight) or `.toISOString()` (which converts back through UTC) on these
// values — mixing the two shifts the date by a day for every user east of Greenwich.

/** Compounding/payout periods per year. */
export const FREQ_N: Record<string, number> = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Yearly: 1 };

/** Months between two consecutive periods. */
export const FREQ_MONTHS: Record<string, number> = { Monthly: 1, Quarterly: 3, 'Half-Yearly': 6, Yearly: 12 };

/** Frequency used when a record has no recognised value. Matches the app's form default. */
const DEFAULT_FREQ = 'Quarterly';

export function periodsPerYear(frequency: string | undefined): number {
  return FREQ_N[frequency ?? ''] ?? FREQ_N[DEFAULT_FREQ];
}

export function monthsPerPeriod(frequency: string | undefined): number {
  return FREQ_MONTHS[frequency ?? ''] ?? FREQ_MONTHS[DEFAULT_FREQ];
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

/** Today at local midnight, so date-only comparisons are stable for the whole day. */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 'YYYY-MM-DD' from a Date's **local** calendar components. */
export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Today as 'YYYY-MM-DD'. */
export function todayIso(): string {
  return toIsoDate(today());
}

/**
 * 'YYYY-MM-DD' → a **local**-midnight Date.
 *
 * `new Date('2026-08-15')` would parse as UTC midnight, which is 15 Aug 05:30 in IST but
 * 14 Aug 19:00 in New York — so the calendar day silently changes depending on where the
 * user is. Constructing from explicit components avoids that entirely.
 */
export function parseIsoDate(iso: string | Date): Date {
  if (iso instanceof Date) {
    const copy = new Date(iso);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!match) {
    // Not an ISO date string — fall back to the platform parser rather than throwing,
    // then normalise to local midnight so downstream arithmetic stays consistent.
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return today();
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0);
}

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function lastDayOfMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/**
 * Adds whole months, clamping to the end of the target month.
 *
 * JavaScript's `setMonth` overflows instead of clamping: 31 Jan + 1 month becomes 3 Mar,
 * not 28 Feb. Banks clamp — a deposit made on the 31st matures on the last day of the
 * target month — so every tenure in this app clamps too.
 */
export function addMonthsClamped(start: Date, months: number): Date {
  const n = Math.trunc(Number(months) || 0);
  const year = start.getFullYear();
  const monthIndex = start.getMonth();
  const day = start.getDate();

  const totalMonths = monthIndex + n;
  const targetYear = year + Math.floor(totalMonths / 12);
  const targetMonth = ((totalMonths % 12) + 12) % 12;

  const clampedDay = Math.min(day, lastDayOfMonth(targetYear, targetMonth));
  return new Date(targetYear, targetMonth, clampedDay, 0, 0, 0, 0);
}

/** Adds a Y/M/D tenure. Years and months are combined and clamped; days are exact. */
export function addTenure(start: Date, years: number, months: number, days: number): Date {
  const totalMonths = (Math.trunc(Number(years) || 0) * 12) + Math.trunc(Number(months) || 0);
  const afterMonths = addMonthsClamped(start, totalMonths);
  const extraDays = Math.trunc(Number(days) || 0);
  if (extraDays === 0) return afterMonths;
  return new Date(afterMonths.getFullYear(), afterMonths.getMonth(), afterMonths.getDate() + extraDays, 0, 0, 0, 0);
}

/** Adds (or, with a negative count, subtracts) whole calendar days to an ISO date. */
export function addDays(iso: string, days: number): string {
  const d = parseIsoDate(iso);
  return toIsoDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + Math.trunc(days), 0, 0, 0, 0));
}

/**
 * Whole calendar days from `a` to `b`. Both are normalised to local midnight first, so a
 * DST transition in between cannot produce a 23- or 25-hour "day" and skew the count.
 */
export function daysBetween(a: Date | string, b: Date | string): number {
  const from = parseIsoDate(a);
  const to = parseIsoDate(b);
  return Math.round((to.getTime() - from.getTime()) / 86400000);
}

/**
 * Tenure in years, used as the exponent in the compounding formulas.
 *
 * Uses a flat 365-day year, matching what the app has always done. This slightly
 * over-states tenures that span a leap day (a 5-year FD from 2024-01-01 covers 1827 days
 * → 5.0055 years). Switching to an actual/365-vs-366 day count is tracked as a follow-up;
 * it is deliberately isolated here so it becomes a one-line change.
 */
export function yearsBetween(start: Date | string, end: Date | string): number {
  return daysBetween(start, end) / 365;
}

// ---------------------------------------------------------------------------
// Fixed deposits
// ---------------------------------------------------------------------------

export interface FdTerms {
  principal: number;
  ratePct: number;
  startDate: string;
  years?: number;
  months?: number;
  days?: number;
  /** 'Simple' | 'Compound'. Anything else is treated as compound. */
  interestType?: string;
  compounding?: string;
  /** 'At Maturity' reinvests; any frequency pays out periodically. */
  payoutMode?: string;
}

/** True when interest is paid out periodically rather than reinvested until maturity. */
export function isPayoutFd(payoutMode: string | undefined): boolean {
  return (payoutMode ?? 'At Maturity') !== 'At Maturity';
}

export function fdMaturityDate(startDate: string, years = 0, months = 0, days = 0): string {
  return toIsoDate(addTenure(parseIsoDate(startDate), years, months, days));
}

/** Simple interest: P × r × t. */
export function simpleAmount(principal: number, ratePct: number, years: number): number {
  return principal * (1 + (ratePct / 100) * years);
}

/** Compound interest: P × (1 + r/n)^(n·t). */
export function compoundAmount(principal: number, ratePct: number, compounding: string | undefined, years: number): number {
  const n = periodsPerYear(compounding);
  return principal * Math.pow(1 + ratePct / 100 / n, n * years);
}

/**
 * Value of a reinvesting FD after `years`, honouring the record's Simple/Compound choice.
 *
 * The Add/Edit form has always offered that choice and the detail screen has always shown
 * it, but every calculation used to compound unconditionally — so a deposit labelled
 * "Simple" was quoted compound figures.
 */
export function fdAccruedAmount(
  principal: number,
  ratePct: number,
  interestType: string | undefined,
  compounding: string | undefined,
  years: number,
): number {
  if (years <= 0 || principal <= 0) return principal;
  return interestType === 'Simple'
    ? simpleAmount(principal, ratePct, years)
    : compoundAmount(principal, ratePct, compounding, years);
}

/**
 * Interest paid out in one period of a payout FD.
 *
 * Keyed on the **payout** frequency, not the compounding frequency. Those are separate
 * fields and they are frequently different — a monthly-payout FD on the app's default
 * quarterly compounding used to be quoted a full quarter's interest every month.
 */
export function payoutPerPeriod(principal: number, ratePct: number, payoutMode: string | undefined): number {
  const n = periodsPerYear(payoutMode);
  return (principal * (ratePct / 100)) / n;
}

/** Every scheduled payout date from `startDate` up to and including maturity. */
export function payoutSchedule(startDate: string, payoutMode: string | undefined, maturityDate: string): string[] {
  if (!isPayoutFd(payoutMode)) return [];
  const step = monthsPerPeriod(payoutMode);
  const start = parseIsoDate(startDate);
  const maturity = parseIsoDate(maturityDate);
  const dates: string[] = [];
  // Guard against a pathological tenure producing an unbounded loop.
  for (let i = 1; i <= 1200; i++) {
    const scheduled = addMonthsClamped(start, step * i);
    if (scheduled > maturity) break;
    dates.push(toIsoDate(scheduled));
  }
  return dates;
}

/** Total interest a payout FD pays across its whole tenure. */
export function payoutInterestTotal(
  principal: number,
  ratePct: number,
  payoutMode: string | undefined,
  startDate: string,
  maturityDate: string,
): number {
  return payoutPerPeriod(principal, ratePct, payoutMode) * payoutSchedule(startDate, payoutMode, maturityDate).length;
}

// ---------------------------------------------------------------------------
// Recurring deposits
// ---------------------------------------------------------------------------

export function rdMaturityDate(startDate: string, totalMonths: number): string {
  return toIsoDate(addMonthsClamped(parseIsoDate(startDate), totalMonths));
}

/**
 * RD maturity value using the standard Indian bank formula — quarterly compounding on
 * each monthly instalment for the time it is actually on deposit:
 *
 *     M = R · [(1 + i)^n − 1] / [1 − (1 + i)^(−1/3)]
 *
 * with R = monthly instalment, i = annual rate / 400 (the quarterly rate), and
 * n = tenure in quarters.
 *
 * This replaces the previous `R · r · n(n+1)/24` approximation, which is simple interest
 * on a reducing balance despite its comment claiming quarterly compounding. That
 * approximation ran ~1.5% low over five years and ~6% low over ten.
 */
export function rdMaturityAmount(monthlyInstallment: number, ratePct: number, totalMonths: number): number {
  if (monthlyInstallment <= 0 || totalMonths <= 0) return 0;
  if (ratePct <= 0) return monthlyInstallment * totalMonths;

  const i = ratePct / 100 / 4;
  const quarters = totalMonths / 3;
  const denominator = 1 - Math.pow(1 + i, -1 / 3);
  if (denominator === 0) return monthlyInstallment * totalMonths;

  return monthlyInstallment * ((Math.pow(1 + i, quarters) - 1) / denominator);
}

/** Interest component of an RD at maturity. */
export function rdInterestTotal(monthlyInstallment: number, ratePct: number, totalMonths: number): number {
  if (monthlyInstallment <= 0 || totalMonths <= 0) return 0;
  return rdMaturityAmount(monthlyInstallment, ratePct, totalMonths) - monthlyInstallment * totalMonths;
}

/**
 * Value accrued after `installmentsPaid` instalments — the same bank formula applied to
 * the instalments actually deposited so far, so partial progress and the final maturity
 * figure are computed consistently.
 */
export function rdAccruedAmount(monthlyInstallment: number, ratePct: number, installmentsPaid: number): number {
  return rdMaturityAmount(monthlyInstallment, ratePct, Math.max(0, installmentsPaid));
}

// ---------------------------------------------------------------------------
// Shared guards
// ---------------------------------------------------------------------------

/** Replaces NaN/±Infinity with a fallback, so percentages never render as "NaN%". */
export function finiteOr(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}
