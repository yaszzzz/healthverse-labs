import { blockchainService } from '@/lib/services/blockchain';
import { successResponse, errorResponse } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function GET() {
    try {
        // Ensure blockchain service is initialized
        if (!blockchainService.isConnected()) {
            await blockchainService.initialize();
        }

        const goals = await blockchainService.getGoals();

        return successResponse(goals, 'Contract goals retrieved');
    } catch (error) {
        logger.error('Failed to get goals', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get goals',
            500,
            'BLOCKCHAIN_READ_ERROR'
        );
    }
}
