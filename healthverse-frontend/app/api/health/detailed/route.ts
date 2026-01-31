import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { healthService } from '@/lib/services/health';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
        return authResult;
    }

    try {
        logger.debug('Detailed health check requested', {
            userId: authResult.user.userId,
        });

        const detailedHealth = await healthService.getDetailedHealth();

        return successResponse(detailedHealth, 'Detailed health information');
    } catch (error) {
        logger.error('Detailed health check failed', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Health check failed',
            500
        );
    }
}
