import { authService } from '@/lib/services/auth';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function POST() {
    try {
        const result = await authService.logout();

        logger.info('User logged out');

        return successResponse(result, result.message);
    } catch (error) {
        logger.error('Logout failed', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Logout failed',
            500
        );
    }
}
