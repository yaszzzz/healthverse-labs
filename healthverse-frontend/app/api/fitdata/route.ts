import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { fitDataService } from '@/lib/services/fitdata';
import { successResponse, errorResponse, validationError } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function GET(request: NextRequest) {
    // Check authentication
    const authResult = await requireAuth(request);
    if (authResult instanceof Response) {
        return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days') || '7';
    const summary = searchParams.get('summary') === 'true';

    // Validate days parameter
    const validatedDays = parseInt(days);
    if (isNaN(validatedDays) || validatedDays < 1 || validatedDays > 30) {
        return validationError('Days must be a number between 1 and 30');
    }

    try {
        const tokens = authResult.tokens;

        if (!tokens?.accessToken) {
            return errorResponse(
                'Google Fit not connected. Please authenticate with Google first.',
                401,
                'OAUTH_REQUIRED'
            );
        }

        logger.debug('Fetching fitness data', {
            userId: authResult.user.userId,
            days: validatedDays,
            summary,
        });

        let result;

        if (summary) {
            result = await fitDataService.getFitnessSummary(
                { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
                validatedDays
            );
        } else {
            result = await fitDataService.getFitnessData(
                { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken },
                validatedDays
            );
        }

        return successResponse(result, 'Fitness data fetched successfully');
    } catch (error) {
        logger.error('Failed to fetch fitness data', error);

        if (error instanceof Error && error.message.includes('expired')) {
            return errorResponse(error.message, 401, 'SESSION_EXPIRED');
        }

        return errorResponse(
            error instanceof Error ? error.message : 'Failed to fetch fitness data',
            500
        );
    }
}
