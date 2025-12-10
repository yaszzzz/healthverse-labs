import { body, query, param, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';
import { ValidationError } from './errorHandler.js';


/**
 * Handle validation errors consistently
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: errorDetails,
      ip: req.ip
    });

    throw new ValidationError('Validation failed', errorDetails);
  }
  
  next();
};

/**
 * Sanitize input data
 */
const sanitizeInput = (value) => {
  if (typeof value === 'string') {
    return value.trim().replace(/[<>]/g, '');
  }
  return value;
};

// ==================== AUTH VALIDATION ====================

export const validateAuthCallback = [
  query('code')
    .notEmpty()
    .withMessage('Authorization code is required')
    .isLength({ min: 10 })
    .withMessage('Invalid authorization code format')
    .customSanitizer(sanitizeInput),
  
  query('state')
    .notEmpty()
    .withMessage('State parameter is required')
    .isLength({ min: 10 })
    .withMessage('Invalid state parameter format')
    .customSanitizer(sanitizeInput),
  
  query('error')
    .optional()
    .customSanitizer(sanitizeInput),
  
  query('error_description')
    .optional()
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// ==================== HEALTH DATA VALIDATION ====================

export const validateHealthDataCreate = [
  body('steps')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Steps must be between 0 and 100,000')
    .toInt(),
  
  body('calories')
    .optional()
    .isInt({ min: 0, max: 20000 })
    .withMessage('Calories must be between 0 and 20,000')
    .toInt(),
  
  body('bpmAvg')
    .optional()
    .isFloat({ min: 30, max: 220 })
    .withMessage('Average BPM must be between 30 and 220')
    .toFloat(),
  
  body('bpmMin')
    .optional()
    .isFloat({ min: 30, max: 220 })
    .withMessage('Minimum BPM must be between 30 and 220')
    .toFloat(),
  
  body('bpmMax')
    .optional()
    .isFloat({ min: 30, max: 220 })
    .withMessage('Maximum BPM must be between 30 and 220')
    .toFloat(),
  
  body('day')
    .optional()
    .isISO8601()
    .withMessage('Day must be a valid ISO date string')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      // Don't allow future dates
      if (date > now) {
        throw new Error('Date cannot be in the future');
      }
      // Don't allow dates too far in the past (optional)
      const minDate = new Date();
      minDate.setFullYear(minDate.getFullYear() - 1);
      if (date < minDate) {
        throw new Error('Date cannot be more than 1 year in the past');
      }
      return true;
    }),
  
  // Validate at least one health metric is provided
  body()
    .custom((value) => {
      const hasHealthData = value.steps !== undefined || 
                           value.calories !== undefined || 
                           value.bpmAvg !== undefined || 
                           value.bpmMin !== undefined || 
                           value.bpmMax !== undefined;
      
      if (!hasHealthData) {
        throw new Error('At least one health metric must be provided (steps, calories, or heart rate data)');
      }
      return true;
    }),
  
  handleValidationErrors
];

export const validateHealthDataUpdate = [
  body('steps')
    .optional()
    .isInt({ min: 0, max: 100000 })
    .withMessage('Steps must be between 0 and 100,000')
    .toInt(),
  
  body('calories')
    .optional()
    .isInt({ min: 0, max: 20000 })
    .withMessage('Calories must be between 0 and 20,000')
    .toInt(),
  
  body('bpmAvg')
    .optional()
    .isFloat({ min: 30, max: 220 })
    .withMessage('Average BPM must be between 30 and 220')
    .toFloat(),
  
  body('bpmMin')
    .optional()
    .isFloat({ min: 30, max: 220 })
    .withMessage('Minimum BPM must be between 30 and 220')
    .toFloat(),
  
  body('bpmMax')
    .optional()
    .isFloat({ min: 30, max: 220 })
    .withMessage('Maximum BPM must be between 30 and 220')
    .toFloat(),
  
  body('day')
    .optional()
    .isISO8601()
    .withMessage('Day must be a valid ISO date string')
    .custom((value) => {
      const date = new Date(value);
      const now = new Date();
      if (date > now) {
        throw new Error('Date cannot be in the future');
      }
      return true;
    }),
  
  handleValidationErrors
];

// ==================== QUERY PARAM VALIDATION ====================

export const validateTimeRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO date string')
    .custom((value) => {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid startDate format');
      }
      return true;
    }),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO date string')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
      
      if (isNaN(endDate.getTime())) {
        throw new Error('Invalid endDate format');
      }
      
      if (startDate && endDate < startDate) {
        throw new Error('endDate cannot be before startDate');
      }
      
      // Don't allow future dates
      const now = new Date();
      if (endDate > now) {
        throw new Error('endDate cannot be in the future');
      }
      
      return true;
    }),
  
  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
    .toInt(),
  
  query('period')
    .optional()
    .isIn(['day', 'week', 'month', 'year'])
    .withMessage('Period must be one of: day, week, month, year'),
  
  // Validate that either date range OR days is provided, not both
  query()
    .custom((value) => {
      const hasDateRange = value.startDate || value.endDate;
      const hasDays = value.days;
      const hasPeriod = value.period;
      
      if (hasDateRange && (hasDays || hasPeriod)) {
        throw new Error('Cannot use both date range and days/period parameters together');
      }
      
      return true;
    }),
  
  handleValidationErrors
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .default(1)
    .toInt(),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .default(10)
    .toInt(),
  
  handleValidationErrors
];

// ==================== PARAMS VALIDATION ====================

export const validateObjectId = [
  param('id')
    .isUUID()
    .withMessage('Invalid ID format')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

export const validateUserId = [
  param('userId')
    .isUUID()
    .withMessage('Invalid user ID format')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// ==================== USER DATA VALIDATION ====================

export const validateUserProfile = [
  body('name')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .customSanitizer(sanitizeInput),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  
  body('walletAddress')
    .optional()
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('Valid Ethereum wallet address required')
    .customSanitizer(sanitizeInput),
  
  handleValidationErrors
];

// ==================== EXPORT VALIDATION GROUPS ====================

export const validationSchemas = {
  auth: {
    callback: validateAuthCallback
  },
  healthData: {
    create: validateHealthDataCreate,
    update: validateHealthDataUpdate
  },
  query: {
    timeRange: validateTimeRange,
    pagination: validatePagination
  },
  params: {
    objectId: validateObjectId,
    userId: validateUserId
  },
  user: {
    profile: validateUserProfile
  }
};

export default validationSchemas;