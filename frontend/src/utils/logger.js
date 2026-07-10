/**
 * Centralized logging utility
 * Automatically disabled in production builds for better performance
 * and to prevent sensitive data exposure in console
 */

const isDev = import.meta.env.DEV;

/**
 * Logger object with methods for different log levels
 * - log: General logging (dev only)
 * - warn: Warning messages (dev only)
 * - error: Error messages (always enabled)
 * - debug: Detailed debugging (dev only)
 * - info: Informational messages (dev only)
 */
export const logger = {
  /**
   * General logging - only in development
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },

  /**
   * Warning messages - only in development
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },

  /**
   * Error messages - always enabled
   * Errors should always be logged even in production for debugging
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(...args);
  },

  /**
   * Debug messages - only in development
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  },

  /**
   * Info messages - only in development
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },
};

/**
 * Create a namespaced logger for specific modules
 * Useful for filtering logs by component/module
 * @param {string} namespace - The namespace/module name
 * @returns {object} Logger object with namespace prefix
 */
export const createLogger = (namespace) => ({
  log: (...args) => logger.log(`[${namespace}]`, ...args),
  warn: (...args) => logger.warn(`[${namespace}]`, ...args),
  error: (...args) => logger.error(`[${namespace}]`, ...args),
  debug: (...args) => logger.debug(`[${namespace}]`, ...args),
  info: (...args) => logger.info(`[${namespace}]`, ...args),
});

export default logger;
