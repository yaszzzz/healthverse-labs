import { NextRequest, NextResponse } from 'next/server';
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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return validationError('Invalid email format');
        }

        // Validate password strength
        if (password.length < 6) {
            return validationError('Password must be at least 6 characters');
        }

        const user = await userService.createUser(email, password);

        // Create session for the new user
        await createSession(user.id, {
            email: user.email || undefined,
            role: user.role,
        });

        logger.info('User registered successfully', { userId: user.id });

        return successResponse(user, 'User registered successfully', 201);
    } catch (error) {
        logger.error('Registration failed', error);

        if (error instanceof Error && error.message.includes('already exists')) {
            return errorResponse(error.message, 400, 'USER_EXISTS');
        }

        return errorResponse(
            error instanceof Error ? error.message : 'Registration failed',
            500
        );
    }
}
