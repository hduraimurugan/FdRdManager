import { REMINDER_ID_PREFIX } from './reminders';

type NotifeeClient = typeof import('./notifeeClient');

function loadClient(): NotifeeClient {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./notifeeClient');
}

function mockNotifee() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('@notifee/react-native').default;
}

beforeEach(() => {
  jest.resetModules();
});

describe('hasNotificationPermission / requestNotificationPermission', () => {
  it('reports granted when the mock reports AUTHORIZED (the default)', async () => {
    const client = loadClient();
    await expect(client.hasNotificationPermission()).resolves.toBe(true);
  });

  it('reports not granted when the native module reports DENIED', async () => {
    const client = loadClient();
    mockNotifee().getNotificationSettings.mockResolvedValueOnce({ authorizationStatus: 0 });
    await expect(client.hasNotificationPermission()).resolves.toBe(false);
  });

  it('requestNotificationPermission resolves true only on AUTHORIZED', async () => {
    const client = loadClient();
    mockNotifee().requestPermission.mockResolvedValueOnce({ authorizationStatus: 0 });
    await expect(client.requestNotificationPermission()).resolves.toBe(false);
  });
});

describe('syncScheduledReminders', () => {
  function reminder(id: string, fireDate: string) {
    return { id: `${REMINDER_ID_PREFIX}${id}`, title: 't', body: 'b', fireDate, recordId: id, kind: 'FD' as const };
  }

  it('creates a trigger notification for each planned reminder', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    await client.syncScheduledReminders([reminder('fd-1', '2099-01-01')]);
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(1);
    const [notification] = notifee.createTriggerNotification.mock.calls[0];
    expect(notification.id).toBe(`${REMINDER_ID_PREFIX}fd-1`);
  });

  it('cancels scheduled reminders that are no longer in the plan', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    notifee.getTriggerNotificationIds.mockResolvedValueOnce([`${REMINDER_ID_PREFIX}fd-stale`, `${REMINDER_ID_PREFIX}fd-keep`]);
    await client.syncScheduledReminders([reminder('fd-keep', '2099-01-01')]);
    expect(notifee.cancelTriggerNotifications).toHaveBeenCalledWith([`${REMINDER_ID_PREFIX}fd-stale`]);
  });

  it('never cancels ids that are not ours (different prefix)', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    notifee.getTriggerNotificationIds.mockResolvedValueOnce(['some-other-features-notification-id']);
    await client.syncScheduledReminders([]);
    expect(notifee.cancelTriggerNotifications).not.toHaveBeenCalled();
  });

  it('skips (re)creating a reminder whose computed fire timestamp has already passed', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    await client.syncScheduledReminders([reminder('fd-1', '2000-01-01')]);
    expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
  });

  it('ensures the notification channel exists before scheduling anything', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    await client.syncScheduledReminders([reminder('fd-1', '2099-01-01')]);
    expect(notifee.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: 'maturity-reminders' }));
  });
});

describe('cancelAllReminders', () => {
  it('cancels only ids with the reminder prefix', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    notifee.getTriggerNotificationIds.mockResolvedValueOnce([`${REMINDER_ID_PREFIX}fd-1`, 'unrelated-id']);
    await client.cancelAllReminders();
    expect(notifee.cancelTriggerNotifications).toHaveBeenCalledWith([`${REMINDER_ID_PREFIX}fd-1`]);
  });

  it('does nothing when there is nothing of ours scheduled', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    notifee.getTriggerNotificationIds.mockResolvedValueOnce([]);
    await client.cancelAllReminders();
    expect(notifee.cancelTriggerNotifications).not.toHaveBeenCalled();
  });
});

describe('displayCompletionNotification', () => {
  it('ensures its own channel exists, separate from the reminders channel', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    await client.displayCompletionNotification('Backup ready', 'backup.json is ready to share');
    expect(notifee.createChannel).toHaveBeenCalledWith(expect.objectContaining({ id: 'backup-status' }));
  });

  it('displays an immediate notification with the given title and body', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    await client.displayCompletionNotification('Import complete', 'Backup restored — 3 FD(s), 1 RD(s)');
    expect(notifee.displayNotification).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Import complete', body: 'Backup restored — 3 FD(s), 1 RD(s)' }),
    );
  });
});
