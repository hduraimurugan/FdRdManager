// Jest manual mock for @notifee/react-native — no native notification module exists in
// the Jest environment. Enum values match the real package so code comparing against
// them (e.g. `settings.authorizationStatus === AuthorizationStatus.AUTHORIZED`) behaves
// identically under test.

const AuthorizationStatus = { NOT_DETERMINED: -1, DENIED: 0, AUTHORIZED: 1, PROVISIONAL: 2 };
const AndroidImportance = { NONE: 0, MIN: 1, LOW: 2, DEFAULT: 3, HIGH: 4 };
const TriggerType = { TIMESTAMP: 0, INTERVAL: 1 };
const RepeatFrequency = { NONE: -1, HOURLY: 0, DAILY: 1, WEEKLY: 2 };

const defaultExport = {
  createChannel: jest.fn(async () => 'maturity-reminders'),
  createChannels: jest.fn(async () => {}),
  getNotificationSettings: jest.fn(async () => ({ authorizationStatus: AuthorizationStatus.AUTHORIZED })),
  requestPermission: jest.fn(async () => ({ authorizationStatus: AuthorizationStatus.AUTHORIZED })),
  createTriggerNotification: jest.fn(async notification => notification.id ?? 'mock-notification-id'),
  cancelTriggerNotification: jest.fn(async () => {}),
  cancelTriggerNotifications: jest.fn(async () => {}),
  cancelAllNotifications: jest.fn(async () => {}),
  getTriggerNotificationIds: jest.fn(async () => []),
  getTriggerNotifications: jest.fn(async () => []),
  displayNotification: jest.fn(async () => 'mock-notification-id'),
  onForegroundEvent: jest.fn(() => () => {}),
  onBackgroundEvent: jest.fn(),
  openNotificationSettings: jest.fn(async () => {}),
};

module.exports = {
  __esModule: true,
  default: defaultExport,
  AuthorizationStatus,
  AndroidImportance,
  TriggerType,
  RepeatFrequency,
};
