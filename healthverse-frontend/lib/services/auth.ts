import crypto from 'crypto';
import { generateAuthUrl, getUserProfile, exchangeCodeForTokens } from '@/lib/utils/oauth-client';
import { createSession, storeOAuthTokens, storeOAuthState, getOAuthState, deleteOAuthState, deleteSession, deleteOAuthTokens } from '@/lib/auth/session';
import { userService } from './user';
import { logger } from '@/lib/utils/logger';
import prisma from '@/lib/db';

export class AuthService {
    /**
     * Start OAuth2 authentication flow
     */
    startAuthentication() {
        const state = crypto.randomBytes(32).toString('hex');
        const authUrl = generateAuthUrl(state);

        logger.info('OAuth2 authentication initiated', { state });

        return {
            success: true,
            authUrl,
            state,
        };
    }

    /**
     * Handle OAuth2 callback
     */
    async handleCallback(code: string, state: string, storedState: string | null) {
        // Validate state parameter
        if (state !== storedState) {
            logger.warn('Invalid state parameter detected', {
                expected: storedState,
                received: state,
            });
            throw new Error('Invalid state parameter');
        }

        if (!code) {
            throw new Error('Authorization code not provided');
        }

        // Exchange code for tokens
        const tokens = await exchangeCodeForTokens(code);

        if (!tokens.access_token) {
            throw new Error('No access token received from provider');
        }

        // Get user profile
        const userInfo = await getUserProfile(tokens.access_token);

        // Find or create user
        const user = await userService.findOrCreateOAuthUser({
            id: userInfo.id,
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
        });

        // Create session
        await createSession(user.id, {
            email: user.email || undefined,
            role: user.role,
            walletAddress: user.walletAddress || undefined,
        });

        // Store OAuth tokens
        await storeOAuthTokens({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token || undefined,
            expiryDate: tokens.expiry_date || undefined,
            scope: tokens.scope || undefined,
        });

        await prisma.oAuthToken.deleteMany({
            where: {
                userId: user.id,
                provider: 'google',
            },
        });

        await prisma.oAuthToken.create({
            data: {
                userId: user.id,
                provider: 'google',
                accessToken: tokens.access_token,
                refreshToken: tokens.refresh_token || '',
                expiryDate: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
            },
        });

        logger.info('OAuth2 authentication successful', {
            userId: user.id,
            email: user.email,
        });

        return {
            success: true,
            message: '✅ Successfully connected to Google Fit!',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        };
    }

    /**
     * Logout user
     */
    async logout() {
        await deleteSession();
        await deleteOAuthTokens();

        logger.info('User logged out');

        return {
            success: true,
            message: 'Successfully logged out',
        };
    }

    /**
     * Store OAuth state
     */
    async storeState(state: string) {
        await storeOAuthState(state);
    }

    /**
     * Get stored OAuth state
     */
    async getStoredState() {
        return getOAuthState();
    }

    /**
     * Clear OAuth state
     */
    async clearState() {
        await deleteOAuthState();
    }
}

export const authService = new AuthService();
export default authService;
