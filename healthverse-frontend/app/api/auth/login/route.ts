import { NextRequest } from 'next/server';
import { userService } from '@/lib/services/user';
import { createSession } from '@/lib/auth/session';
import { successResponse, errorResponse, validationError } from '@/lib/utils/response';
import { logger } from '@/lib/utils/logger';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return validationError('Email and password are required');
        }

        const user = await userService.validateUser(email, password);

        // Create session
        await createSession(user.id, {
            email: user.email || undefined,
            role: user.role,
            walletAddress: user.walletAddress || undefined,
        });

        logger.info('User logged in successfully', { userId: user.id });

        return successResponse(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                walletAddress: user.walletAddress,
            },
            'Login successful'
        );
    } catch (error) {
        logger.error('Login failed', error);

        if (error instanceof Error && error.message.includes('Invalid')) {
            return errorResponse(error.message, 401, 'INVALID_CREDENTIALS');
        }

        return errorResponse(
            error instanceof Error ? error.message : 'Login failed',
            500
        );
    }
}
