import {
  FixedDeposit,
  RecurringDeposit,
  PortfolioEvent,
  PortfolioNotification,
  formatINR,
  formatCompactINR,
  formatDate,
  daysBetween,
} from '../data/portfolioData';
import { today } from '../data/derive';
import {
  todayIso,
  parseIsoDate,
  addMonthsClamped,
  fdMaturityDate,
  fdAccruedAmount,
  isPayoutFd,
  payoutPerPeriod,
  payoutSchedule,
  rdMaturityDate,
  rdMaturityAmount,
} from '../data/finance';
import { ThemeTokens, GradientSpec, TYPE_COLORS } from '../theme/colors';
import { AppState } from './AppContext';

export type Fill = string | GradientSpec;

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

// ---------------------------------------------------------------------------
// Bank avatar — static palette, independent of theme (matches the prototype).
// ---------------------------------------------------------------------------
const AVATAR_PALETTE: [string, string][] = [
  ['rgba(111,102,232,0.14)', '#6f66e8'],
  ['rgba(91,158,224,0.16)', '#4f8fd1'],
  ['rgba(14,164,114,0.14)', '#0ea472'],
  ['rgba(226,121,63,0.15)', '#e2793f'],
  ['rgba(201,134,26,0.15)', '#c9861a'],
  ['rgba(176,111,214,0.15)', '#b06fd6'],
];

export function bankAvatar(bankName: string) {
  let hash = 0;
  for (let i = 0; i < bankName.length; i++) hash = (hash * 31 + bankName.charCodeAt(i)) >>> 0;
  const [bg, fg] = AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
  const initials =
    bankName
      .split(' ')
      .filter(w => w.length > 2 || /^[A-Z]+$/.test(w))
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase() || bankName.slice(0, 2).toUpperCase();
  return { avatarBg: bg, avatarFg: fg, bankInitials: initials };
}

// ---------------------------------------------------------------------------
// Status colors
// ---------------------------------------------------------------------------
type Urgency = 'payout' | 'maturing' | null;

export function statusColors(theme: ThemeTokens, status: string, urgency: Urgency) {
  if (status === 'Active') {
    if (urgency === 'payout') return { bg: 'rgba(226,121,63,0.14)', fg: theme.orange, label: 'Payout due' };
    if (urgency === 'maturing') return { bg: 'rgba(201,134,26,0.14)', fg: theme.warning, label: 'Maturing soon' };
    return { bg: 'rgba(14,164,114,0.13)', fg: theme.success, label: 'Active' };
  }
  if (status === 'Matured') return { bg: 'rgba(226,73,90,0.13)', fg: theme.danger, label: 'Matured' };
  if (status === 'Prematurely Closed') return { bg: 'rgba(91,97,120,0.1)', fg: theme.textMuted, label: 'Prematurely closed' };
  return { bg: 'rgba(91,97,120,0.1)', fg: theme.textMuted, label: 'Closed' };
}

// ---------------------------------------------------------------------------
// Decorated list items
// ---------------------------------------------------------------------------
export interface DecoratedFD extends FixedDeposit {
  kind: 'FD';
  number: string;
  typeLabel: string;
  amountFmt: string;
  rateLabel: string;
  statusBg: string;
  statusFg: string;
  statusLabel: string;
  progressLabel: string;
  maturityLabel: string;
  progressPct: number;
  progressColor: Fill;
}

export function decorateFD(fd: FixedDeposit, theme: ThemeTokens): DecoratedFD {
  const dr = fd.daysRemaining;
  let urgency: Urgency = null;
  if (fd.status === 'Active') {
    const payoutDr = fd.isPayoutFD && fd.nextPayoutDate ? daysBetween(today(), fd.nextPayoutDate) : null;
    if (payoutDr !== null && payoutDr <= 7 && payoutDr >= 0) {
      urgency = 'payout';
    } else if (dr >= 0 && dr <= 30) {
      urgency = 'maturing';
    }
  }
  const sc = statusColors(theme, fd.status, urgency);
  const pct = clamp((fd.elapsedDays / fd.totalDays) * 100, 0, 100);
  return {
    ...fd,
    kind: 'FD',
    number: fd.fdNumber,
    typeLabel: fd.fdType,
    amountFmt: formatINR(fd.principalAmount),
    rateLabel: fd.interestRate + '% p.a.',
    statusBg: sc.bg,
    statusFg: sc.fg,
    statusLabel: sc.label,
    progressLabel: fd.status === 'Active' ? Math.round(pct) + '% of tenure' : sc.label,
    maturityLabel: (fd.status === 'Active' ? 'Matures ' : 'Matured ') + formatDate(fd.maturityDate, 'short'),
    progressPct: Math.round(pct),
    progressColor: urgency === 'payout' ? theme.orange : urgency === 'maturing' ? theme.warning : fd.status === 'Active' ? theme.gradientAccent : theme.textFaint,
  };
}

