// Global state
const state = {
    papers: [],
    filteredPapers: [],
    selectedPapers: new Set(),
    tags: new Set(),
    currentFilter: {
        searchText: '',
        tag: ''
    },
    activeTab: 'list-tab'
};

// Logger implementation
const logger = {
    // Current trace ID
    traceId: null,
    
    // Generate a random trace ID
    generateTraceId() {
        return 'frontend-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },
    
    // Get current trace ID or generate a new one
    getTraceId() {
        if (!this.traceId) {
            this.traceId = this.generateTraceId();
        }
        return this.traceId;
    },
    
    // Set trace ID
    setTraceId(id) {
        this.traceId = id;
        return this;
    },
    
    // Reset trace ID
    resetTraceId() {
        this.traceId = null;
        return this;
    },
    
    // Format log entry
    formatLogEntry(level, message, context = {}) {
        return {
            timestamp: new Date().toISOString(),
            level,
            message,
            traceId: this.getTraceId(),
            context,
            source: 'frontend'
        };
    },
    
    // Log to console
    logToConsole(entry) {
        const { timestamp, level, message, traceId, context } = entry;
        
        let style = '';
        switch (level) {
            case 'DEBUG':
                style = 'color: #6c757d'; // Gray
                break;
            case 'INFO':
                style = 'color: #28a745'; // Green
                break;
            case 'WARN':
                style = 'color: #ffc107'; // Yellow
                break;
            case 'ERROR':
                style = 'color: #dc3545'; // Red
                break;
        }
        
        console.log(
            `%c${timestamp} [${level}] [${traceId}]%c ${message}`, 
            style, 
            'color: inherit', 
            context
        );
    },
    
    // Send log to server
    sendLogToServer(entry) {
        // Only send logs to server if in production or explicitly enabled
        if (window.ENABLE_REMOTE_LOGGING) {
            // Ensure the log entry is not too large
            const safeEntry = this.sanitizeLogEntry(entry);
            
            // Use the original fetch to avoid circular references
            window.originalFetch('/api/logs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Trace-ID': safeEntry.traceId
                },
                body: JSON.stringify(safeEntry)
            }).catch(err => {
                // Silent fail for logging errors
                console.error('Failed to send log to server:', err);
            });
        }
    },
    
    // Sanitize log entry to ensure it's not too large
    sanitizeLogEntry(entry) {
        // Create a copy of the entry
        const safeEntry = { ...entry };
        
        // Ensure message is not too large
        if (typeof safeEntry.message === 'string' && safeEntry.message.length > 5000) {
            safeEntry.message = safeEntry.message.substring(0, 5000) + '... [truncated]';
            safeEntry.originalMessageSize = entry.message.length;
        }
        
        // Ensure context is not too large
        if (safeEntry.context) {
            const contextStr = JSON.stringify(safeEntry.context);
            if (contextStr.length > 5000) {
                // Create a simplified context
                safeEntry.context = {
                    note: 'Context too large for logging',
                    size: contextStr.length,
                    originalKeys: Object.keys(safeEntry.context)
                };
            }
        }
        
        return safeEntry;
    },
    
    // Log methods
    debug(message, context = {}) {
        const entry = this.formatLogEntry('DEBUG', message, context);
        this.logToConsole(entry);
        this.sendLogToServer(entry);
        return this;
    },
    
    info(message, context = {}) {
        const entry = this.formatLogEntry('INFO', message, context);
        this.logToConsole(entry);
        this.sendLogToServer(entry);
        return this;
    },
    
    warn(message, context = {}) {
        const entry = this.formatLogEntry('WARN', message, context);
        this.logToConsole(entry);
        this.sendLogToServer(entry);
        return this;
    },
    
    error(message, context = {}) {
        const entry = this.formatLogEntry('ERROR', message, context);
        this.logToConsole(entry);
        this.sendLogToServer(entry);
        return this;
    },
    
    // Log HTTP requests
    logRequest(method, url, data = null) {
        // Don't log requests to the logging endpoint to avoid recursion
        if (url === '/api/logs') {
            return this.getTraceId();
        }
        this.info(`${method} ${url}`, { method, url, data });
        return this.getTraceId();
    },
    
    // Log HTTP responses
    logResponse(method, url, status, data = null, duration = null) {
        // Don't log responses from the logging endpoint to avoid recursion
        if (url === '/api/logs') {
            return this;
        }
        
        const context = { method, url, status };
        
        // Ensure data is not too large
        if (data) {
            // Convert to string to check size
            const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
            if (dataStr.length > 5000) {
                context.data = {
                    note: 'Data too large for logging',
                    size: dataStr.length,
                    preview: dataStr.substring(0, 100) + '...'
                };
            } else {
                context.data = data;
            }
        }
        
        if (duration) context.duration = `${duration}ms`;
        
        if (status >= 400) {
            this.error(`Response: ${status} from ${method} ${url}`, context);
        } else {
            this.info(`Response: ${status} from ${method} ${url}`, context);
        }
        return this;
    }
};

