import { NextRequest } from 'next/server';
import { blockchainService } from '@/lib/services/blockchain';
import { successResponse, errorResponse, validationError } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get('walletAddress');
    const date = searchParams.get('date');

    if (!walletAddress || !date) {
        return validationError('Wallet address and date are required');
    }

    try {
        // Ensure blockchain service is initialized
        if (!blockchainService.isConnected()) {
            await blockchainService.initialize();
        }

        const dailyData = await blockchainService.getDailyData(walletAddress, parseInt(date));

        return successResponse(dailyData, 'Daily data retrieved');
    } catch (error) {
        logger.error('Failed to get daily data', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Failed to get daily data',
            500,
            'BLOCKCHAIN_READ_ERROR'
        );
    }
}