// ---------------------------------------------------------------------------
// FD statements — past interest payouts already received, derived on the fly
// from the payout schedule (no separate ledger is persisted).
// ---------------------------------------------------------------------------
export interface FdStatementEntry {
  date: string;
  dateLabel: string;
  amount: number;
  amountFmt: string;
  index: number;
}

// Payout amount is keyed on interestPayoutMode (how often interest is actually paid),
// not compoundingFrequency — see finance.ts's payoutPerPeriod for why those can differ.
export function fdStatements(fd: FixedDeposit): FdStatementEntry[] {
  if (!fd.isPayoutFD) return [];
  const perPayout = Math.round(payoutPerPeriod(fd.principalAmount, fd.interestRate, fd.interestPayoutMode));
  const cutoff = today() < parseIsoDate(fd.maturityDate) ? todayIso() : fd.maturityDate;
  return payoutSchedule(fd.startDate, fd.interestPayoutMode, cutoff)
    .map((iso, i) => ({ date: iso, dateLabel: formatDate(iso), amount: perPayout, amountFmt: formatINR(perPayout, { signed: true }), index: i + 1 }))
    .reverse();
}

export interface DecoratedRD extends RecurringDeposit {
  kind: 'RD';
  number: string;
  typeLabel: string;
  amountFmt: string;
  rateLabel: string;
  statusBg: string;
  statusFg: string;
  statusLabel: string;
  progressLabel: string;
  maturityLabel: string;
  progressPct: number;
  progressColor: Fill;
}

export function decorateRD(rd: RecurringDeposit, theme: ThemeTokens): DecoratedRD {
  const dr = rd.daysRemaining;
  let urgency: Urgency = null;
  if (rd.status === 'Active') {
    if (rd.installmentsMissed > 0) urgency = 'payout';
    else if (dr >= 0 && dr <= 30) urgency = 'maturing';
  }
  const sc = statusColors(theme, rd.status, urgency);
  const pct = clamp((rd.installmentsPaid / rd.installmentsTotal) * 100, 0, 100);
  return {
    ...rd,
    kind: 'RD',
    number: rd.rdNumber,
    typeLabel: rd.rdType,
    amountFmt: formatINR(rd.monthlyInstallment) + '/mo',
    rateLabel: rd.interestRate + '% p.a.',
    statusBg: urgency === 'payout' ? 'rgba(226,73,90,0.13)' : sc.bg,
    statusFg: urgency === 'payout' ? theme.danger : sc.fg,
    statusLabel: urgency === 'payout' ? 'Installment missed' : sc.label,
    progressLabel: rd.installmentsPaid + '/' + rd.installmentsTotal + ' installments',
    maturityLabel: (rd.status === 'Active' ? 'Matures ' : 'Matured ') + formatDate(rd.maturityDate, 'short'),
    progressPct: Math.round(pct),
    progressColor: urgency === 'payout' ? theme.danger : urgency === 'maturing' ? theme.warning : rd.status === 'Active' ? theme.gradientAccent : theme.textFaint,
  };
}

