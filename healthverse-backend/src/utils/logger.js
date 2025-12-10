/**
 * Structured logger for HealthVerse backend
 */
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  #formatMessage(level, message, meta = {}) {
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      service: 'healthverse-backend',
      message,
      ...meta
    };

    return this.isDevelopment 
      ? `${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`
      : JSON.stringify(logEntry);
  }

  info(message, meta = {}) {
    console.log(this.#formatMessage('INFO', message, meta));
  }

  error(message, error = null) {
    const meta = error ? {
      error: error.message,
      stack: this.isDevelopment ? error.stack : undefined,
      code: error.code
    } : {};

    console.error(this.#formatMessage('ERROR', message, meta));
  }

  warn(message, meta = {}) {
    console.warn(this.#formatMessage('WARN', message, meta));
  }

  debug(message, meta = {}) {
    if (this.isDevelopment) {
      console.debug(this.#formatMessage('DEBUG', message, meta));
    }
  }

  // Specialized loggers for different domains
  auth(message, meta = {}) {
    this.info(`[AUTH] ${message}`, meta);
  }

  healthData(message, meta = {}) {
    this.info(`[HEALTH_DATA] ${message}`, meta);
  }

  oauth(message, meta = {}) {
    this.info(`[OAUTH] ${message}`, meta);
  }

  database(message, meta = {}) {
    this.info(`[DATABASE] ${message}`, meta);
  }
}

// Export singleton instance
export const logger = new Logger();
export default logger;