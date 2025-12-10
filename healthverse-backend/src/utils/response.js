import { HTTP_STATUS } from './constants.js';
import { formatSuccessResponse, formatErrorResponse } from './helpers.js';
import { logger } from './logger.js';

/**
 * Standardized response handlers for controllers
 */
export class ApiResponse {
  static success(res, data, message = 'Success', statusCode = HTTP_STATUS.OK, meta = {}) {
    const response = formatSuccessResponse(data, message, meta);
    
    logger.debug('API success response', {
      statusCode,
      path: res.req?.originalUrl,
      method: res.req?.method
    });

    return res.status(statusCode).json(response);
  }

  static created(res, data, message = 'Resource created successfully') {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  static error(res, message, statusCode = HTTP_STATUS.INTERNAL_ERROR, errors = []) {
    const response = formatErrorResponse(message, errors);
    
    logger.error('API error response', {
      statusCode,
      message,
      path: res.req?.originalUrl,
      method: res.req?.method
    });

    return res.status(statusCode).json(response);
  }

  static badRequest(res, message = 'Bad request', errors = []) {
    return this.error(res, message, HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(res, message = 'Unauthorized') {
    return this.error(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res, message = 'Forbidden') {
    return this.error(res, message, HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res, message = 'Resource not found') {
    return this.error(res, message, HTTP_STATUS.NOT_FOUND);
  }

  static validationError(res, errors = []) {
    return this.error(res, 'Validation failed', HTTP_STATUS.BAD_REQUEST, errors);
  }
}

/**
 * Async handler wrapper for error handling
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};