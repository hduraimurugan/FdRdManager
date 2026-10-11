module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community|-documents)?|@react-navigation|@dr\\.pogodin/react-native-fs|react-native-.*|@noble/(hashes|ciphers)|@notifee/react-native)/)',
  ],
  setupFiles: ['react-native-gesture-handler/jestSetup'],
  collectCoverageFrom: [
    'App.tsx',
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/__mocks__/**',
    '!src/**/__tests__/**',
    '!src/**/generated/**',
  ],
  coverageReporters: ['text', 'html', 'json-summary', 'lcov'],
};
