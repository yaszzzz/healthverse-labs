import { config } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { HTTP_STATUS, ERROR_MESSAGES } from "../utils/constants.js";

/**
 * Custom Error Classes for different error types
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = null, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Mark as operational error (not programming error)
    
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, HTTP_STATUS.BAD_REQUEST, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = ERROR_MESSAGES.UNAUTHORIZED) {
    super(message, HTTP_STATUS.UNAUTHORIZED, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = ERROR_MESSAGES.FORBIDDEN) {
    super(message, HTTP_STATUS.FORBIDDEN, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, HTTP_STATUS.NOT_FOUND, 'NOT_FOUND');
  }
}

export class RateLimitError extends AppError {
  constructor(message = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class DatabaseError extends AppError {
  constructor(message = 'Database operation failed') {
    super(message, HTTP_STATUS.INTERNAL_ERROR, 'DATABASE_ERROR');
  }
}

/**
 * Main error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.stack = err.stack;

  // Log the error
  logError(error, req);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    // Mongoose validation error (if you switch to MongoDB later)
    error = handleValidationError(err);
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    error = handleCastError(err);
  } else if (err.code === 23505) {
    // PostgreSQL unique constraint violation
    error = handleUniqueConstraintError(err);
  } else if (err.code === 23503) {
    // PostgreSQL foreign key violation
    error = handleForeignKeyError(err);
  } else if (err.code === 23502) {
    // PostgreSQL not null violation
    error = handleNotNullViolationError(err);
  } else if (err.name === 'JsonWebTokenError') {
    // JWT error
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    error = handleJWTExpiredError();
  } else if (err.code === 'ECONNREFUSED') {
    // Database connection refused
    error = handleDatabaseConnectionError(err);
  }

  // Set default values if not set
  const statusCode = error.statusCode || HTTP_STATUS.INTERNAL_ERROR;
  const message = error.message || ERROR_MESSAGES.SERVER_ERROR;

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message,
      code: error.code || 'INTERNAL_ERROR',
      ...(error.details && { details: error.details }),
      ...(config.nodeEnv === 'development' && {
        stack: error.stack,
        originalError: err.message
      })
    },
    ...(config.nodeEnv === 'development' && {
      _debug: {
        path: req.path,
        method: req.method,
        timestamp: new Date().toISOString()
      }
    })
  };

  // Special handling for rate limit errors
  if (statusCode === 429) {
    errorResponse.error.retryAfter = err.retryAfter;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Error logging utility
 */
const logError = (error, req) => {
  const logContext = {
    name: error.name,
    code: error.code,
    statusCode: error.statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id
  };

  if (error.statusCode >= 500) {
    // Server errors - log as error
    logger.error('Server Error', error, logContext);
  } else if (error.statusCode >= 400) {
    // Client errors - log as warning
    logger.warn('Client Error', { ...logContext, message: error.message });
  } else {
    // Other errors
    logger.error('Unknown Error', error, logContext);
  }
};

/**
 * Error type handlers
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data: ${errors.join(', ')}`;
  return new ValidationError(message, errors);
};

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message);
};

const handleUniqueConstraintError = (err) => {
  const message = 'Resource already exists with these details';
  return new ValidationError(message);
};

const handleForeignKeyError = (err) => {
  const message = 'Referenced resource not found';
  return new ValidationError(message);
};

const handleNotNullViolationError = (err) => {
  const message = 'Required field missing';
  return new ValidationError(message);
};

const handleJWTError = () => {
  return new AuthenticationError('Invalid token');
};

const handleJWTExpiredError = () => {
  return new AuthenticationError('Token expired');
};

const handleDatabaseConnectionError = (err) => {
  logger.error('Database connection failed', err);
  return new DatabaseError('Service temporarily unavailable');
};

/**
 * 404 handler middleware (should be after all routes)
 */
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.method} ${req.originalUrl}`);
  next(error);
};

/**
 * Async error handler wrapper (eliminates try-catch blocks)
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  DatabaseError
};