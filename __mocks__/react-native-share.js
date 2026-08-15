// Jest manual mock for react-native-share — no native share sheet exists in the Jest
// environment. Only the default-export `open` that backupIO.ts calls is stubbed.

module.exports = {
  open: jest.fn(async () => ({ success: true, message: '' })),
};