// ---------------------------------------------------------------------------
// Portfolio list filtering / sorting
// ---------------------------------------------------------------------------
export function filteredSorted<T extends FixedDeposit | RecurringDeposit>(
  list: T[],
  kind: 'FD' | 'RD',
  state: Pick<AppState, 'search' | 'filterBank' | 'filterType' | 'filterStatus' | 'sortBy'>,
): T[] {
  let out = list.filter(item => {
    if (state.search) {
      const q = state.search.toLowerCase();
      const holder = kind === 'FD' ? (item as FixedDeposit).fdHolderName : (item as RecurringDeposit).rdHolderName;
      const num = kind === 'FD' ? (item as FixedDeposit).fdNumber : (item as RecurringDeposit).rdNumber;
      if (!(item.bankName.toLowerCase().includes(q) || num.toLowerCase().includes(q) || (holder || '').toLowerCase().includes(q))) return false;
    }
    if (state.filterBank !== 'All' && item.bankName !== state.filterBank) return false;
    const type = kind === 'FD' ? (item as FixedDeposit).fdType : (item as RecurringDeposit).rdType;
    if (state.filterType !== 'All' && type !== state.filterType) return false;
    if (state.filterStatus !== 'All' && item.status !== state.filterStatus) return false;
    return true;
  });
  const amt = (i: T) => (kind === 'FD' ? (i as FixedDeposit).principalAmount : (i as RecurringDeposit).monthlyInstallment);
  if (state.sortBy === 'maturity') {
    out = out.slice().sort((a, b) => {
      const pa = a.status === 'Active' ? 0 : 1;
      const pb = b.status === 'Active' ? 0 : 1;
      return pa !== pb ? pa - pb : new Date(a.maturityDate).getTime() - new Date(b.maturityDate).getTime();
    });
  } else if (state.sortBy === 'amount') {
    out = out.slice().sort((a, b) => amt(b) - amt(a));
  } else if (state.sortBy === 'rate') {
    out = out.slice().sort((a, b) => b.interestRate - a.interestRate);
  }
  return out;
}

// ---------------------------------------------------------------------------
// Home metrics
// ---------------------------------------------------------------------------
export function homeMetrics(state: AppState) {
  const activeFds = state.fdList.filter(f => f.status === 'Active');
  const activeRds = state.rdList.filter(r => r.status === 'Active');
  const fdInvested = state.fdList.reduce((sum, f) => sum + f.principalAmount, 0);
  const rdInvested = state.rdList.reduce((sum, r) => sum + r.totalDeposited, 0);
  const totalInvested = fdInvested + rdInvested;
  const currentValue = activeFds.reduce((a, f) => a + f.currentValue, 0) + activeRds.reduce((a, r) => a + r.currentValue, 0);
  const interestEarned = state.fdList.reduce((a, f) => a + f.interestEarnedSoFar, 0) + state.rdList.reduce((a, r) => a + r.interestEarnedSoFar, 0);
  const maturityValue = activeFds.reduce((a, f) => a + f.maturityAmount, 0) + activeRds.reduce((a, r) => a + r.maturityAmount, 0);
  const now = today();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();
  const inThisMonth = (iso: string) => {
    const dt = parseIsoDate(iso);
    return dt.getMonth() === thisMonth && dt.getFullYear() === thisYear;
  };
  const payoutsThisMonth = state.events.filter(e => (e.type === 'Interest' || e.type === 'Installment Due') && inThisMonth(e.date)).reduce((a, e) => a + e.amount, 0);
  const maturitiesThisMonth = state.events.filter(e => e.type === 'Maturity (P+I)' && inThisMonth(e.date)).length;
  const upcomingMaturityCount = [...activeFds, ...activeRds].filter(x => x.daysRemaining >= 0 && x.daysRemaining <= 365).length;
  const activeInvested = activeFds.reduce((sum, f) => sum + f.principalAmount, 0) + activeRds.reduce((sum, r) => sum + r.totalDeposited, 0);
  const weightedRate = activeInvested > 0
    ? (activeFds.reduce((sum, f) => sum + f.principalAmount * f.interestRate, 0) + activeRds.reduce((sum, r) => sum + r.totalDeposited * r.interestRate, 0)) / activeInvested
    : 0;

  return {
    currentValueExact: formatINR(currentValue),
    fdInvestedFmt: formatINR(fdInvested),
    rdInvestedFmt: formatINR(rdInvested),
    fdCount: state.fdList.length,
    rdCount: state.rdList.length,
    fdShare: totalInvested > 0 ? fdInvested / totalInvested * 100 : 0,
    rdShare: totalInvested > 0 ? rdInvested / totalInvested * 100 : 0,
    weightedRateLabel: weightedRate.toFixed(2) + '%',
    totalInvestedFmt: formatCompactINR(totalInvested),
    totalInvestedCompact: '₹' + formatCompactINR(totalInvested),
    currentValueFmt: formatCompactINR(currentValue),
    interestEarnedFmt: formatCompactINR(interestEarned),
    maturityValueFmt: formatCompactINR(maturityValue),
    activeCount: activeFds.length + activeRds.length,
    maturedCount: [...state.fdList, ...state.rdList].filter(x => x.status === 'Matured').length,
    payoutsThisMonthFmt: '₹' + formatCompactINR(payoutsThisMonth),
    maturitiesThisMonth,
    upcomingMaturityCount,
  };
}

