import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from './response';

interface RateLimitConfig {
    uniqueTokenPerInterval: number;
    interval: number;
}

const LRU = require('lru-cache');

const rateLimit = (options: RateLimitConfig) => {
    const tokenCache = new LRU({
        max: options.uniqueTokenPerInterval || 500,
        ttl: options.interval || 60000,
    });

    return {
        check: (res: NextResponse, limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                const isRateLimited = currentUsage >= limit;
                res.headers.set('X-RateLimit-Limit', limit.toString());
                res.headers.set(
                    'X-RateLimit-Remaining',
                    isRateLimited ? '0' : (limit - currentUsage).toString()
                );

                return isRateLimited ? reject() : resolve();
            }),
    };
};

/**
 * Simple in-memory rate limiter for Next.js API rotes
 * Note: In a serverless environment (Vercel), this memory is not shared across lambda instances.
 * For production, use Vercel KV or Upstash Redis.
 */
class RateLimiter {
    private limiters: Map<string, any> = new Map();

    getLimiter(name: string, limit: number, windowMs: number) {
        if (!this.limiters.has(name)) {
            this.limiters.set(name, {
                timestamps: new Map<string, number[]>(),
                limit,
                windowMs
            });
        }
        return this.limiters.get(name);
    }

    async check(req: NextRequest, name: string, limit: number = 100, windowMs: number = 60000) {
        const ip = req.ip || '127.0.0.1';
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
