import { NextRequest, NextResponse } from 'next/server';
import { authService } from '@/lib/services/auth';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001';

    // Handle OAuth errors from provider
    if (error) {
        logger.warn('OAuth2 callback with error from provider', { error });
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent(error)}`);
    }

    if (!code || !state) {
        return NextResponse.redirect(`${appUrl}/login?error=${encodeURIComponent('Missing code or state')}`);
    }

    try {
        // Get stored state
        const storedState = await authService.getStoredState();

        // Handle callback
        await authService.handleCallback(code, state, storedState);

        // Clear state
        await authService.clearState();

        // Redirect to dashboard
        return NextResponse.redirect(`${appUrl}/dashboard`);
    } catch (err) {
        logger.error('Auth callback failed', err);
        await authService.clearState();

        return NextResponse.redirect(
            `${appUrl}/login?error=${encodeURIComponent('Authentication Failed')}`
        );
    }
}
