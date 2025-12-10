import crypto from 'crypto';
import { createOAuth2Client, scopes } from '../utils/oauthClient.js';
import { AuthenticationError, ValidationError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

class AuthService {
  constructor() {
    this.oauth2Client = createOAuth2Client();
  }

  /*
   * Start OAuth2 authentication flow
   */
  startAuthentication(session) {
    try {
      const state = crypto.randomBytes(32).toString('hex');
      const codeVerifier = crypto.randomBytes(64).toString('base64url');
      
      // Store in session
      session.oauthState = state;
      session.codeVerifier = codeVerifier;

      const authUrl = this.oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state,
        prompt: 'consent',
        include_granted_scopes: true
      });

      logger.info('OAuth2 authentication initiated', { state });

      return {
        success: true,
        authUrl,
        state
      };
    } catch (error) {
      logger.error('Failed to start authentication', error);
      throw new Error('Failed to initiate authentication');
    }
  }

  /**
   * Handle OAuth2 callback
   */
  async handleCallback(code, state, session) {
    try {
      // Validate state parameter
      if (state !== session.oauthState) {
        logger.warn('Invalid state parameter detected', { 
          expected: session.oauthState, 
          received: state 
        });
        throw new ValidationError('Invalid state parameter');
      }

      if (!code) {
        throw new ValidationError('Authorization code not provided');
      }

      // Exchange code for tokens
      const { tokens } = await this.oauth2Client.getToken(code);
      
      if (!tokens.access_token) {
        throw new AuthenticationError('No access token received from provider');
      }

      // Set credentials and verify token works
      this.oauth2Client.setCredentials(tokens);
      
      // Get user profile
      const userInfo = await this.getUserProfile(tokens.access_token);

      // Store tokens in session
      session.tokens = {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
        scope: tokens.scope,
        token_type: tokens.token_type
      };

      // Store user info in session
      if (userInfo) {
        session.user = {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture
        };
      }
      
      // Clear temporary session data
      session.oauthState = null;
      session.codeVerifier = null;

      logger.info('OAuth2 authentication successful', { 
        userId: userInfo?.id,
        email: userInfo?.email,
        scopes: tokens.scope 
      });

      return {
        success: true,
        message: '✅ Successfully connected to Google Fit!',
        user: session.user,
        scopes: tokens.scope
      };

    } catch (error) {
      logger.error('OAuth2 callback failed', error);
      
      // Clear session on error
      session.oauthState = null;
      session.codeVerifier = null;
      
      // Re-throw with proper error class
      if (error instanceof AuthenticationError || error instanceof ValidationError) {
        throw error;
      }
      
      throw new AuthenticationError(
        error.response?.data ? 
        `Authentication failed: ${JSON.stringify(error.response.data)}` : 
        `Authentication failed: ${error.message}`
      );
    }
  }

  /**
   * Get user profile from Google
   */
  async getUserProfile(accessToken) {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      logger.warn('Failed to fetch user profile, continuing without it', error);
      return null;
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(session) {
    const tokens = session.tokens;
    
    if (!tokens?.access_token) {
      return false;
    }

    // Check if token is expired
    if (tokens.expiry_date && Date.now() > tokens.expiry_date) {
      logger.info('Access token expired');
      return false;
    }

    return true;
  }

  /**
   * Logout user
   */
  logout(session) {
    const hadTokens = !!session.tokens;
    
    return new Promise((resolve, reject) => {
      // Clear session
      session.destroy((err) => {
        if (err) {
          logger.error('Failed to destroy session during logout', err);
          reject(new Error('Failed to logout'));
        } else {
          logger.info('User logged out', { hadTokens });
          resolve({
            success: true,
            message: 'Successfully logged out'
          });
        }
      });
    });
  }
}

export const authService = new AuthService();
export default authService;