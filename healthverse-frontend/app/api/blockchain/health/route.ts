import { blockchainService } from '@/lib/services/blockchain';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function GET() {
    try {
        const health = await blockchainService.getHealth();

        return successResponse(health, 'Blockchain health status');
    } catch (error) {
        logger.error('Blockchain health check failed', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Blockchain health check failed',
            500
        );
    }
}
