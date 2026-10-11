// Pure logic for local maturity reminders — which OS-level notifications *should* exist
// right now, given the portfolio and the user's reminder settings. No RN or native
// imports, so this is unit-testable without mocking notifee.
//
// Like everything else in this app's data layer, reminders are *derived*, not stored:
// nothing about a scheduled notification is persisted as its own record. AppContext
// recomputes this plan and reconciles it against whatever's actually scheduled (see
// notifeeClient.ts's syncScheduledReminders) every time portfolio data changes, and
// again whenever the app returns to the foreground.
//
// That resync-on-foreground behavior is also this app's answer to "reschedule on boot":
// there's no native BroadcastReceiver for BOOT_COMPLETED, so a reminder scheduled before
// a reboot the user never manually starts the app after won't fire. Rather than add a
// permission (RECEIVE_BOOT_COMPLETED) and native code for a receiver, the plan is that
// opening the app resyncs everything — true on every cold start and every foreground.
// This is a real, documented limitation, not an oversight — see the README.

import { FixedDeposit, RecurringDeposit, formatINR } from './portfolioData';
import { addDays, addMonthsClamped, parseIsoDate, payoutSchedule, payoutPerPeriod, toIsoDate } from './finance';
import { deriveNotifications } from './derive';

export const REMINDER_ID_PREFIX = 'maturity-reminder-';
export const LEAD_DAYS_OPTIONS = [1, 3, 7, 14] as const;
export const DEFAULT_LEAD_DAYS = 3;

export interface ReminderSettings {
  enabled: boolean;
  leadDays: number;
}

export interface PlannedReminder {
  /** Stable and deterministic — the same FD/RD always produces the same id, so
   * re-planning naturally updates (rather than duplicates) its scheduled notification. */
  id: string;
  title: string;
  body: string;
  /** 'YYYY-MM-DD' — the calendar day the reminder should fire on. */
  fireDate: string;
  recordId: string;
  kind: 'FD' | 'RD';
  /** Deliver an existing in-app alert once when its scheduled time has passed. */
  catchUp?: boolean;
}

function fdReminder(fd: FixedDeposit, leadDays: number): PlannedReminder | null {
  if (fd.status !== 'Active') return null;
  return {
    id: `${REMINDER_ID_PREFIX}fd-${fd.id}`,
    title: `${fd.fdNumber} matures in ${leadDays} day${leadDays === 1 ? '' : 's'}`,
    body: `${fd.bankName} · ${formatINR(fd.maturityAmount)}`,
    fireDate: addDays(fd.maturityDate, -leadDays),
    recordId: fd.id,
    kind: 'FD',
  };
}

function rdReminder(rd: RecurringDeposit, leadDays: number): PlannedReminder | null {
  if (rd.status !== 'Active') return null;
  return {
    id: `${REMINDER_ID_PREFIX}rd-${rd.id}`,
    title: `${rd.rdNumber} matures in ${leadDays} day${leadDays === 1 ? '' : 's'}`,
    body: `${rd.bankName} · ${formatINR(rd.maturityAmount)}`,
    fireDate: addDays(rd.maturityDate, -leadDays),
    recordId: rd.id,
    kind: 'RD',
  };
}

/** Every reminder that should be scheduled right now: one per active FD/RD, `leadDays`
 * before its maturity date, excluding anything whose reminder date has already passed
 * (an already-overdue reminder isn't worth surfacing — the in-app Notifications screen
 * already covers "matures soon"/"matured" for anything currently open in the app). */
export function planReminders(fds: FixedDeposit[], rds: RecurringDeposit[], settings: ReminderSettings, now: Date): PlannedReminder[] {
  if (!settings.enabled) return [];
  const today = parseIsoDate(now);

  const fdReminders = fds.map(fd => fdReminder(fd, settings.leadDays)).filter((r): r is PlannedReminder => r !== null);
  const rdReminders = rds.map(rd => rdReminder(rd, settings.leadDays)).filter((r): r is PlannedReminder => r !== null);

  return [...fdReminders, ...rdReminders].filter(r => parseIsoDate(r.fireDate) >= today);
}

