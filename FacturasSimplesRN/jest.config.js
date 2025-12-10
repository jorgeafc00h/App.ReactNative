module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setupTests.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/?(*.)(test|spec).(ts|tsx|js)'
  ],
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  // using babel-jest to handle TS/TSX via `@babel/preset-typescript`
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@assets/(.*)$': '<rootDir>/src/assets/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@screens/(.*)$': '<rootDir>/src/screens/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^react-native/jest/setup$': '<rootDir>/src/tests/react-native-jest-setup.js',
    '^react-native/jest/setup.js$': '<rootDir>/src/tests/react-native-jest-setup.js',
    '^react-native/jest/mock$': '<rootDir>/src/tests/react-native-jest-mock.js',
    '^react-native/jest/mock.js$': '<rootDir>/src/tests/react-native-jest-mock.js',
    '^react-native$': '<rootDir>/src/tests/react-native-shim.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|expo|@expo|react-redux|@reduxjs/toolkit)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/types/**',
    '!src/assets/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Mocks for React Native modules
  setupFiles: ['<rootDir>/src/tests/jestSetup.ts'],
};