import bcrypt from 'bcryptjs';
import { HEALTH_RANGES, HEALTH_METRICS, ERROR_MESSAGES } from './constants.js';
import { logger } from './logger.js';

/**
 * Password utilities
 */
export const hashPassword = async (password) => {
  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (password, hashedPassword) => {
  if (!password || !hashedPassword) {
    return false;
  }
  return await bcrypt.compare(password, hashedPassword);
};

/**
 * Health data validation utilities
 */
export const validateHealthMetric = (metric, value) => {
  if (value === null || value === undefined) return true; // Allow null/undefined for optional fields
  
  const numValue = Number(value);
  if (isNaN(numValue)) return false;

  switch (metric) {
    case HEALTH_METRICS.STEPS:
      return numValue >= HEALTH_RANGES.STEPS.MIN && numValue <= HEALTH_RANGES.STEPS.MAX;
    
    case HEALTH_METRICS.CALORIES:
      return numValue >= HEALTH_RANGES.CALORIES.MIN && numValue <= HEALTH_RANGES.CALORIES.MAX;
    
    case HEALTH_METRICS.BPM_AVG:
    case HEALTH_METRICS.BPM_MIN:
    case HEALTH_METRICS.BPM_MAX:
      return numValue >= HEALTH_RANGES.HEART_RATE.MIN && numValue <= HEALTH_RANGES.HEART_RATE.MAX;
    
    default:
      return false;
  }
};

export const validateHealthData = (data) => {
  const errors = [];
  const validatedData = {};

  // Validate each provided metric
  for (const [metric, value] of Object.entries(data)) {
    if (Object.values(HEALTH_METRICS).includes(metric)) {
      if (!validateHealthMetric(metric, value)) {
        errors.push(`Invalid value for ${metric}: ${value}`);
      } else {
        validatedData[metric] = Number(value);
      }
    }
  }

  // At least one metric must be provided
  if (Object.keys(validatedData).length === 0) {
    errors.push(ERROR_MESSAGES.INVALID_HEALTH_METRIC);
  }

  // Validate BPM consistency if multiple BPM fields provided
  if (validatedData.bpmMin && validatedData.bpmMax && validatedData.bpmAvg) {
    if (validatedData.bpmMin > validatedData.bpmMax) {
      errors.push('bpmMin cannot be greater than bpmMax');
    }
    if (validatedData.bpmAvg < validatedData.bpmMin || validatedData.bpmAvg > validatedData.bpmMax) {
      errors.push('bpmAvg must be between bpmMin and bpmMax');
    }
  }

  return {
    isValid: errors.length === 0,
    data: validatedData,
    errors
  };
};

/**
 * Date utilities for health data
 */
export const formatHealthDate = (date = new Date()) => {
  // Returns date in YYYY-MM-DD format for daily health data
  return new Date(date).toISOString().split('T')[0];
};

export const parseHealthDate = (dateString) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format');
  }
  return date;
};

export const getDateRange = (period = 'week') => {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(endDate.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default:
      startDate.setDate(endDate.getDate() - 7);
  }

  return {
    startDate: formatHealthDate(startDate),
    endDate: formatHealthDate(endDate)
  };
};

/**
 * User input sanitization
 */
export const sanitizeEmail = (email) => {
  if (!email) return null;
  return email.toLowerCase().trim();
};

export const sanitizeString = (input, maxLength = 255) => {
  if (typeof input !== 'string') return input;
  
  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Basic XSS protection
    .trim();
};

/**
 * Pagination utilities
 */
export const generatePagination = (page = 1, limit = 10, totalCount = 0) => {
  const currentPage = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit))); // Cap at 100 items per page
  const totalPages = Math.ceil(totalCount / pageSize);
  
  return {
    currentPage,
    pageSize,
    totalCount,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

/**
 * Response formatting utilities
 */
export const formatSuccessResponse = (data, message = 'Success', meta = {}) => {
  return {
    success: true,
    message,
    data,
    ...meta
  };
};

export const formatErrorResponse = (message, errors = [], code = null) => {
  return {
    success: false,
    error: {
      message,
      code,
      details: errors
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Wallet address validation (since you have walletAddress in schema)
 */
export const validateWalletAddress = (address) => {
  if (!address) return false;
  // Basic Ethereum address validation
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};