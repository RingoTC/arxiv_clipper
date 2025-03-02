"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetTraceId = exports.getTraceId = exports.setTraceId = exports.generateTraceId = exports.logger = exports.requestLoggerMiddleware = exports.LogLevel = void 0;
const uuid_1 = require("uuid");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const config_1 = require("./config");
const winston_1 = __importDefault(require("winston"));
const winston_2 = require("winston");
const { combine, timestamp, printf, colorize, json } = winston_2.format;
// Define log levels
var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
// Create logs directory
const LOGS_DIR = path_1.default.join(config_1.CONFIG_DIR, 'logs');
fs_extra_1.default.ensureDirSync(LOGS_DIR);
// Log file path
const LOG_FILE = path_1.default.join(LOGS_DIR, `arxiv-downloader-${new Date().toISOString().split('T')[0]}.log`);
// Current trace ID (for backend)
let currentTraceId = null;
// Generate a new trace ID
const generateTraceId = () => {
    return (0, uuid_1.v4)();
};
exports.generateTraceId = generateTraceId;
// Set the current trace ID
const setTraceId = (traceId) => {
    currentTraceId = traceId;
};
exports.setTraceId = setTraceId;
// Get the current trace ID or generate a new one
const getTraceId = () => {
    if (!currentTraceId) {
        currentTraceId = generateTraceId();
    }
    return currentTraceId;
};
exports.getTraceId = getTraceId;
// Reset the current trace ID
const resetTraceId = () => {
    currentTraceId = null;
};
exports.resetTraceId = resetTraceId;
// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, traceId, ...metadata }) => {
    const metadataStr = Object.keys(metadata).length ? ` ${JSON.stringify(metadata)}` : '';
    return `${timestamp} [${level.toUpperCase()}] [${traceId}] ${message}${metadataStr}`;
});
// Create Winston logger
const logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(timestamp(), json()),
    defaultMeta: {
        service: 'arxiv-downloader',
        get traceId() { return getTraceId(); }
    },
    transports: [
        // Write logs to file
        new winston_1.default.transports.File({
            filename: path_1.default.join(LOGS_DIR, `arxiv-downloader-error-${new Date().toISOString().split('T')[0]}.log`),
            level: 'error'
        }),
        new winston_1.default.transports.File({
            filename: path_1.default.join(LOGS_DIR, `arxiv-downloader-${new Date().toISOString().split('T')[0]}.log`)
        }),
    ],
});
// Add console transport in non-production environments
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston_1.default.transports.Console({
        format: combine(colorize(), timestamp(), consoleFormat)
    }));
}
// Create middleware for HTTP requests
const requestLoggerMiddleware = (req, res, next) => {
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
    res.end = function (...args) {
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
exports.requestLoggerMiddleware = requestLoggerMiddleware;
// Add custom methods for trace ID support
const loggerWithTraceId = logger;
exports.logger = loggerWithTraceId;
// Add info method with trace ID
loggerWithTraceId.infoWithTraceId = function (message, meta, traceId) {
    if (traceId) {
        setTraceId(traceId);
    }
    return this.info(message, meta);
};
// Add error method with trace ID
loggerWithTraceId.errorWithTraceId = function (message, meta, traceId) {
    if (traceId) {
        setTraceId(traceId);
    }
    return this.error(message, meta);
};
// Add warn method with trace ID
loggerWithTraceId.warnWithTraceId = function (message, meta, traceId) {
    if (traceId) {
        setTraceId(traceId);
    }
    return this.warn(message, meta);
};
// Add debug method with trace ID
loggerWithTraceId.debugWithTraceId = function (message, meta, traceId) {
    if (traceId) {
        setTraceId(traceId);
    }
    return this.debug(message, meta);
};
exports.default = loggerWithTraceId;
