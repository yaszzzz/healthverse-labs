import { NextResponse } from 'next/server';
import { healthService } from '@/lib/services/health';

export async function GET() {
    const dbHealth = await healthService.checkDatabaseHealth();
    const isReady = dbHealth.status === 'healthy';

    const readinessInfo = {
        status: isReady ? 'ready' : 'not ready',
        timestamp: new Date().toISOString(),
        checks: {
            database: dbHealth.status,
        },
    };

    const statusCode = isReady ? 200 : 503;

    return NextResponse.json(readinessInfo, { status: statusCode });
}
