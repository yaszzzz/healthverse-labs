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

        const balance = await blockchainService.getTokenBalance(walletAddress);

        return successResponse({ balance, symbol: 'HEALTH' }, 'Token balance retrieved');
    } catch (error) {
        logger.error('Failed to get token balance', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get token balance',
            500,
            'BLOCKCHAIN_READ_ERROR'
        );
    }
}
