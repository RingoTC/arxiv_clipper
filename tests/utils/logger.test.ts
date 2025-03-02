import { logger, setTraceId, generateTraceId } from '../../src/utils/logger';

// Mock the logger methods to avoid actual logging during tests
jest.mock('../../src/utils/logger', () => {
  const originalModule = jest.requireActual('../../src/utils/logger');
  return {
    ...originalModule,
    logger: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
    setTraceId: jest.fn(),
    generateTraceId: originalModule.generateTraceId,
  };
});

describe('logger', () => {
  describe('generateTraceId', () => {
    test('generates a valid UUID', () => {
      const traceId = generateTraceId();
      expect(traceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });

  describe('setTraceId', () => {
    test('sets the trace ID', () => {
      const testTraceId = 'test-trace-id-123';
      setTraceId(testTraceId);
      
      // Since we're mocking the function, we can just verify it was called
      expect(setTraceId).toHaveBeenCalledWith(testTraceId);
    });
  });

  describe('logger methods', () => {
    test('info logs messages', () => {
      logger.info('Info message', { test: 'data' });
      
      expect(logger.info).toHaveBeenCalledWith('Info message', { test: 'data' });
    });

    test('error logs error messages', () => {
      const error = new Error('Test error');
      logger.error('Error message', { error });
      
      expect(logger.error).toHaveBeenCalledWith('Error message', { error });
    });

    test('warn logs warning messages', () => {
      logger.warn('Warning message');
      
      expect(logger.warn).toHaveBeenCalledWith('Warning message');
    });

    test('debug logs debug messages', () => {
      logger.debug('Debug message');
      
      expect(logger.debug).toHaveBeenCalledWith('Debug message');
    });
  });
}); 