export function urgentNotifications(state: AppState, theme: ThemeTokens) {
  return state.notifications.slice(0, 4).map(n => ({
    ...n,
    accentColor: n.severity === 'high' ? theme.danger : theme.warning,
    tintBg: n.severity === 'high' ? 'rgba(226,73,90,0.08)' : 'rgba(201,134,26,0.09)',
  }));
}

export function bankDistribution(state: AppState) {
  const bankTotals: Record<string, number> = {};
  const bankCounts: Record<string, number> = {};
  [...state.fdList, ...state.rdList].forEach(i => {
    const amt = 'principalAmount' in i ? i.principalAmount : i.totalDeposited;
    bankTotals[i.bankName] = (bankTotals[i.bankName] || 0) + amt;
    bankCounts[i.bankName] = (bankCounts[i.bankName] || 0) + 1;
  });
  const total = Object.values(bankTotals).reduce((sum, amount) => sum + amount, 0);
  return Object.entries(bankTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([bank, amount]) => ({ bank, amount, amountFmt: formatINR(amount), count: bankCounts[bank], pct: total > 0 ? (amount / total) * 100 : 0 }));
}

export interface TypeSlice {
  type: string;
  pctLabel: string;
  color: string;
  fraction: number;
  amountFmt: string;
  count: number;
}

export function typeDistribution(state: AppState, theme: ThemeTokens): { entries: TypeSlice[]; totalCompact: string } {
  const typeTotals: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  [...state.fdList, ...state.rdList].forEach(i => {
    const t = 'fdType' in i ? i.fdType : i.rdType;
    const amt = 'principalAmount' in i ? i.principalAmount : i.totalDeposited;
    typeTotals[t] = (typeTotals[t] || 0) + amt;
    typeCounts[t] = (typeCounts[t] || 0) + 1;
  });
  const typeSum = Object.values(typeTotals).reduce((a, b) => a + b, 0) || 1;
  const sorted = Object.entries(typeTotals).sort((a, b) => b[1] - a[1]);
  const entries = sorted.map(([type, amount]) => ({
    type,
    pctLabel: Math.round((amount / typeSum) * 100) + '%',
    color: TYPE_COLORS[type] || theme.textMuted,
    fraction: amount / typeSum,
    amountFmt: formatINR(amount),
    count: typeCounts[type],
  }));
  const total = sorted.reduce((a, [, v]) => a + v, 0);
  return { entries, totalCompact: '₹' + formatCompactINR(total) };
}

export interface CashFlowReceipt {
  id: string;
  recordId: string;
  kind: 'FD' | 'RD';
  number: string;
  bank: string;
  date: string;
  amount: number;
  source: 'Interest payout' | 'Interest at maturity' | 'Maturity return';
}

export function projectedInterest(state: AppState) {
  const buckets = projectedCashFlow(state);
  const max = Math.max(...buckets.map(b => b.total), 1);
  return buckets.map(b => ({ ...b, heightPct: b.total / max * 100 }));
}

export interface CashFlowMonth {
  key: string;
  label: string;
  fullLabel: string;
  total: number;
  receipts: CashFlowReceipt[];
}

