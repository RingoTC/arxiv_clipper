// Jest setup file
import { setTraceId } from '../src/utils/logger';

// Set a fixed trace ID for tests
beforeAll(() => {
  setTraceId('test-trace-id');
});

// Global test timeout
jest.setTimeout(30000);

// Mock console methods to prevent noise during tests
global.console = {
  ...console,
  // Uncomment these to silence console output during tests
  // log: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
}; 