/** All attention alerts plus every payout/installment date, including later interest
 * periods (not just the next payout shown in the UI). The OS queue keeps the nearest
 * events; reopening the app replenishes it. */
export function planPortfolioReminders(fds: FixedDeposit[], rds: RecurringDeposit[], settings: ReminderSettings, now: Date): PlannedReminder[] {
  if (!settings.enabled) return [];
  const planned = new Map<string, PlannedReminder>();
  const add = (kind: 'FD' | 'RD', recordId: string, category: string, eventDate: string, fireDate: string, title: string, body: string, catchUp = false) => {
    const id = `${REMINDER_ID_PREFIX}${kind.toLowerCase()}-${recordId}-${category}-${eventDate}`;
    if (catchUp || parseIsoDate(fireDate) >= parseIsoDate(now)) {
      planned.set(id, { id, kind, recordId, fireDate, title, body, catchUp: catchUp || (fireDate === toIsoDate(now) && ['interest-payout', 'maturity-payout', 'installment'].includes(category)) });
    }
  };
  for (const reminder of planReminders(fds, rds, settings, now)) planned.set(reminder.id, { ...reminder, catchUp: reminder.fireDate === toIsoDate(now) });

  for (const record of [...fds, ...rds]) {
    const kind = 'fdNumber' in record ? 'FD' : 'RD';
    const number = 'fdNumber' in record ? record.fdNumber : record.rdNumber;
    if (record.status !== 'Active') continue;
    const body = `${record.bankName} · ${formatINR(record.maturityAmount)}`;
    add(kind, record.id, 'soon', record.maturityDate, addDays(record.maturityDate, -30), `${number} matures in 30 days`, body);
    add(kind, record.id, 'maturity-payout', record.maturityDate, record.maturityDate, `${number} maturity payout due today`, body);
    add(kind, record.id, 'action', record.maturityDate, addDays(record.maturityDate, 1), `${number} matured — action needed`, `${record.bankName} · ${kind === 'FD' ? 'Renewal decision pending' : 'Awaiting payout'}`);
    if ('fdNumber' in record) {
      if (record.autoRenewal === 'Yes') {
        add(kind, record.id, 'autorenew', record.maturityDate, addDays(record.maturityDate, -14), `${number} auto-renewal pending`, `${record.bankName} · Confirm before maturity`);
      }
      if (record.isPayoutFD) {
        for (const date of payoutSchedule(record.startDate, record.interestPayoutMode, record.maturityDate)) {
          const interestBody = `${record.bankName} · ${formatINR(payoutPerPeriod(record.principalAmount, record.interestRate, record.interestPayoutMode))} · ${date}`;
          add(kind, record.id, 'interest-alert', date, addDays(date, -3), `${number} interest payout due in 3 days`, interestBody);
          add(kind, record.id, 'interest-payout', date, date, `${number} interest payout due today`, interestBody);
        }
      }
    } else {
      for (let i = record.installmentsPaid; i < record.installmentsTotal; i++) {
        const date = toIsoDate(addMonthsClamped(parseIsoDate(record.startDate), i));
        add(kind, record.id, 'installment', date, date, `${number} installment due today`, `${record.bankName} · ${formatINR(record.monthlyInstallment)}`);
        add(kind, record.id, 'missed', date, addDays(date, 1), `${number} has an unpaid installment`, `${record.bankName} · Pay to avoid penalty`);
      }
    }
  }

  // Existing attention cards also appear in the notification tray when enabled.
  // IDs match their future milestones so foreground sync cannot replay a delivered alert.
  for (const notification of deriveNotifications(fds, rds, now)) {
    const category = notification.icon === 'refresh' ? 'autorenew'
      : notification.icon === 'wallet' ? 'interest-alert'
      : notification.id.endsWith('-missed') ? 'missed'
      : notification.icon === 'alert' ? 'action' : 'soon';
    const offset = category === 'soon' ? -30 : category === 'autorenew' ? -14 : category === 'interest-alert' ? -3 : 1;
    add(notification.recordType, notification.recordId, category, notification.date, addDays(notification.date, offset), notification.title, notification.subtitle, true);
  }
  return [...planned.values()].sort((a, b) => a.fireDate.localeCompare(b.fireDate) || a.id.localeCompare(b.id));
}
