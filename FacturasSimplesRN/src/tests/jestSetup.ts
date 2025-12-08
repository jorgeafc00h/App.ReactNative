// Jest setup that runs before setupTests.ts

// Mock global objects
global.fetch = jest.fn();

// Mock console methods for cleaner test output
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  // Keep log and info for debugging tests
  log: jest.fn(),
  info: jest.fn(),
  // Silence warnings and errors unless debugging
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};