/** Cash received from today onward, including every scheduled payout, not just the next one. */
export function projectedCashFlow(state: AppState, months: 6 | 12 = 6, mode: 'interest' | 'maturity' = 'interest'): CashFlowMonth[] {
  const now = today();
  const buckets: CashFlowMonth[] = Array.from({ length: months }, (_, i) => {
    const dt = addMonthsClamped(now, i);
    return {
      key: `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`,
      label: dt.toLocaleDateString('en-IN', { month: 'short' }),
      fullLabel: dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }),
      total: 0,
      receipts: [],
    };
  });
  const add = (receipt: CashFlowReceipt) => {
    if (parseIsoDate(receipt.date) < now || receipt.amount <= 0) return;
    const bucket = buckets.find(b => b.key === receipt.date.slice(0, 7));
    if (bucket) {
      bucket.total += receipt.amount;
      bucket.receipts.push(receipt);
    }
  };
  state.fdList.filter(f => f.status === 'Active').forEach(f => {
    const base = { recordId: f.id, kind: 'FD' as const, number: f.fdNumber, bank: f.bankName };
    if (mode === 'maturity') {
      add({ ...base, id: `${f.id}-maturity`, date: f.maturityDate, amount: f.maturityAmount, source: 'Maturity return' });
    } else if (f.isPayoutFD) {
      const amount = Math.round(payoutPerPeriod(f.principalAmount, f.interestRate, f.interestPayoutMode));
      payoutSchedule(f.startDate, f.interestPayoutMode, f.maturityDate).forEach(date => {
        add({ ...base, id: `${f.id}-${date}`, date, amount, source: 'Interest payout' });
      });
    } else {
      add({ ...base, id: `${f.id}-interest`, date: f.maturityDate, amount: f.interestEarnedTotal, source: 'Interest at maturity' });
    }
  });
  state.rdList.filter(r => r.status === 'Active').forEach(r => {
    add({ recordId: r.id, kind: 'RD', number: r.rdNumber, bank: r.bankName, id: `${r.id}-${mode}`, date: r.maturityDate,
      amount: mode === 'maturity' ? r.maturityAmount : r.interestEarnedTotal,
      source: mode === 'maturity' ? 'Maturity return' : 'Interest at maturity' });
  });
  buckets.forEach(bucket => bucket.receipts.sort((a, b) => a.date.localeCompare(b.date)));
  return buckets;
}

// ---------------------------------------------------------------------------
// Payouts screen grouping
// ---------------------------------------------------------------------------
export interface DecoratedEvent extends PortfolioEvent {
  dr: number;
  dateLabel: string;
  amountFmt: string;
  amountColor: string;
  kindBadgeBg: string;
}

export function payoutGroups(state: AppState, theme: ThemeTokens) {
  const now = today();
  const isFuture = (iso: string) => parseIsoDate(iso) >= now;
  const daysOut = (iso: string) => daysBetween(now, iso);
  const decorated: DecoratedEvent[] = state.events
    .filter(e => e.overdue || isFuture(e.date))
    .map(e => ({
      ...e,
      dr: daysOut(e.date),
      dateLabel: formatDate(e.date, 'short'),
      amountFmt: formatINR(e.amount),
      amountColor: e.type === 'Maturity (P+I)' ? theme.text : e.type === 'Installment Due' ? theme.textMuted : theme.success,
      kindBadgeBg: e.kind === 'FD' ? theme.accent : theme.success,
    }));
  decorated.sort((a, b) => parseIsoDate(a.date).getTime() - parseIsoDate(b.date).getTime());
  const overdue = decorated.filter(e => e.overdue);
  const rest = decorated.filter(e => !e.overdue);
  const dueToday = rest.filter(e => e.dr === 0);
  const thisWeek = rest.filter(e => e.dr > 0 && e.dr <= 7);
  const thisMonth = rest.filter(e => e.dr > 7 && e.dr <= 30);
  const upcoming = rest.filter(e => e.dr > 30);
  return {
    overdue,
    sections: [
      { label: 'Due today', items: dueToday },
      { label: 'This week', items: thisWeek },
      { label: 'This month', items: thisMonth },
      { label: 'Upcoming', items: upcoming },
    ],
  };
}

// ---------------------------------------------------------------------------
// Notifications screen decoration
// ---------------------------------------------------------------------------
export function decorateNotification(n: PortfolioNotification, theme: ThemeTokens) {
  const iconTint: Record<string, [string, string]> = {
    alert: ['rgba(226,73,90,0.13)', theme.danger],
    clock: ['rgba(201,134,26,0.13)', theme.warning],
    wallet: ['rgba(14,164,114,0.13)', theme.success],
    refresh: ['rgba(111,102,232,0.13)', theme.accent],
  };
  const [iconBg, iconFg] = iconTint[n.icon] || ['rgba(201,134,26,0.13)', theme.warning];
  return { ...n, iconBg, iconFg, dateLabel: formatDate(n.date) };
}

