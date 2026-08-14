// Turns stored FD/RD rows + "today" into the live values the UI displays: maturity
// date/amount, current value, interest earned, days remaining, effective status, and
// the events/notifications lists that used to be static mock arrays. Nothing here is
// persisted — it's recomputed on every read, so it's always correct against the real
// current date.

import { StoredFd, StoredRd } from './db';
import {
  FixedDeposit,
  RecurringDeposit,
  PortfolioEvent,
  PortfolioNotification,
  daysBetween,
  calcRD,
} from './portfolioData';

const FREQ_N: Record<string, number> = { Monthly: 12, Quarterly: 4, 'Half-Yearly': 2, Yearly: 1 };
const FREQ_MONTHS: Record<string, number> = { Monthly: 1, Quarterly: 3, 'Half-Yearly': 6, Yearly: 12 };

/** Today, normalized to local midnight so date-only comparisons are stable all day. */
export function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addTenure(start: Date, years: number, months: number, days: number): Date {
  const d = new Date(start);
  d.setFullYear(d.getFullYear() + Number(years || 0));
  d.setMonth(d.getMonth() + Number(months || 0));
  d.setDate(d.getDate() + Number(days || 0));
  return d;
}

// ---------------------------------------------------------------------------
// Fixed Deposits
// ---------------------------------------------------------------------------
export function deriveFd(stored: StoredFd, now: Date): FixedDeposit {
  const start = new Date(stored.startDate);
  const maturity = addTenure(start, stored.tenureYears, stored.tenureMonths, stored.tenureDays);
  const totalDays = Math.max(1, daysBetween(start, maturity));
  const elapsedDays = clamp(daysBetween(start, now), 0, totalDays);
  const daysRemaining = daysBetween(now, maturity);
  const n = FREQ_N[stored.compoundingFrequency] || 4;
  const isPayoutFD = stored.interestPayoutMode !== 'At Maturity';
  const principal = stored.principalAmount;
  const rate = stored.interestRate;
  const totalYears = totalDays / 365;
  const elapsedYears = elapsedDays / 365;

  const maturityAmount = isPayoutFD ? principal : Math.round(principal * Math.pow(1 + rate / 100 / n, n * totalYears));

  let currentValue: number;
  let interestEarnedSoFar: number;
  let nextPayoutAmount: number | null = null;
  let nextPayoutDate: string | null = null;

  const effectiveStatus = stored.status === 'Active' && daysRemaining < 0 ? 'Matured' : stored.status;

  if (isPayoutFD) {
    currentValue = principal;
    const periodDays = 365 / n;
    const elapsedPeriods = Math.floor(elapsedDays / periodDays);
    nextPayoutAmount = Math.round(principal * (rate / 100) / n);
    interestEarnedSoFar = nextPayoutAmount * elapsedPeriods;
    if (effectiveStatus === 'Active') {
      const periodMonths = FREQ_MONTHS[stored.interestPayoutMode] || 3;
      const scheduled = new Date(start);
      while (scheduled <= now) scheduled.setMonth(scheduled.getMonth() + periodMonths);
      if (scheduled <= maturity) nextPayoutDate = toIso(scheduled);
    }
  } else {
    currentValue = Math.round(principal * Math.pow(1 + rate / 100 / n, n * elapsedYears));
    interestEarnedSoFar = currentValue - principal;
  }

  return {
    ...stored,
    status: effectiveStatus,
    maturityDate: toIso(maturity),
    totalDays,
    elapsedDays,
    daysRemaining,
    maturityAmount,
    currentValue,
    interestEarnedTotal: maturityAmount - principal,
    interestEarnedSoFar,
    isPayoutFD,
    nextPayoutAmount: isPayoutFD && effectiveStatus === 'Active' ? nextPayoutAmount : null,
    nextPayoutDate,
  };
}

