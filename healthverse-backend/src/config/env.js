import dotenv from "dotenv";
import { logger } from "../utils/logger.js";

dotenv.config();

/**
 * Validate all required environment variables
 */
export function validateEnv() {
  const required = [
    'CLIENT_ID', 
    'CLIENT_SECRET', 
    'REDIRECT_URI',
    'SESSION_SECRET' // Added this since you're using sessions
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validate URL format for redirect URI
  if (process.env.REDIRECT_URI && !process.env.REDIRECT_URI.startsWith('http')) {
    const errorMsg = 'REDIRECT_URI must be a valid URL starting with http/https';
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Validate session secret strength in production
  if (process.env.NODE_ENV === 'production' && process.env.SESSION_SECRET) {
    if (process.env.SESSION_SECRET.length < 32) {
      logger.warn('SESSION_SECRET is shorter than recommended 32 characters for production');
    }
  }

  logger.info('Environment variables validated successfully', {
    nodeEnv: process.env.NODE_ENV,
    hasAllRequired: true
  });
}

/**
 * Application configuration from environment variables
 */
export const config = {
  // OAuth Configuration
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  redirectUri: process.env.REDIRECT_URI,
  
  // Server Configuration
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Security
  sessionSecret: process.env.SESSION_SECRET,
  
  // Database (if you add later)
  databaseUrl: process.env.DATABASE_URL,
  
  // JWT (if you add later)
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
};

/**
 * Check if running in production
 */
export const isProduction = config.nodeEnv === 'production';

/**
 * Check if running in development
 */
export const isDevelopment = config.nodeEnv === 'development';

/**
 * Get configuration for specific environment
 */
export const getConfig = () => {
  const baseConfig = {
    // Development defaults
    logLevel: 'debug',
    corsOptions: {
      origin: config.corsOrigin,
      credentials: true
    }
  };

  if (isProduction) {
    return {
      ...baseConfig,
      logLevel: 'warn',
      corsOptions: {
        origin: config.corsOrigin, // Should be your frontend URL in production
        credentials: true
      }
    };
  }

  return baseConfig;
};

// Auto-validate on import (optional)
if (isDevelopment) {
  try {
    validateEnv();
  } catch (error) {
    logger.warn('Environment validation failed on import:', error.message);
  }
}

export default {
  config,
  validateEnv,
  isProduction,
  isDevelopment,
  getConfig
};