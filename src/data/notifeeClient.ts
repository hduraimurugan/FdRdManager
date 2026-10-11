// Native notification orchestration for local maturity reminders — kept separate from
// reminders.ts (pure planning logic) the same way backupIO.ts is kept separate from
// backupSchema.ts, so the planning logic stays unit-testable without mocking a native
// module.
//
// notifee's local (trigger) notifications need only androidx.work / androidx.core —
// no Google Play Services or Firebase — as long as its Cloud Messaging integration is
// never wired in (it isn't here). See the notifee android/build.gradle dependency list
// for confirmation; this must stay true if notifee is ever upgraded.

import notifee, { AndroidImportance, AuthorizationStatus, TriggerType } from '@notifee/react-native';
import { PlannedReminder, REMINDER_ID_PREFIX } from './reminders';
import { parseIsoDate } from './finance';

const CHANNEL_ID = 'maturity-reminders';
const REMINDER_HOUR = 9; // fires at 9:00 AM local time on the planned day
const BACKUP_STATUS_CHANNEL_ID = 'backup-status';
const PORTFOLIO_CHANNEL_ID = 'portfolio-alerts';
let syncQueue: Promise<void> = Promise.resolve();

export interface ReminderDeliveryStore {
  load: () => Promise<Record<string, number>>;
  save: (receipts: Record<string, number>) => Promise<void>;
}

function enqueue(work: () => Promise<void>): Promise<void> {
  const next = syncQueue.catch(() => {}).then(work);
  syncQueue = next;
  return next;
}

let channelReady = false;
let backupStatusChannelReady = false;

async function ensureChannel(): Promise<void> {
  if (channelReady) return;
  await notifee.createChannel({ id: CHANNEL_ID, name: 'Maturity reminders', importance: AndroidImportance.DEFAULT });
  channelReady = true;
}

async function ensureBackupStatusChannel(): Promise<void> {
  if (backupStatusChannelReady) return;
  await notifee.createChannel({ id: BACKUP_STATUS_CHANNEL_ID, name: 'Backup & restore', importance: AndroidImportance.DEFAULT });
  backupStatusChannelReady = true;
}

export async function hasNotificationPermission(): Promise<boolean> {
  const settings = await notifee.getNotificationSettings();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  return settings.authorizationStatus === AuthorizationStatus.AUTHORIZED;
}

/** Opens the OS notification settings screen for this app — the only way forward once
 * the user has denied the permission prompt once, since requesting it again from inside
 * the app does nothing on Android. */
export function openNotificationSettings(): Promise<void> {
  return notifee.openNotificationSettings();
}

function fireTimestamp(fireDateIso: string): number {
  const d = parseIsoDate(fireDateIso);
  d.setHours(REMINDER_HOUR, 0, 0, 0);
  return d.getTime();
}

/**
 * Reconciles what's actually scheduled against `planned`: cancels anything scheduled
 * that's no longer in the plan (a deleted/matured/closed record, or reminders turned
 * off), and (re)creates everything in the plan. Each PlannedReminder's id is stable, so
 * recreating one that already exists updates it in place rather than duplicating it.
 *
 * Called by AppContext whenever portfolio data changes and whenever the app returns to
 * the foreground — see reminders.ts's header comment for why that substitutes for a
 * native boot receiver here.
 */
export function syncScheduledReminders(planned: PlannedReminder[], store?: ReminderDeliveryStore): Promise<void> {
  return enqueue(() => reconcileReminders(planned, store));
}

async function reconcileReminders(planned: PlannedReminder[], store?: ReminderDeliveryStore): Promise<void> {
  await ensureChannel();
  if (store) {
    await notifee.createChannel({ id: PORTFOLIO_CHANNEL_ID, name: 'Deposit alerts & payouts', importance: AndroidImportance.HIGH });
  }

  const existingIds = await notifee.getTriggerNotificationIds();
  const ourExistingIds = existingIds.filter(id => id.startsWith(REMINDER_ID_PREFIX));
  const receipts = store ? await store.load() : {};
  const now = Date.now();
  const future = planned.filter(r => fireTimestamp(r.fireDate) > now).sort((a, b) => fireTimestamp(a.fireDate) - fireTimestamp(b.fireDate));
  // Notifee supports 50 pending timestamp triggers on Android. Use that conservative
  // bound on both platforms and reserve space for triggers owned by other features.
  const capacity = Math.max(0, 50 - (existingIds.length - ourExistingIds.length));
  const selected = future.slice(0, capacity);
  const plannedIds = new Set(selected.map(r => r.id));
  const futureKeys = new Set(selected.map(r => `${r.id}|${r.fireDate}`));
  for (const [key, timestamp] of Object.entries(receipts)) {
    if (timestamp > now && !futureKeys.has(key)) delete receipts[key];
  }

  const staleIds = ourExistingIds.filter(id => !plannedIds.has(id));
  if (staleIds.length > 0) await notifee.cancelTriggerNotifications(staleIds);
  if (store) await store.save(receipts);

  for (const reminder of [...planned.filter(r => r.catchUp && fireTimestamp(r.fireDate) <= now), ...selected]) {
    const timestamp = fireTimestamp(reminder.fireDate);
    const key = `${reminder.id}|${reminder.fireDate}`;
    const notification = {
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      android: { channelId: store ? PORTFOLIO_CHANNEL_ID : CHANNEL_ID, pressAction: { id: 'default' }, autoCancel: true },
      ios: { sound: 'default', foregroundPresentationOptions: { banner: true, list: true, sound: true } },
      data: { recordId: reminder.recordId, kind: reminder.kind },
    };
    if (timestamp <= now) {
      if (!store || (receipts[key] !== undefined && receipts[key] <= now)) continue;
      await notifee.displayNotification(notification);
      receipts[key] = now;
    } else {
      await notifee.createTriggerNotification(notification, { type: TriggerType.TIMESTAMP, timestamp });
      receipts[key] = timestamp;
    }
    // Persist each successful delivery/schedule so an interrupted batch doesn't
    // replay notifications on the next launch, even after the user dismisses them.
    if (store) await store.save(receipts);
  }
}

/** Cancels every reminder this app has scheduled — used when the user turns reminders
 * off, so stale notifications don't linger until the next resync. */
export function cancelAllReminders(): Promise<void> {
  return enqueue(async () => {
    const existingIds = await notifee.getTriggerNotificationIds();
    const ourIds = existingIds.filter(id => id.startsWith(REMINDER_ID_PREFIX));
    if (ourIds.length > 0) await notifee.cancelTriggerNotifications(ourIds);
  });
}

/** Fires an immediate, non-scheduled notification — used to tell the user a backup
 * export/import finished while they weren't looking at the app. Unlike
 * syncScheduledReminders this is a one-shot `displayNotification`, not a trigger; the
 * caller decides whether firing one is appropriate (e.g. only when backgrounded and
 * permission is already granted — see AppContext's notifyIfBackgrounded). */
export async function displayCompletionNotification(title: string, body: string): Promise<void> {
  await ensureBackupStatusChannel();
  await notifee.displayNotification({
    title,
    body,
    android: { channelId: BACKUP_STATUS_CHANNEL_ID, pressAction: { id: 'default' }, autoCancel: true },
  });
}
