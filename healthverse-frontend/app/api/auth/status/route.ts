import { getSession, getOAuthTokens } from '@/lib/auth/session';
import { successResponse } from '@/lib/utils/response';
import prisma from '@/lib/db';

export async function GET() {
    const session = await getSession();
    let tokens = await getOAuthTokens();

    const isAuthenticated = !!session;

    if (session && !tokens?.accessToken) {
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

    // Check if OAuth tokens are expired
    let isOAuthValid = false;
    if (tokens?.expiryDate) {
        isOAuthValid = Date.now() < tokens.expiryDate;
    } else if (tokens?.accessToken) {
        isOAuthValid = true;
    }

    return successResponse({
        authenticated: isAuthenticated,
        oauthConnected: isOAuthValid,
        user: session
            ? {
                userId: session.userId,
                email: session.email,
                role: session.role,
                walletAddress: session.walletAddress,
            }
            : null,
    });
}