// ---------------------------------------------------------------------------
// Recurring Deposits
// ---------------------------------------------------------------------------
function monthsElapsed(start: Date, now: Date): number {
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

/** How many monthly installments are due as of `now` for an RD starting on `startDate`. */
export function computeInstallmentsDue(startDate: string, totalMonths: number, now: Date): number {
  return clamp(monthsElapsed(new Date(startDate), now) + 1, 0, Math.max(0, totalMonths));
}

export function deriveRd(stored: StoredRd, now: Date): RecurringDeposit {
  const start = new Date(stored.startDate);
  const totalMonths = stored.tenureYears * 12 + stored.tenureMonths;
  const maturity = new Date(start);
  maturity.setMonth(maturity.getMonth() + totalMonths);
  const daysRemaining = daysBetween(now, maturity);
  const effectiveStatus = stored.status === 'Active' && daysRemaining < 0 ? 'Matured' : stored.status;

  const installmentsTotal = totalMonths;
  const installmentsDue = computeInstallmentsDue(stored.startDate, totalMonths, now);
  const installmentsMissed = Math.max(0, installmentsDue - stored.installmentsPaid);
  const totalDeposited = stored.installmentsPaid * stored.monthlyInstallment;

  const full = calcRD({
    monthlyInstallment: stored.monthlyInstallment,
    ratePct: stored.interestRate,
    startDate: stored.startDate,
    years: stored.tenureYears,
    months: stored.tenureMonths,
  });
  const paid = stored.installmentsPaid;
  const interestEarnedSoFar = Math.round((stored.monthlyInstallment * (stored.interestRate / 100) * paid * (paid + 1)) / 24);
  const currentValue = totalDeposited + interestEarnedSoFar;

  let nextInstallmentDate: string | null = null;
  if (effectiveStatus === 'Active' && stored.installmentsPaid < installmentsTotal) {
    const due = new Date(start);
    due.setMonth(due.getMonth() + stored.installmentsPaid);
    nextInstallmentDate = toIso(due);
  }

  return {
    ...stored,
    status: effectiveStatus,
    maturityDate: toIso(maturity),
    totalMonths,
    daysRemaining,
    installmentsTotal,
    installmentsMissed,
    totalDeposited,
    interestEarnedSoFar,
    interestEarnedTotal: Math.round(full.interestEarned),
    maturityAmount: Math.round(full.maturityAmount),
    currentValue,
    nextInstallmentDate,
    autoDebit: stored.mode === 'Online' ? 'Yes' : 'No',
  };
}

// ---------------------------------------------------------------------------
// Events (Payouts screen, projected-interest chart, maturity events)
// ---------------------------------------------------------------------------
export function deriveEvents(fds: FixedDeposit[], rds: RecurringDeposit[]): PortfolioEvent[] {
  const events: PortfolioEvent[] = [];

  fds.forEach(fd => {
    if (fd.status !== 'Active') return;
    events.push({
      id: 'ev-fd-mat-' + fd.id, kind: 'FD', number: fd.fdNumber, bank: fd.bankName,
      type: 'Maturity (P+I)', amount: fd.maturityAmount, date: fd.maturityDate, recordId: fd.id, overdue: false,
    });
    if (fd.isPayoutFD && fd.nextPayoutDate && fd.nextPayoutAmount) {
      events.push({
        id: 'ev-fd-int-' + fd.id, kind: 'FD', number: fd.fdNumber, bank: fd.bankName,
        type: 'Interest', amount: fd.nextPayoutAmount, date: fd.nextPayoutDate, recordId: fd.id, overdue: false,
      });
    }
  });

  rds.forEach(rd => {
    if (rd.status !== 'Active') return;
    events.push({
      id: 'ev-rd-mat-' + rd.id, kind: 'RD', number: rd.rdNumber, bank: rd.bankName,
      type: 'Maturity (P+I)', amount: rd.maturityAmount, date: rd.maturityDate, recordId: rd.id, overdue: false,
    });
    if (rd.nextInstallmentDate) {
      events.push({
        id: 'ev-rd-inst-' + rd.id, kind: 'RD', number: rd.rdNumber, bank: rd.bankName,
        type: 'Installment Due', amount: rd.monthlyInstallment, date: rd.nextInstallmentDate, recordId: rd.id,
        overdue: rd.installmentsMissed > 0,
      });
    }
  });

  return events;
}

// ---------------------------------------------------------------------------
// Notifications (Home "needs attention", Notifications screen)
// ---------------------------------------------------------------------------
export function deriveNotifications(fds: FixedDeposit[], rds: RecurringDeposit[], now: Date): PortfolioNotification[] {
  const out: PortfolioNotification[] = [];

  fds.forEach(fd => {
    if (fd.status === 'Matured') {
      out.push({
        id: 'ntf-fd-' + fd.id + '-renew', icon: 'alert', severity: 'high',
        title: `${fd.fdNumber} matured — action needed`, subtitle: `${fd.bankName} · Renewal decision pending`,
        date: fd.maturityDate, recordType: 'FD', recordId: fd.id,
      });
      return;
    }
    if (fd.status !== 'Active') return;
    if (fd.daysRemaining >= 0 && fd.daysRemaining <= 30) {
      out.push({
        id: 'ntf-fd-' + fd.id + '-mat', icon: 'clock', severity: fd.daysRemaining <= 7 ? 'high' : 'medium',
        title: `${fd.fdNumber} matures in ${fd.daysRemaining} day${fd.daysRemaining === 1 ? '' : 's'}`,
        subtitle: `${fd.bankName} · ${fd.maturityAmount.toLocaleString('en-IN')}`,
        date: fd.maturityDate, recordType: 'FD', recordId: fd.id,
      });
      if (fd.autoRenewal === 'Yes' && fd.daysRemaining <= 14) {
        out.push({
          id: 'ntf-fd-' + fd.id + '-autorenew', icon: 'refresh', severity: 'medium',
          title: `${fd.fdNumber} auto-renewal pending`, subtitle: `${fd.bankName} · Confirm before maturity`,
          date: fd.maturityDate, recordType: 'FD', recordId: fd.id,
        });
      }
    }
    if (fd.isPayoutFD && fd.nextPayoutDate) {
      const dr = daysBetween(now, fd.nextPayoutDate);
      if (dr >= 0 && dr <= 3) {
        out.push({
          id: 'ntf-fd-' + fd.id + '-payout', icon: 'wallet', severity: 'medium',
          title: `${fd.fdNumber} interest payout due`, subtitle: `${fd.bankName} · Expected ${fd.nextPayoutDate}`,
          date: fd.nextPayoutDate, recordType: 'FD', recordId: fd.id,
        });
      }
    }
  });

  rds.forEach(rd => {
    if (rd.status === 'Matured') {
      out.push({
        id: 'ntf-rd-' + rd.id + '-mat', icon: 'alert', severity: 'high',
        title: `${rd.rdNumber} matured — action needed`, subtitle: `${rd.bankName} · Awaiting payout`,
        date: rd.maturityDate, recordType: 'RD', recordId: rd.id,
      });
      return;
    }
    if (rd.status !== 'Active') return;
    if (rd.installmentsMissed > 0) {
      out.push({
        id: 'ntf-rd-' + rd.id + '-missed', icon: 'alert', severity: 'high',
        title: `${rd.rdNumber} has ${rd.installmentsMissed} missed installment${rd.installmentsMissed === 1 ? '' : 's'}`,
        subtitle: `${rd.bankName} · Pay to avoid penalty`,
        date: rd.nextInstallmentDate || rd.maturityDate, recordType: 'RD', recordId: rd.id,
      });
    }
    if (rd.daysRemaining >= 0 && rd.daysRemaining <= 30) {
      out.push({
        id: 'ntf-rd-' + rd.id + '-mat', icon: 'clock', severity: rd.daysRemaining <= 7 ? 'high' : 'medium',
        title: `${rd.rdNumber} matures in ${rd.daysRemaining} day${rd.daysRemaining === 1 ? '' : 's'}`,
        subtitle: `${rd.bankName} · ${rd.maturityAmount.toLocaleString('en-IN')}`,
        date: rd.maturityDate, recordType: 'RD', recordId: rd.id,
      });
    }
  });

  return out.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'high' ? -1 : 1;
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}
