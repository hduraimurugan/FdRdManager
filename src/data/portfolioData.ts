// FD/RD Portfolio Manager — shared types, reference lists, formatting & calculator helpers.
//
// Record shapes here are the *full, derived* view the UI consumes (matches what the
// original design's mock records looked like). What's actually persisted to SQLite is a
// smaller subset — see `StoredFd`/`StoredRd` in `src/data/db.ts` — and `src/data/derive.ts`
// computes the rest (maturity date/amount, current value, interest earned, days
// remaining, status, next payout/installment, ...) fresh against today's date every time.

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
  const dt = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (style === 'short') return `${dt.getDate()} ${months[dt.getMonth()]}`;
  if (style === 'monthYear') return `${months[dt.getMonth()]} ${dt.getFullYear()}`;
  return `${dt.getDate()} ${months[dt.getMonth()]} ${dt.getFullYear()}`;
}

export function daysBetween(a: Date | string, b: Date | string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

const FREQ_N: Record<string, number> = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Yearly: 1 };

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
  const start = new Date(startDate);
  const maturity = new Date(start);
  maturity.setFullYear(maturity.getFullYear() + Number(years || 0));
  maturity.setMonth(maturity.getMonth() + Number(months || 0));
  maturity.setDate(maturity.getDate() + Number(days || 0));
  const totalDays = daysBetween(start, maturity);
  const totalYears = totalDays / 365;
  const r = ratePct / 100;
  const simpleInterest = principal * r * totalYears;
  const n = FREQ_N[compounding] || 4;
  const compoundAmount = principal * Math.pow(1 + r / n, n * totalYears);
  const compoundInterest = compoundAmount - principal;
  const simpleMaturity = principal + simpleInterest;
  const compoundMaturity = compoundAmount;
  const effectiveYield = (Math.pow(compoundAmount / principal, 1 / Math.max(totalYears, 0.0001)) - 1) * 100;
  const interestPerMonth = compoundInterest / Math.max(totalDays / 30.44, 0.0001);
  const interestPerQuarter = interestPerMonth * 3;
  const interestPerYear = compoundInterest / Math.max(totalYears, 0.0001);
  const afterTaxInterest = compoundInterest * (1 - tdsPercent / 100);
  const roi = (compoundInterest / principal) * 100;
  return {
    maturityDate: maturity.toISOString().slice(0, 10), totalDays, totalYears,
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

// RD calculator — approximate bank convention (interest on reducing balance, quarterly compounding)
export function calcRD({ monthlyInstallment, ratePct, startDate, years = 0, months = 0 }: CalcRDInput): CalcRDResult {
  const start = new Date(startDate);
  const totalMonths = Number(years || 0) * 12 + Number(months || 0);
  const maturity = new Date(start);
  maturity.setMonth(maturity.getMonth() + totalMonths);
  const totalDeposited = monthlyInstallment * totalMonths;
  const interestEarned = monthlyInstallment * (ratePct / 100) * totalMonths * (totalMonths + 1) / 24;
  const maturityAmount = totalDeposited + interestEarned;
  return {
    maturityDate: maturity.toISOString().slice(0, 10), totalMonths, totalDeposited,
    interestEarned, maturityAmount,
    effectiveYield: (interestEarned / totalDeposited) * 100 * (12 / Math.max(totalMonths, 1)),
  };
}
