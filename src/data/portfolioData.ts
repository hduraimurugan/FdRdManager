// FD/RD Portfolio Manager — shared types, reference lists, formatting & calculator helpers.
//
// Record shapes here are the *full, derived* view the UI consumes (matches what the
// original design's mock records looked like). What's actually persisted to SQLite is a
// smaller subset — see `StoredFd`/`StoredRd` in `src/data/db.ts` — and `src/data/derive.ts`
// computes the rest (maturity date/amount, current value, interest earned, days
// remaining, status, next payout/installment, ...) fresh against today's date every time.
//
// All date arithmetic and interest formulas below delegate to `src/data/finance.ts`, the
// single source of truth for this app's FD/RD math — see that file's header for why.

import {
  fdMaturityDate,
  simpleAmount,
  compoundAmount,
  rdMaturityDate,
  rdMaturityAmount,
  rdInterestTotal,
  daysBetween as financeDaysBetween,
  parseIsoDate,
  finiteOr,
} from './finance';

export interface FixedDeposit {
  id: string;
  fdNumber: string;
  bankName: string;
  branch: string;
  bankAccountNumber: string;
  customerId: string;
  fdHolderName: string;
  jointHolder: string | null;
  fdType: string;
  mode: string;
  status: string;
  principalAmount: number;
  depositDate: string;
  startDate: string;
  maturityDate: string;
  tenureYears: number;
  tenureMonths: number;
  tenureDays: number;
  interestRate: number;
  interestType: string;
  compoundingFrequency: string;
  interestPayoutMode: string;
  interestCreditMethod: string;
  autoRenewal: string;
  renewalOption: string;
  remarks: string;
  maturityAmount: number;
  currentValue: number;
  interestEarnedTotal: number;
  interestEarnedSoFar: number;
  daysRemaining: number;
  totalDays: number;
  elapsedDays: number;
  nextPayoutAmount: number | null;
  nextPayoutDate: string | null;
  isPayoutFD: boolean;
  nominee: string;
  nomineeRelationship: string;
  tdsApplicable: string;
  tdsPercent: number;
  panSubmitted: string;
  form15G: string;
  renewalCount: number;
}

export interface RecurringDeposit {
  id: string;
  rdNumber: string;
  bankName: string;
  branch: string;
  bankAccountNumber: string;
  customerId: string;
  rdHolderName: string;
  jointHolder: string | null;
  rdType: string;
  mode: string;
  status: string;
  monthlyInstallment: number;
  startDate: string;
  maturityDate: string;
  tenureYears: number;
  tenureMonths: number;
  totalMonths: number;
  interestRate: number;
  interestType: string;
  compoundingFrequency: string;
  maturityAmount: number;
  totalDeposited: number;
  interestEarnedSoFar: number;
  interestEarnedTotal: number;
  currentValue: number;
  installmentsTotal: number;
  installmentsPaid: number;
  installmentsMissed: number;
  nextInstallmentDate: string | null;
  daysRemaining: number;
  remarks: string;
  autoDebit: string;
  renewalCount: number;
}

export interface PortfolioEvent {
  id: string;
  kind: 'FD' | 'RD';
  number: string;
  bank: string;
  type: string;
  amount: number;
  date: string;
  recordId: string;
  overdue: boolean;
}

export interface PortfolioNotification {
  id: string;
  icon: 'alert' | 'clock' | 'wallet' | 'refresh';
  severity: 'high' | 'medium';
  title: string;
  subtitle: string;
  date: string;
  recordType: 'FD' | 'RD';
  recordId: string;
}

export const BANKS = [
  'HDFC Bank',
  'ICICI Bank',
  'State Bank of India',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Punjab National Bank',
  'Bank of Baroda',
  'Yes Bank',
  'IDFC First Bank',
  'Canara Bank',
];
export const FD_TYPES = ['Regular', 'Senior Citizen', 'Tax Saver', 'NRE', 'NRO', 'Corporate'];
export const RD_TYPES = ['Regular', 'Senior Citizen'];
export const STATUSES = ['Active', 'Matured', 'Closed', 'Prematurely Closed'];
export const COMPOUNDING_FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly'];
export const PAYOUT_FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly', 'At Maturity'];
export const CREDIT_METHODS = ['Credited to Savings Account', 'Reinvested into FD'];

export function formatINR(n: number | null | undefined, opts: { signed?: boolean } = {}): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const v = Math.round(n);
  const s = Math.abs(v).toLocaleString('en-IN');
  return (opts.signed && v > 0 ? '+' : '') + (v < 0 ? '-' : '') + '₹' + s;
}

