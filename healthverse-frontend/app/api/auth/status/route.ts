import { getSession, getOAuthTokens } from '@/lib/auth/session';
import { successResponse } from '@/lib/utils/response';

export async function GET() {
    const session = await getSession();
    const tokens = await getOAuthTokens();

    const isAuthenticated = !!session;

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
