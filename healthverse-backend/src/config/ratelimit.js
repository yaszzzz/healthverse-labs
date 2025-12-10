import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger.js";

/**
 * Standard rate limit handler
 */
const handleRateLimit = (req, res) => {
  logger.warn('Rate limit exceeded', {
    ip: req.ip,
    method: req.method,
    url: req.url
  });
  
  return res.status(429).json({
    success: false,
    error: {
      message: "Too many requests, please try again later",
      code: "RATE_LIMIT_EXCEEDED"
    }
  });
};

/**
 * Skip rate limit for certain conditions
 */
const skipRateLimit = (req) => {
  // Skip for health checks
  if (req.url === '/health' || req.url === '/status') {
    return true;
  }
  
  return false;
};

// ==================== RATE LIMITERS ====================

/**
 * General API rate limiter
 * 100 requests per 15 minutes
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    // Different limits based on environment
    if (process.env.NODE_ENV === 'development') return 1000;
    return 100;
  },
  message: handleRateLimit,
  skip: skipRateLimit,
  standardHeaders: true,
  legacyHeaders: false,
  // FIX: Remove custom keyGenerator for now
  // keyGenerator: (req) => req.ip
});

/**
 * Authentication rate limiter - STRICT
 * 5 attempts per hour for sensitive endpoints
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      endpoint: req.url
    });
    
    return res.status(429).json({
      success: false,
      error: {
        message: "Too many authentication attempts. Please try again in an hour.",
        code: "AUTH_RATE_LIMIT_EXCEEDED"
      }
    });
  },
  skip: skipRateLimit,
  standardHeaders: true
});

/**
 * Fitness data upload limiter
 * 10 requests per minute to prevent spam
 */
export const fitDataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10,
  message: (req, res) => {
    logger.warn('Fit data rate limit exceeded', {
      ip: req.ip,
      endpoint: req.url
    });
    
    return res.status(429).json({
      success: false,
      error: {
        message: "Too many fitness data requests. Please slow down.",
        code: "FIT_DATA_RATE_LIMIT_EXCEEDED"
      }
    });
  },
  skip: skipRateLimit,
  standardHeaders: true
});

export default {
  generalLimiter,
  authLimiter,
  fitDataLimiter
};