// Initialize remote logging flag
window.ENABLE_REMOTE_LOGGING = true; // 默认启用日志记录

// Enhanced fetch with logging
function fetchWithLogging(url, options = {}) {
    const method = options.method || 'GET';
    
    // Skip enhanced logging for log API calls to prevent recursion
    if (url === '/api/logs') {
        return window.originalFetch(url, options);
    }
    
    // Limit request body logging
    let logBody = options.body;
    if (typeof logBody === 'string' && logBody.length > 1000) {
        logBody = logBody.substring(0, 1000) + '... [truncated]';
    }
    
    const traceId = logger.logRequest(method, url, logBody);
    
    // Add trace ID to request headers
    const headers = options.headers || {};
    headers['X-Trace-ID'] = traceId;
    options.headers = headers;
    
    const startTime = Date.now();
    
    return window.originalFetch(url, options)
        .then(response => {
            const duration = Date.now() - startTime;
            
            // Clone the response to read it twice
            const clone = response.clone();
            
            // Process the response data
            return clone.text()
                .then(text => {
                    let data = text;
                    let logData;
                    
                    try {
                        // Try to parse as JSON
                        data = JSON.parse(text);
                        
                        // Create a limited version for logging
                        if (typeof data === 'object' && data !== null) {
                            // For logging, only include basic info
                            logData = { 
                                responseSize: text.length,
                                // Include some basic properties for debugging
                                status: data.status || data.success,
                                error: data.error
                            };
                            
                            // If it's a papers response, include count
                            if (data.papers) {
                                logData.paperCount = data.papers.length;
                            }
                        } else {
                            logData = { responseSize: text.length };
                        }
                    } catch (e) {
                        // Not JSON, use limited text
                        logData = { 
                            responseSize: text.length,
                            preview: text.length > 100 ? text.substring(0, 100) + '...' : text
                        };
                    }
                    
                    // Log the response with limited data
                    logger.logResponse(method, url, response.status, logData, duration);
                    
                    // Return the original response
                    return response;
                });
        })
        .catch(error => {
            const duration = Date.now() - startTime;
            logger.error(`Failed request: ${method} ${url}`, { 
                error: error.message,
                duration: `${duration}ms`
            });
            throw error;
        });
}

// DOM Elements
const tabLinks = document.querySelectorAll('.nav-link');
const tabContents = document.querySelectorAll('.tab-content');

// Tab Navigation
tabLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all tabs
        tabLinks.forEach(l => l.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        // Add active class to clicked tab
        link.classList.add('active');
        const tabId = link.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
        state.activeTab = tabId;
        
        // Log tab change
        logger.info(`Tab changed to ${tabId}`);
        
        // If switching to download tab, update tag selector
        if (tabId === 'download-tab' && typeof populateTagSelector === 'function') {
            populateTagSelector();
        }
    });
});

// Helper function to show alerts
function showAlert(message, type, containerId = 'alert-container') {
    const container = document.getElementById(containerId);
    
    // Check if container exists
    if (!container) {
        console.error(`Alert container with ID "${containerId}" not found. Alert message: ${message}`);
        logger.error(`Alert container not found`, { containerId, message, type });
        return; // Exit early to prevent error
    }
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    
    // Add icon
    const icon = document.createElement('i');
    if (type === 'success') {
        icon.className = 'fas fa-check-circle alert-icon';
    } else {
        icon.className = 'fas fa-exclamation-circle alert-icon';
    }
    alert.appendChild(icon);
    
    // Add message text
    const messageText = document.createElement('span');
    messageText.textContent = message;
    alert.appendChild(messageText);
    
    // Add to container
    container.appendChild(alert);
    
    // Log alert
    logger.info(`Alert shown: ${message}`, { type });
    
    // Auto hide
    setTimeout(() => {
        alert.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            // Check if the element is still in the DOM before removing
            if (alert.parentNode) {
                container.removeChild(alert);
            }
        }, 300);
    }, 5000);
}

// Open the knowledge base directory
function openKnowledgeBase() {
    logger.info('Opening knowledge base directory');
    
    fetchWithLogging('/api/open-kb', {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to open knowledge base');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('Opening knowledge base directory...', 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error opening knowledge base:', error);
        logger.error('Failed to open knowledge base', { error: error.message });
        showAlert(`Error: ${error.message}`, 'error');
    });
}

// Open paper directory
function openPaperDirectory(paperId) {
    logger.info(`Opening paper directory for ${paperId}`);
    
    fetchWithLogging(`/api/open/${paperId}`, {
        method: 'GET'
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to open directory');
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showAlert('Opening paper directory...', 'success');
        } else {
            throw new Error(data.error || 'Unknown error');
        }
    })
    .catch(error => {
        console.error('Error opening directory:', error);
        logger.error(`Failed to open paper directory for ${paperId}`, { error: error.message });
        showAlert(`Error: ${error.message}`, 'error');
    });
}

// Export logger for use in other modules
window.logger = logger;
// Replace global fetch with logging version
window.originalFetch = window.fetch;
window.fetch = fetchWithLogging; 