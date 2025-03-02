import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import { CONFIG_DIR } from './config';
import winston from 'winston';
import { format } from 'winston';
const { combine, timestamp, printf, colorize, json } = format;

// Define log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Define log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  traceId: string;
  context?: Record<string, any>;
}

// Create logs directory
const LOGS_DIR = path.join(CONFIG_DIR, 'logs');
fs.ensureDirSync(LOGS_DIR);

// Log file path
const LOG_FILE = path.join(LOGS_DIR, `arxiv-downloader-${new Date().toISOString().split('T')[0]}.log`);

// Current trace ID (for backend)
let currentTraceId: string | null = null;

// Generate a new trace ID
const generateTraceId = (): string => {
  return uuidv4();
};

// Set the current trace ID
const setTraceId = (traceId: string): void => {
  currentTraceId = traceId;
};

// Get the current trace ID or generate a new one
const getTraceId = (): string => {
  if (!currentTraceId) {
    currentTraceId = generateTraceId();
  }
  return currentTraceId;
};

// Reset the current trace ID
const resetTraceId = (): void => {
  currentTraceId = null;
};

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, traceId, ...metadata }) => {
  const metadataStr = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
  return `${timestamp} [${level.toUpperCase()}] [${traceId}] ${message}${metadataStr}`;
});

// Create Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    timestamp(),
    json()
  ),
  defaultMeta: { 
    service: 'arxiv-downloader',
    get traceId() { return getTraceId(); }
  },
  transports: [
    // Write logs to file
    new winston.transports.File({ 
      filename: path.join(LOGS_DIR, `arxiv-downloader-error-${new Date().toISOString().split('T')[0]}.log`), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(LOGS_DIR, `arxiv-downloader-${new Date().toISOString().split('T')[0]}.log`) 
    }),
  ],
});

// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp(),
      consoleFormat
    )
  }));
}

// Create middleware for HTTP requests
export const requestLoggerMiddleware = (
  req: any,
  res: any,
  next?: () => void
): void => {
  // Generate a trace ID for this request
  const traceId = req.headers['x-trace-id'] || generateTraceId();
  
  // Set the trace ID for this request
  setTraceId(traceId);
  
  // Add trace ID to response headers
  res.setHeader('X-Trace-ID', traceId);
  
  // Log the request
  logger.info(`${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    ip: req.socket.remoteAddress,
    userAgent: req.headers['user-agent']
  });
  
  // Track response
  const originalEnd = res.end;
  const startTime = Date.now();
  
  res.end = function(...args: any[]) {
    const duration = Date.now() - startTime;
    
    logger.info(`Response: ${res.statusCode}`, {
      statusCode: res.statusCode,
      duration: `${duration}ms`
    });
    
    // Reset trace ID after request is complete
    resetTraceId();
    
    // Call the original end method
    return originalEnd.apply(this, args);
  };
  
  // Continue to next middleware if provided
  if (next) {
    next();
  }
};

// Create a wrapper for the logger with trace ID support
interface LoggerWithTraceId extends winston.Logger {
  infoWithTraceId(message: string, meta?: any, traceId?: string): winston.Logger;
  errorWithTraceId(message: string, meta?: any, traceId?: string): winston.Logger;
  warnWithTraceId(message: string, meta?: any, traceId?: string): winston.Logger;
  debugWithTraceId(message: string, meta?: any, traceId?: string): winston.Logger;
}

// Add custom methods for trace ID support
const loggerWithTraceId = logger as LoggerWithTraceId;

// Add info method with trace ID
loggerWithTraceId.infoWithTraceId = function(message: string, meta?: any, traceId?: string): winston.Logger {
  if (traceId) {
    setTraceId(traceId);
  }
  return this.info(message, meta);
};

// Add error method with trace ID
loggerWithTraceId.errorWithTraceId = function(message: string, meta?: any, traceId?: string): winston.Logger {
  if (traceId) {
    setTraceId(traceId);
  }
  return this.error(message, meta);
};

// Add warn method with trace ID
loggerWithTraceId.warnWithTraceId = function(message: string, meta?: any, traceId?: string): winston.Logger {
  if (traceId) {
    setTraceId(traceId);
  }
  return this.warn(message, meta);
};

// Add debug method with trace ID
loggerWithTraceId.debugWithTraceId = function(message: string, meta?: any, traceId?: string): winston.Logger {
  if (traceId) {
    setTraceId(traceId);
  }
  return this.debug(message, meta);
};

// Export the logger and helper functions
export {
  loggerWithTraceId as logger,
  generateTraceId,
  setTraceId,
  getTraceId,
  resetTraceId
};

export default loggerWithTraceId; 