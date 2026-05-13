import { NextRequest, NextResponse } from 'next/server';
import { getSession, getOAuthTokens } from './session';
import prisma from '@/lib/db';

export interface AuthenticatedRequest extends NextRequest {
    user?: {
        userId: string;
        email?: string;
        role?: string;
        walletAddress?: string;
    };
    tokens?: {
        accessToken: string;
        refreshToken?: string;
        expiryDate?: number;
    };
}

/**
 * Middleware to require authentication
 */
export async function requireAuth(
    request: NextRequest
): Promise<{ user: NonNullable<AuthenticatedRequest['user']>; tokens: AuthenticatedRequest['tokens'] } | NextResponse> {
    const session = await getSession();

    if (!session) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: 'Authentication required',
                    code: 'AUTH_REQUIRED',
                    redirectTo: '/api/auth/google',
                },
            },
            { status: 401 }
        );
    }

    let tokens = await getOAuthTokens();

    if (!tokens?.accessToken) {
        const storedTokens = await prisma.oAuthToken.findFirst({
            where: {
                userId: session.userId,
                provider: 'google',
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        if (storedTokens) {
            tokens = {
                accessToken: storedTokens.accessToken,
                refreshToken: storedTokens.refreshToken,
                expiryDate: storedTokens.expiryDate?.getTime(),
            };
        }
    }

    // Check if tokens are expired
    if (tokens?.expiryDate && Date.now() > tokens.expiryDate) {
        return NextResponse.json(
            {
                success: false,
                error: {
                    message: 'Session expired. Please login again.',
                    code: 'SESSION_EXPIRED',
                    redirectTo: '/api/auth/google',
                },
            },
            { status: 401 }
        );
    }

    return {
        user: {
            userId: session.userId,
            email: session.email,
            role: session.role,
            walletAddress: session.walletAddress,
        },
        tokens: tokens || undefined,
    };
}

/**
 * Middleware for optional authentication
 */
export async function optionalAuth(): Promise<{
    isAuthenticated: boolean;
    user?: AuthenticatedRequest['user'];
    tokens?: AuthenticatedRequest['tokens'];
}> {
    const session = await getSession();

    if (!session) {
        return { isAuthenticated: false };
    }

    let tokens = await getOAuthTokens();

    if (!tokens?.accessToken) {
        const storedTokens = await prisma.oAuthToken.findFirst({
            where: {
                userId: session.userId,
                provider: 'google',
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });

        if (storedTokens) {
            tokens = {
                accessToken: storedTokens.accessToken,
                refreshToken: storedTokens.refreshToken,
                expiryDate: storedTokens.expiryDate?.getTime(),
            };
        }
    }

    // Check if tokens are expired
    if (tokens?.expiryDate && Date.now() > tokens.expiryDate) {
        return { isAuthenticated: false };
    }

    return {
        isAuthenticated: true,
        user: {
            userId: session.userId,
            email: session.email,
            role: session.role,
            walletAddress: session.walletAddress,
        },
        tokens: tokens || undefined,
    };
}

/**
 * Check if user has required role
 */
export function requireRole(userRole: string | undefined, allowedRoles: string[]) {
    const role = userRole || 'user';
    return allowedRoles.includes(role);
}

/**
 * Unauthorized response helper
 */
export function unauthorizedResponse(message = 'Unauthorized') {
    return NextResponse.json(
        {
            success: false,
            error: { message, code: 'UNAUTHORIZED' },
        },
        { status: 401 }
    );
}

/**
 * Forbidden response helper
 */
export function forbiddenResponse(message = 'Forbidden') {
    return NextResponse.json(
        {
            success: false,
            error: { message, code: 'FORBIDDEN' },
        },
        { status: 403 }
    );
}
