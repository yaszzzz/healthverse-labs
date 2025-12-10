import { google } from "googleapis";
import { config } from "../config/env.js";
import { logger } from "./logger.js";
import { OAUTH_SCOPES } from "./constants.js";

/**
 * Create OAuth2 client with enhanced configuration
 */
export function createOAuth2Client(credentials = null) {
  try {
    // Validate required configuration
    if (!config.clientId || !config.clientSecret || !config.redirectUri) {
      throw new Error('Missing OAuth2 configuration. Check CLIENT_ID, CLIENT_SECRET, and REDIRECT_URI environment variables.');
    }

    const oauth2Client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    // Set credentials if provided
    if (credentials) {
      oauth2Client.setCredentials(credentials);
      
      logger.debug('OAuth2 client initialized with credentials', {
        hasAccessToken: !!credentials.access_token,
        hasRefreshToken: !!credentials.refresh_token
      });
    } else {
      logger.debug('OAuth2 client initialized without credentials');
    }

    return oauth2Client;

  } catch (error) {
    logger.error('Failed to create OAuth2 client', error);
    throw error;
  }
}

/**
 * Enhanced OAuth2 scopes for comprehensive health data access
 */
export const scopes = OAUTH_SCOPES.GOOGLE_FIT;

/**
 * Verify OAuth2 configuration on startup
 */
export function verifyOAuthConfig() {
  const missing = [];
  
  if (!config.clientId) missing.push('CLIENT_ID');
  if (!config.clientSecret) missing.push('CLIENT_SECRET');
  if (!config.redirectUri) missing.push('REDIRECT_URI');

  if (missing.length > 0) {
    logger.warn('OAuth2 configuration incomplete. Missing:', missing);
    return false;
  }

  logger.info('OAuth2 configuration verified successfully');
  return true;
}

/**
 * Refresh access token if expired
 */
export async function refreshAccessToken(oauth2Client) {
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);
    
    logger.info('OAuth2 access token refreshed successfully');
    
    return credentials;
  } catch (error) {
    logger.error('Failed to refresh OAuth2 access token', error);
    throw new Error('Token refresh failed. Re-authentication required.');
  }
}

/**
 * Check if token is expired or about to expire
 */
export function isTokenExpired(oauth2Client) {
  const credentials = oauth2Client.credentials;
  
  if (!credentials.expiry_date) {
    return false; // Can't determine without expiry date
  }

  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  const isExpired = Date.now() > (credentials.expiry_date - bufferTime);
  
  if (isExpired) {
    logger.debug('OAuth2 token expired or about to expire', {
      expiryDate: new Date(credentials.expiry_date).toISOString()
    });
  }

  return isExpired;
}

/**
 * Revoke OAuth2 tokens
 */
export async function revokeToken(oauth2Client) {
  try {
    await oauth2Client.revokeCredentials();
    logger.info('OAuth2 tokens revoked successfully');
    return true;
  } catch (error) {
    logger.error('Failed to revoke OAuth2 tokens', error);
    return false;
  }
}

/**
 * Get user profile from Google
 */
export async function getGoogleProfile(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Google API error: ${response.status} ${response.statusText}`);
    }

    const profile = await response.json();
    
    logger.debug('Google profile fetched successfully', {
      userId: profile.id,
      email: profile.email
    });

    return profile;
  } catch (error) {
    logger.error('Failed to fetch Google profile', error);
    throw error;
  }
}

export default {
  createOAuth2Client,
  scopes,
  verifyOAuthConfig,
  refreshAccessToken,
  isTokenExpired,
  revokeToken,
  getGoogleProfile
};