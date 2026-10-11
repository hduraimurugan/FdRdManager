// Turns stored FD/RD rows + "today" into the live values the UI displays: maturity
// date/amount, current value, interest earned, days remaining, effective status, and
// the events/notifications lists that used to be static mock arrays. Nothing here is
// persisted — it's recomputed on every read, so it's always correct against the real
// current date.
//
// Date and interest math delegates to src/data/finance.ts — see that file's header.

import { StoredFd, StoredRd } from './db';
import {
  FixedDeposit,
  RecurringDeposit,
  PortfolioEvent,
  PortfolioNotification,
  daysBetween,
  calcRD,
} from './portfolioData';
import {
  today as financeToday,
  toIsoDate,
  addTenure as financeAddTenure,
  addMonthsClamped,
  parseIsoDate,
  isPayoutFd,
  payoutPerPeriod,
  payoutSchedule,
  payoutInterestTotal,
  fdAccruedAmount,
  rdAccruedAmount,
} from './finance';

/** Today, normalized to local midnight so date-only comparisons are stable all day. */
export function today(): Date {
  return financeToday();
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const toIso = toIsoDate;
const addTenure = financeAddTenure;

// ---------------------------------------------------------------------------
// Fixed Deposits
// ---------------------------------------------------------------------------
export function deriveFd(stored: StoredFd, now: Date): FixedDeposit {
  const start = parseIsoDate(stored.startDate);
  const maturity = addTenure(start, stored.tenureYears, stored.tenureMonths, stored.tenureDays);
  const maturityDate = toIso(maturity);
  const totalDays = Math.max(1, daysBetween(start, maturity));
  const elapsedDays = clamp(daysBetween(start, now), 0, totalDays);
  const daysRemaining = daysBetween(now, maturity);
  const isPayoutFD = isPayoutFd(stored.interestPayoutMode);
  const principal = stored.principalAmount;
  const rate = stored.interestRate;
  const totalYears = totalDays / 365;
  const elapsedYears = elapsedDays / 365;

  const effectiveStatus = stored.status === 'Active' && daysRemaining < 0 ? 'Matured' : stored.status;

  let currentValue: number;
  let interestEarnedSoFar: number;
  let interestEarnedTotal: number;
  let maturityAmount: number;
  let nextPayoutAmount: number | null = null;
  let nextPayoutDate: string | null = null;

  if (isPayoutFD) {
    // Payout FDs never grow beyond principal — interest is paid out each period, not
    // reinvested, so "current value" and "maturity value" are both just the principal.
    // Lifetime interest is the sum of what's actually paid out over the schedule, not
    // maturityAmount - principal (which used to be 0 - 0 = 0 for every payout FD).
    maturityAmount = principal;
    currentValue = principal;
    const perPayout = Math.round(payoutPerPeriod(principal, rate, stored.interestPayoutMode));
    const schedule = payoutSchedule(stored.startDate, stored.interestPayoutMode, maturityDate);
    const elapsedPayouts = schedule.filter(d => parseIsoDate(d) <= now).length;
    nextPayoutAmount = perPayout;
    interestEarnedSoFar = perPayout * elapsedPayouts;
    interestEarnedTotal = Math.round(payoutInterestTotal(principal, rate, stored.interestPayoutMode, stored.startDate, maturityDate));
    if (effectiveStatus === 'Active') {
      nextPayoutDate = schedule.find(d => parseIsoDate(d) > now) ?? null;
    }
  } else {
    maturityAmount = Math.round(fdAccruedAmount(principal, rate, stored.interestType, stored.compoundingFrequency, totalYears));
    currentValue = Math.round(fdAccruedAmount(principal, rate, stored.interestType, stored.compoundingFrequency, elapsedYears));
    interestEarnedSoFar = currentValue - principal;
    interestEarnedTotal = maturityAmount - principal;
  }

  return {
    ...stored,
    status: effectiveStatus,
    maturityDate,
    totalDays,
    elapsedDays,
    daysRemaining,
    maturityAmount,
    currentValue,
    interestEarnedTotal,
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
  // Compare with this month's scheduled date, clamped from the original start.
  if (now < addMonthsClamped(start, months)) months -= 1;
  return Math.max(0, months);
}

/** How many monthly installments are due as of `now` for an RD starting on `startDate`. */
export function computeInstallmentsDue(startDate: string, totalMonths: number, now: Date): number {
  return clamp(monthsElapsed(parseIsoDate(startDate), now) + 1, 0, Math.max(0, totalMonths));
}

export function deriveRd(stored: StoredRd, now: Date): RecurringDeposit {
  const start = parseIsoDate(stored.startDate);
  const totalMonths = stored.tenureYears * 12 + stored.tenureMonths;
  const maturity = addMonthsClamped(start, totalMonths);
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
  // Same bank formula as the maturity figure (full.maturityAmount), applied to the
  // instalments actually paid so far — previously this used a different, simple-interest
  // approximation than the maturity value, so partial progress and the final figure
  // disagreed on methodology even before the maturity formula itself was wrong.
  const currentValue = Math.round(rdAccruedAmount(stored.monthlyInstallment, stored.interestRate, paid));
  const interestEarnedSoFar = currentValue - totalDeposited;

  let nextInstallmentDate: string | null = null;
  if (effectiveStatus === 'Active' && stored.installmentsPaid < installmentsTotal) {
    nextInstallmentDate = toIso(addMonthsClamped(start, stored.installmentsPaid));
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
