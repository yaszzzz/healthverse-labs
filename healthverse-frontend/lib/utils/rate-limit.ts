import { NextRequest } from 'next/server';
import { errorResponse } from './response';

interface LimiterState {
    timestamps: Map<string, number[]>;
    limit: number;
    windowMs: number;
}

/**
 * Simple in-memory rate limiter for Next.js API rotes
 * Note: In a serverless environment (Vercel), this memory is not shared across lambda instances.
 * For production, use Vercel KV or Upstash Redis.
 */
class RateLimiter {
    private limiters: Map<string, LimiterState> = new Map();

    getLimiter(name: string, limit: number, windowMs: number): LimiterState {
        if (!this.limiters.has(name)) {
            this.limiters.set(name, {
                timestamps: new Map<string, number[]>(),
                limit,
                windowMs
            });
        }
        return this.limiters.get(name)!;
    }

    async check(req: NextRequest, name: string, limit: number = 100, windowMs: number = 60000) {
        const ip =
            req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
            req.headers.get('x-real-ip') ||
            '127.0.0.1';
        const now = Date.now();
        const limiter = this.getLimiter(name, limit, windowMs);

        // Clean old timestamps
        const timestamps = limiter.timestamps.get(ip) || [];
        const windowStart = now - windowMs;
        const activeTimestamps = timestamps.filter((ts: number) => ts > windowStart);

        if (activeTimestamps.length >= limit) {
            return errorResponse('Too many requests, please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
        }

        activeTimestamps.push(now);
        limiter.timestamps.set(ip, activeTimestamps);

        // Clean up memory occasionally (basic implementation)
        if (limiter.timestamps.size > 10000) {
            limiter.timestamps.clear();
        }

        return null; // No error = not limited
    }
}

export const rateLimiter = new RateLimiter();
export default rateLimiter;
