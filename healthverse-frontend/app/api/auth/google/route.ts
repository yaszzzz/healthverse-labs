import { NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth';
import { logger } from '@/lib/utils/logger';

export async function GET() {
    try {
        const result = authService.startAuthentication();

        // Store state in cookie for CSRF protection
        await authService.storeState(result.state);

        logger.debug('Redirecting to OAuth2 provider', { state: result.state });

        return NextResponse.redirect(result.authUrl);
    } catch (error) {
        logger.error('Failed to start OAuth', error);

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';
        return NextResponse.redirect(
            `${appUrl}/login?error=${encodeURIComponent('Failed to start authentication')}`
        );
    }
}
