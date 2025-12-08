// Jest setup for React Native Testing Library

import 'react-native-gesture-handler/jestSetup';

// Mock react-native-async-storage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native modules
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Mock expo modules
jest.mock('expo-linear-gradient', () => ({
  LinearGradient: 'LinearGradient',
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo-auth-session', () => ({
  makeRedirectUri: jest.fn(() => 'http://localhost'),
  AuthRequest: jest.fn(),
  AuthRequestPrompt: {},
  AuthSessionResult: {},
  ResponseType: {},
  CodeChallengeMethod: {},
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    reset: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
  useFocusEffect: jest.fn(),
}));

// Mock redux-persist
jest.mock('redux-persist', () => ({
  ...jest.requireActual('redux-persist'),
  persistStore: jest.fn(() => ({
    dispatch: jest.fn(),
    subscribe: jest.fn(),
    getState: jest.fn(() => ({})),
    replaceReducer: jest.fn(),
    purge: jest.fn(),
    flush: jest.fn(),
    pause: jest.fn(),
    persist: jest.fn(),
  })),
  persistReducer: (config: any, reducer: any) => reducer,
}));

// Silence console warnings in tests
console.warn = jest.fn();
console.error = jest.fn();

// Global test timeout
jest.setTimeout(10000);