import { NextRequest } from 'next/server';
import { blockchainService } from '@/lib/services/blockchain';
import { successResponse, errorResponse, validationError } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');

    if (!walletAddress) {
        return validationError('Wallet address is required');
    }

    try {
        // Ensure blockchain service is initialized
        if (!blockchainService.isConnected()) {
            await blockchainService.initialize();
        }

        const progress = await blockchainService.getTodayProgress(walletAddress);

        return successResponse(progress, 'Today progress retrieved');
    } catch (error) {
        logger.error('Failed to get today progress', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get progress',
            500,
            'BLOCKCHAIN_READ_ERROR'
        );
    }
}
