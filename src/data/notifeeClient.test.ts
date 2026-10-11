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

describe('portfolio notification delivery', () => {
  function deliveryStore() {
    let receipts: Record<string, number> = {};
    return {
      load: jest.fn(async () => ({ ...receipts })),
      save: jest.fn(async (next: Record<string, number>) => { receipts = { ...next }; }),
    };
  }
  const alert = { id: `${REMINDER_ID_PREFIX}fd-1-soon`, title: 'Maturity soon', body: 'Bank', fireDate: '2000-01-01', recordId: 'fd-1', kind: 'FD' as const, catchUp: true };

  it('delivers existing attention alerts once across resyncs and restarts', async () => {
    const store = deliveryStore();
    await loadClient().syncScheduledReminders([alert], store);
    expect(mockNotifee().displayNotification).toHaveBeenCalledTimes(1);
    await loadClient().syncScheduledReminders([alert], store);
    expect(mockNotifee().displayNotification).toHaveBeenCalledTimes(1);
    jest.resetModules();
    await loadClient().syncScheduledReminders([alert], store);
    expect(mockNotifee().displayNotification).not.toHaveBeenCalled();
  });

  it('does not replay an alert already scheduled before its due time', async () => {
    jest.useFakeTimers();
    try {
      jest.setSystemTime(new Date(2026, 5, 1, 8));
      const client = loadClient();
      const store = deliveryStore();
      const scheduled = { ...alert, fireDate: '2026-06-01' };
      await client.syncScheduledReminders([scheduled], store);
      jest.setSystemTime(new Date(2026, 5, 1, 10));
      await client.syncScheduledReminders([scheduled], store);
      expect(mockNotifee().displayNotification).not.toHaveBeenCalled();
    } finally { jest.useRealTimers(); }
  });

  it('keeps the nearest 50 triggers and cancels farther stale triggers', async () => {
    const client = loadClient();
    const notifee = mockNotifee();
    const planned = Array.from({ length: 60 }, (_, i) => ({ ...alert, id: `${REMINDER_ID_PREFIX}${i}`, fireDate: `${2090 + i}-01-01`, catchUp: false })).reverse();
    notifee.getTriggerNotificationIds.mockResolvedValueOnce([`${REMINDER_ID_PREFIX}59`]);
    await client.syncScheduledReminders(planned, deliveryStore());
    expect(notifee.createTriggerNotification).toHaveBeenCalledTimes(50);
    expect(notifee.createTriggerNotification.mock.calls[0][0].id).toBe(`${REMINDER_ID_PREFIX}0`);
    expect(notifee.cancelTriggerNotifications).toHaveBeenCalledWith([`${REMINDER_ID_PREFIX}59`]);
  });

  it('retries failed delivery and recovers the queue after a rejected sync', async () => {
    const client = loadClient();
    const store = deliveryStore();
    mockNotifee().displayNotification.mockRejectedValueOnce(new Error('native failure'));
    await expect(client.syncScheduledReminders([alert], store)).rejects.toThrow('native failure');
    await client.syncScheduledReminders([alert], store);
    expect(mockNotifee().displayNotification).toHaveBeenCalledTimes(2);
  });

  it('removes receipts for cancelled future events so they can be enabled again', async () => {
    const client = loadClient();
    const store = deliveryStore();
    await client.syncScheduledReminders([{ ...alert, fireDate: '2099-01-01' }], store);
    await client.syncScheduledReminders([], store);
    expect(await store.load()).toEqual({});
  });

  it('serializes simultaneous resyncs to avoid duplicate attention alerts', async () => {
    const client = loadClient();
    const store = deliveryStore();
    await Promise.all([client.syncScheduledReminders([alert], store), client.syncScheduledReminders([alert], store)]);
    expect(mockNotifee().displayNotification).toHaveBeenCalledTimes(1);
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
