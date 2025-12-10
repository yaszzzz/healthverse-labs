import { logger } from '../utils/logger.js';
import { HTTP_STATUS, ERROR_MESSAGES } from '../utils/constants.js';
import { authService } from '../services/auth.service.js';

/**
 * Require authentication middleware
 * Blocks unauthenticated requests
 */
export const requireAuth = async (req, res, next) => {
  try {
    // Check if user has valid session tokens
    if (!req.session.tokens || !req.session.tokens.access_token) {
      logger.warn('Unauthorized access attempt - no session tokens', {
        ip: req.ip,
        method: req.method,
        url: req.url,
        hasSession: !!req.session,
        hasTokens: !!req.session.tokens
      });

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.UNAUTHORIZED,
          code: 'AUTH_REQUIRED',
          redirectTo: '/auth/google'
        }
      });
    }

    // Verify tokens are still valid (not expired)
    const isAuthenticated = authService.isAuthenticated(req.session);
    if (!isAuthenticated) {
      logger.warn('Session tokens expired', {
        ip: req.ip,
        url: req.url,
        userId: req.session.user?.id
      });

      // Clear expired session
      req.session.destroy();

      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          message: 'Session expired. Please login again.',
          code: 'SESSION_EXPIRED',
          redirectTo: '/auth/google'
        }
      });
    }

    // Add user info to request object for easy access in controllers
    if (req.session.user) {
      req.user = req.session.user;
    }

    logger.debug('Authentication successful', {
      userId: req.user?.id,
      method: req.method,
      url: req.url
    });

    next();

  } catch (error) {
    logger.error('Authentication middleware error', error);
    
    return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
      success: false,
      error: {
        message: ERROR_MESSAGES.SERVER_ERROR,
        code: 'AUTH_MIDDLEWARE_ERROR'
      }
    });
  }
};

/**
 * Optional authentication middleware
 * Sets authentication status but doesn't block
 */
export const optionalAuth = async (req, res, next) => {
  try {
    if (req.session.tokens?.access_token) {
      const isAuthenticated = authService.isAuthenticated(req.session);
      
      if (isAuthenticated) {
        req.isAuthenticated = true;
        req.user = req.session.user;
        
        logger.debug('Optional auth - user authenticated', {
          userId: req.user?.id
        });
      } else {
        // Tokens exist but expired
        req.isAuthenticated = false;
        req.session.destroy(); // Clean up expired session
        
        logger.debug('Optional auth - session expired');
      }
    } else {
      req.isAuthenticated = false;
      
      logger.debug('Optional auth - no session tokens');
    }

    next();

  } catch (error) {
    logger.error('Optional auth middleware error', error);
    
    // Don't block request for optional auth, just mark as not authenticated
    req.isAuthenticated = false;
    next();
  }
};

/**
 * Role-based authorization middleware
 * Use after requireAuth
 */
export const requireRole = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.UNAUTHORIZED,
            code: 'USER_REQUIRED'
          }
        });
      }

      const userRole = req.user.role || 'user';
      
      if (!allowedRoles.includes(userRole)) {
        logger.warn('Insufficient permissions', {
          userId: req.user.id,
          userRole,
          requiredRoles: allowedRoles,
          attemptedAction: `${req.method} ${req.url}`
        });

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.FORBIDDEN,
            code: 'INSUFFICIENT_PERMISSIONS',
            requiredRoles: allowedRoles,
            userRole
          }
        });
      }

      logger.debug('Role authorization successful', {
        userId: req.user.id,
        role: userRole,
        allowedRoles
      });

      next();

    } catch (error) {
      logger.error('Role authorization middleware error', error);
      
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR,
          code: 'ROLE_MIDDLEWARE_ERROR'
        }
      });
    }
  };
};

/**
 * Admin-only middleware (convenience wrapper)
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Check if user owns the resource
 * Use for protecting user-specific resources
 */
export const requireOwnership = (resourceUserId) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            message: ERROR_MESSAGES.UNAUTHORIZED,
            code: 'AUTH_REQUIRED'
          }
        });
      }

      // Allow admin to access any resource
      if (req.user.role === 'admin') {
        return next();
      }

      // Check if user owns the resource
      if (req.user.id !== resourceUserId) {
        logger.warn('Ownership violation attempt', {
          userId: req.user.id,
          resourceUserId,
          attemptedAction: `${req.method} ${req.url}`
        });

        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          error: {
            message: 'You can only access your own resources',
            code: 'OWNERSHIP_VIOLATION'
          }
        });
      }

      next();

    } catch (error) {
      logger.error('Ownership middleware error', error);
      
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        error: {
          message: ERROR_MESSAGES.SERVER_ERROR,
          code: 'OWNERSHIP_MIDDLEWARE_ERROR'
        }
      });
    }
  };
};

export default {
  requireAuth,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireOwnership
};