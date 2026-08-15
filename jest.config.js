module.exports = {
  preset: '@react-native/jest-preset',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community|-documents)?|@react-navigation|@dr\\.pogodin/react-native-fs|react-native-.*|@noble/(hashes|ciphers)|@notifee/react-native)/)',
  ],
  setupFiles: ['react-native-gesture-handler/jestSetup'],
};
