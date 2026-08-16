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
export async function syncScheduledReminders(planned: PlannedReminder[]): Promise<void> {
  await ensureChannel();

  const existingIds = await notifee.getTriggerNotificationIds();
  const ourExistingIds = existingIds.filter(id => id.startsWith(REMINDER_ID_PREFIX));
  const plannedIds = new Set(planned.map(r => r.id));

  const staleIds = ourExistingIds.filter(id => !plannedIds.has(id));
  if (staleIds.length > 0) await notifee.cancelTriggerNotifications(staleIds);

  for (const reminder of planned) {
    const timestamp = fireTimestamp(reminder.fireDate);
    if (timestamp <= Date.now()) continue; // planReminders already excludes these; defensive only
    await notifee.createTriggerNotification(
      {
        id: reminder.id,
        title: reminder.title,
        body: reminder.body,
        android: { channelId: CHANNEL_ID, pressAction: { id: 'default' } },
        data: { recordId: reminder.recordId, kind: reminder.kind },
      },
      { type: TriggerType.TIMESTAMP, timestamp },
    );
  }
}

/** Cancels every reminder this app has scheduled — used when the user turns reminders
 * off, so stale notifications don't linger until the next resync. */
export async function cancelAllReminders(): Promise<void> {
  const existingIds = await notifee.getTriggerNotificationIds();
  const ourIds = existingIds.filter(id => id.startsWith(REMINDER_ID_PREFIX));
  if (ourIds.length > 0) await notifee.cancelTriggerNotifications(ourIds);
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
