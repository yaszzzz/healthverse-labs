import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { blockchainService } from '@/lib/services/blockchain';
import { successResponse, errorResponse, validationError } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
        return authResult;
    }

    try {
        const body = await request.json();
        const { walletAddress, steps, calories, heartRate } = body;

        // Validate required fields
        if (!walletAddress || steps === undefined || calories === undefined || heartRate === undefined) {
            return validationError('walletAddress, steps, calories, and heartRate are required');
        }

        // Validate data ranges (matching contract validation)
        if (heartRate < 40 || heartRate > 220) {
            return validationError('Heart rate must be between 40 and 220');
        }
        if (steps > 50000) {
            return validationError('Steps cannot exceed 50000');
        }
        if (calories > 20000) {
            return validationError('Calories cannot exceed 20000');
        }

        // Ensure blockchain service is initialized
        if (!blockchainService.isConnected()) {
            await blockchainService.initialize();
        }

        const signedData = await blockchainService.signHealthData(
            walletAddress,
            parseInt(steps),
            parseInt(calories),
            parseInt(heartRate)
        );

        logger.info('Health data signed', { walletAddress, steps, calories, heartRate });

        return successResponse(signedData, 'Health data signed successfully');
    } catch (error) {
        logger.error('Failed to sign health data', error);

        return errorResponse(
            error instanceof Error ? error.message : 'Failed to sign health data',
            500,
            'SIGNING_ERROR'
        );
    }
}