// ---------------------------------------------------------------------------
// FD / RD estimate (live, while editing) — delegates to finance.ts, so the preview
// shown while filling out the form matches what the record will actually derive to
// once saved (previously this had its own, third copy of the maturity formulas that
// had quietly drifted from both calcFD/calcRD and deriveFd/deriveRd).
// ---------------------------------------------------------------------------
export function fdEstimate(draft: Record<string, any>) {
  const principal = Number(draft.principalAmount) || 0;
  const rate = Number(draft.interestRate) || 0;
  const startDate = draft.startDate || todayIso();
  const maturityDate = fdMaturityDate(startDate, Number(draft.tenureYears || 0), Number(draft.tenureMonths || 0), Number(draft.tenureDays || 0));
  const totalYears = daysBetween(startDate, maturityDate) / 365;
  const isPayout = isPayoutFd(draft.interestPayoutMode);
  const maturityAmount = isPayout ? principal : fdAccruedAmount(principal, rate, draft.interestType, draft.compoundingFrequency, totalYears);
  return { maturityDateLabel: formatDate(maturityDate, 'short'), maturityAmountFmt: formatINR(maturityAmount) };
}

export function rdEstimate(draft: Record<string, any>) {
  const installment = Number(draft.monthlyInstallment) || 0;
  const rate = Number(draft.interestRate) || 0;
  const totalMonths = Number(draft.tenureYears || 0) * 12 + Number(draft.tenureMonths || 0);
  const startDate = draft.startDate || todayIso();
  const maturityDate = rdMaturityDate(startDate, totalMonths);
  const maturityAmount = totalMonths > 0 ? rdMaturityAmount(installment, rate, totalMonths) : 0;
  return { maturityDateLabel: formatDate(maturityDate, 'short'), maturityAmountFmt: formatINR(maturityAmount) };
}

// ---------------------------------------------------------------------------
// Maturity timeline
// ---------------------------------------------------------------------------
export interface TimelineItem {
  date: string;
  bankName: string;
  number: string;
  amountFmt: string;
  kind: 'FD' | 'RD';
  id: string;
  actionRequired: boolean;
  autoRenews: boolean;
}

export interface TimelineMonth {
  label: string;
  order: number;
  items: (TimelineItem & { dateLabel: string; dotColor: string; actionBadge: string | null; actionBadgeBg: string; actionBadgeFg: string })[];
}

export function timelineMonths(state: AppState, theme: ThemeTokens): TimelineMonth[] {
  const items: TimelineItem[] = [];
  [...state.fdList.filter(f => f.status === 'Active'), ...state.rdList.filter(r => r.status === 'Active')].forEach((rec: any) => {
    const isFd = !!rec.fdNumber;
    if (rec.daysRemaining < 0 || rec.daysRemaining > 365) return;
    items.push({
      date: rec.maturityDate,
      bankName: rec.bankName,
      number: isFd ? rec.fdNumber : rec.rdNumber,
      amountFmt: formatINR(rec.maturityAmount),
      kind: isFd ? 'FD' : 'RD',
      id: rec.id,
      actionRequired: isFd && rec.autoRenewal === 'No' && rec.daysRemaining <= 60,
      autoRenews: isFd && rec.autoRenewal === 'Yes' && rec.daysRemaining <= 60,
    });
  });
  items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const monthLabels = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const buckets: Record<string, TimelineMonth> = {};
  items.forEach(it => {
    const dt = parseIsoDate(it.date);
    const key = dt.getFullYear() + '-' + dt.getMonth();
    if (!buckets[key]) buckets[key] = { label: monthLabels[dt.getMonth()] + ' ' + dt.getFullYear(), items: [], order: dt.getFullYear() * 12 + dt.getMonth() };
    buckets[key].items.push({
      ...it,
      dateLabel: formatDate(it.date, 'short'),
      dotColor: it.kind === 'FD' ? theme.accent : theme.success,
      actionBadge: it.actionRequired ? 'Renewal decision needed' : it.autoRenews ? 'Auto-renews' : null,
      actionBadgeBg: it.actionRequired ? 'rgba(201,134,26,0.15)' : 'rgba(14,164,114,0.13)',
      actionBadgeFg: it.actionRequired ? theme.warning : theme.success,
    });
  });
  return Object.values(buckets).sort((a, b) => a.order - b.order);
}

// ---------------------------------------------------------------------------
// Filter sheet chip styling
// ---------------------------------------------------------------------------
export function chipStyle(theme: ThemeTokens, active: boolean): { bg: Fill; fg: string; border: string } {
  return active
    ? { bg: theme.gradientAccent, fg: '#fff', border: 'transparent' }
    : { bg: theme.card, fg: theme.textMuted, border: theme.border };
}
