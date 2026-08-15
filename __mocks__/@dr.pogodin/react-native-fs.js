// Jest manual mock for @dr.pogodin/react-native-fs — no native filesystem module exists
// in the Jest environment. Only the exports backupIO.ts actually uses are stubbed.

module.exports = {
  CachesDirectoryPath: '/mock/caches',
  writeFile: jest.fn(async () => {}),
  readFile: jest.fn(async () => ''),
  unlink: jest.fn(async () => {}),
};