export function formatCompactINR(n: number | null | undefined): string {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (abs >= 1e7) return (n / 1e7).toFixed(2).replace(/\.00$/, '') + ' Cr';
  if (abs >= 1e5) return (n / 1e5).toFixed(2).replace(/\.00$/, '') + ' L';
  if (abs >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + ' K';
  return String(Math.round(n));
}

export function formatDate(iso: string | null | undefined, style: 'medium' | 'short' | 'monthYear' = 'medium'): string {
  if (!iso) return '—';
  // parseIsoDate reads local calendar components — new Date(iso) parses ISO date-only
  // strings as UTC midnight, which rolls the displayed date back a day for anyone west
  // of Greenwich (e.g. NRE/NRO account holders viewing their FDs from the US).
  const dt = parseIsoDate(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (style === 'short') return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
  if (style === 'monthYear') return `${months[dt.getMonth()]} ${dt.getFullYear()}`;
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function daysBetween(a: Date | string, b: Date | string): number {
  return financeDaysBetween(a, b);
}

export interface CalcFDInput {
  principal: number;
  ratePct: number;
  startDate: string;
  years?: number;
  months?: number;
  days?: number;
  compounding?: string;
  payoutFrequency?: string;
  tdsPercent?: number;
}

export interface CalcFDResult {
  maturityDate: string;
  totalDays: number;
  totalYears: number;
  simpleInterest: number;
  compoundInterest: number;
  simpleMaturity: number;
  compoundMaturity: number;
  effectiveYield: number;
  interestPerMonth: number;
  interestPerQuarter: number;
  interestPerYear: number;
  afterTaxInterest: number;
  roi: number;
  monthlyGrowth: number;
  quarterlyGrowth: number;
  annualGrowth: number;
}

// FD calculator — independent scenario, mirrors FD Master workbook logic
export function calcFD({
  principal, ratePct, startDate, years = 0, months = 0, days = 0,
  compounding = 'Quarterly', tdsPercent = 10,
}: CalcFDInput): CalcFDResult {
  const maturityDate = fdMaturityDate(startDate, years, months, days);
  const totalDays = daysBetween(startDate, maturityDate);
  const totalYears = totalDays / 365;
  const simpleMaturity = simpleAmount(principal, ratePct, totalYears);
  const simpleInterest = simpleMaturity - principal;
  const compoundMaturity = principal > 0 ? compoundAmount(principal, ratePct, compounding, totalYears) : principal;
  const compoundInterest = compoundMaturity - principal;
  const effectiveYield = principal > 0
    ? finiteOr((Math.pow(compoundMaturity / principal, 1 / Math.max(totalYears, 0.0001)) - 1) * 100)
    : 0;
  const interestPerMonth = compoundInterest / Math.max(totalDays / 30.44, 0.0001);
  const interestPerQuarter = interestPerMonth * 3;
  const interestPerYear = compoundInterest / Math.max(totalYears, 0.0001);
  const afterTaxInterest = compoundInterest * (1 - tdsPercent / 100);
  const roi = principal > 0 ? finiteOr((compoundInterest / principal) * 100) : 0;
  return {
    maturityDate, totalDays, totalYears,
    simpleInterest, compoundInterest, simpleMaturity, compoundMaturity,
    effectiveYield, interestPerMonth, interestPerQuarter, interestPerYear,
    afterTaxInterest, roi,
    monthlyGrowth: compoundInterest / Math.max(totalDays / 30.44, 0.0001),
    quarterlyGrowth: interestPerQuarter, annualGrowth: interestPerYear,
  };
}

export interface CalcRDInput {
  monthlyInstallment: number;
  ratePct: number;
  startDate: string;
  years?: number;
  months?: number;
}

export interface CalcRDResult {
  maturityDate: string;
  totalMonths: number;
  totalDeposited: number;
  interestEarned: number;
  maturityAmount: number;
  effectiveYield: number;
}

// RD calculator — standard Indian bank convention: quarterly compounding on each
// instalment for the time it's actually on deposit. See finance.ts's rdMaturityAmount
// for the formula and why it replaced the old simple-interest approximation.
export function calcRD({ monthlyInstallment, ratePct, startDate, years = 0, months = 0 }: CalcRDInput): CalcRDResult {
  const totalMonths = Number(years || 0) * 12 + Number(months || 0);
  const maturityDate = rdMaturityDate(startDate, totalMonths);
  const totalDeposited = monthlyInstallment * totalMonths;
  const interestEarned = rdInterestTotal(monthlyInstallment, ratePct, totalMonths);
  const maturityAmount = totalDeposited > 0 ? rdMaturityAmount(monthlyInstallment, ratePct, totalMonths) : 0;
  return {
    maturityDate, totalMonths, totalDeposited,
    interestEarned, maturityAmount,
    effectiveYield: totalDeposited > 0 ? finiteOr((interestEarned / totalDeposited) * 100 * (12 / Math.max(totalMonths, 1))) : 0,
  };
}
