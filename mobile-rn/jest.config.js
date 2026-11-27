module.exports = {
  preset: '@react-native/jest-preset',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native-astryx(/.*)?$': '<rootDir>/jest.astryx-mock.js',
    '\\.css$': '<rootDir>/jest.css-mock.js',
  },
  // ESM-only packages must be transpiled for Jest.
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-navigation|@solar-icons|react-native-svg|react-native-reanimated|react-native-worklets|react-native-gesture-handler|react-native-safe-area-context|react-native-haptic-feedback|react-native-keychain|react-native-app-auth|@react-native-async-storage|@material|react-native-blur-overlay|react-native-astryx|react-strict-dom|@stylexjs|react-native-m3|react-native-nitro-modules|uniwind)/)',
  ],
};
