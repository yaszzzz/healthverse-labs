import { authService } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';
import { ApiResponse, asyncHandler } from '../utils/response.js';
import { AuthenticationError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';
import { config } from '../config/env.js';

export const startAuth = asyncHandler(async (req, res) => {
  const result = authService.startAuthentication(req.session);

  logger.debug('Redirecting to OAuth2 provider', {
    state: result.state
  });

  res.redirect(result.authUrl);
});

export const authCallback = asyncHandler(async (req, res) => {
  const { code, state, error: oauthError } = req.query;

  // Handle OAuth errors from provider
  if (oauthError) {
    logger.warn('OAuth2 callback with error from provider', { oauthError });
    res.redirect(`http://localhost:3001/login?error=${encodeURIComponent(oauthError)}`);
    return;
  }

  try {
    const result = await authService.handleCallback(code, state, req.session);
    // Successful login -> Redirect to dashboard
    res.redirect('http://localhost:3001/dashboard');
  } catch (error) {
    logger.error('Auth callback failed', error);
    res.redirect(`http://localhost:3001/login?error=Authentication Failed`);
  }
});

export const checkAuthStatus = asyncHandler(async (req, res) => {
  const isAuthenticated = authService.isAuthenticated(req.session);

  // Also check for session user from password auth
  const isSessionAuth = !!req.session.user;

  ApiResponse.success(res, {
    authenticated: isAuthenticated || isSessionAuth,
    user: req.session.user || null
  });
});

export const logout = asyncHandler(async (req, res) => {
  const result = await authService.logout(req.session);
  ApiResponse.success(res, result, result.message);
});

export const register = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AuthenticationError('Email and password are required');
  }

  const user = await userService.createUser(email, password);

  ApiResponse.success(res, user, 'User registered successfully', 201);
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AuthenticationError('Email and password are required');
  }

  const user = await userService.validateUser(email, password);

  // Set session
  req.session.user = user;

  ApiResponse.success(res, user, 'Login successful');
});