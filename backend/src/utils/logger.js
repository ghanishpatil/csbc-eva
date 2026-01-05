/**
 * Enhanced Logging Utility
 * Provides structured logging with different log levels
 * SECURITY: Sanitizes sensitive data from logs
 */

const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
};

/**
 * Sanitize data to prevent logging sensitive information
 * @param {any} data - Data to sanitize
 * @returns {any} - Sanitized data
 */
const sanitizeLogData = (data) => {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveKeys = ['password', 'flag', 'flagHash', 'privateKey', 'secret', 'token'];
  const sanitized = { ...data };

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
};

/**
 * Enhanced logger with structured output
 */
export const logger = {
  /**
   * Log error with context
   */
  error: (message, context = {}) => {
    const sanitizedContext = sanitizeLogData(context);
    const logEntry = {
      level: LOG_LEVELS.ERROR,
      message,
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
    };
    console.error(`[ERROR] ${message}`, JSON.stringify(sanitizedContext, null, 2));
    return logEntry;
  },

  /**
   * Log warning with context
   */
  warn: (message, context = {}) => {
    const sanitizedContext = sanitizeLogData(context);
    const logEntry = {
      level: LOG_LEVELS.WARN,
      message,
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
    };
    console.warn(`[WARN] ${message}`, JSON.stringify(sanitizedContext, null, 2));
    return logEntry;
  },

  /**
   * Log info with context
   */
  info: (message, context = {}) => {
    const sanitizedContext = sanitizeLogData(context);
    const logEntry = {
      level: LOG_LEVELS.INFO,
      message,
      context: sanitizedContext,
      timestamp: new Date().toISOString(),
    };
    console.log(`[INFO] ${message}`, JSON.stringify(sanitizedContext, null, 2));
    return logEntry;
  },

  /**
   * Log debug info (only in development)
   */
  debug: (message, context = {}) => {
    if (process.env.NODE_ENV === 'development') {
      const sanitizedContext = sanitizeLogData(context);
      const logEntry = {
        level: LOG_LEVELS.DEBUG,
        message,
        context: sanitizedContext,
        timestamp: new Date().toISOString(),
      };
      console.debug(`[DEBUG] ${message}`, JSON.stringify(sanitizedContext, null, 2));
      return logEntry;
    }
    return null;
  },

  /**
   * Log request with correlation ID
   */
  request: (method, path, userId, correlationId) => {
    logger.info(`Request: ${method} ${path}`, {
      method,
      path,
      userId,
      correlationId,
    });
  },

  /**
   * Log admin action
   */
  adminAction: (action, adminId, details = {}) => {
    logger.info(`Admin action: ${action}`, {
      action,
      adminId,
      ...sanitizeLogData(details),
    });
  },

  /**
   * Log flag submission attempt
   */
  flagSubmission: (teamId, levelId, success, userId) => {
    const level = success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN;
    const message = success
      ? `Flag submission successful: Team ${teamId}, Level ${levelId}`
      : `Flag submission failed: Team ${teamId}, Level ${levelId}`;

    if (level === LOG_LEVELS.INFO) {
      logger.info(message, { teamId, levelId, userId });
    } else {
      logger.warn(message, { teamId, levelId, userId });
    }
  },
};

