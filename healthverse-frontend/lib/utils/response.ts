import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    message?: string;
    error?: {
        message: string;
        code?: string;
        details?: unknown;
    };
}

/**
 * Success response helper
 */
export function successResponse<T>(
    data: T,
    message?: string,
    status = 200
): NextResponse<ApiResponse<T>> {
    return NextResponse.json(
        {
            success: true,
            data,
            message,
        },
        { status }
    );
}

/**
 * Error response helper
 */
export function errorResponse(
    message: string,
    status = 500,
    code?: string,
    details?: unknown
): NextResponse<ApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error: {
                message,
                code,
                details,
            },
        },
        { status }
    );
}

/**
 * Validation error response
 */
export function validationError(
    message: string,
    details?: unknown
): NextResponse<ApiResponse> {
    return errorResponse(message, 400, 'VALIDATION_ERROR', details);
}

/**
 * Not found response
 */
export function notFoundResponse(message = 'Resource not found'): NextResponse<ApiResponse> {
    return errorResponse(message, 404, 'NOT_FOUND');
}

/**
 * Internal server error response
 */
export function serverError(message = 'Internal server error'): NextResponse<ApiResponse> {
    return errorResponse(message, 500, 'INTERNAL_ERROR');
}
