import { NextRequest } from 'next/server';
import { optionalAuth } from '@/lib/auth/middleware';
import { healthService } from '@/lib/services/health';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
    try {
        const auth = await optionalAuth();

        logger.debug('Health check requested', {
            authenticated: auth.isAuthenticated,
        });

        const healthInfo = await healthService.getSystemHealth();

        return successResponse(healthInfo, 'Health check completed');
    } catch (error) {
        logger.error('Health check failed', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Health check failed',
            500
        );
    }
}
