// Jest manual mock for @react-native-documents/picker — no native document picker
// exists in the Jest environment. Only the exports backupIO.ts actually uses are stubbed.

module.exports = {
  pick: jest.fn(async () => [{ uri: 'content://mock/backup.json', name: 'backup.json' }]),
  types: { json: 'application/json', allFiles: '*/*' },
  errorCodes: { OPERATION_CANCELED: 'OPERATION_CANCELED' },
  isErrorWithCode: jest.fn(err => !!err && typeof err.code === 'string'),
};
