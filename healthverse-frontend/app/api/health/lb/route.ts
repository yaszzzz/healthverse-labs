import { NextResponse } from 'next/server';
import { healthService } from '@/lib/services/health';

export async function GET() {
    const lbHealth = await healthService.getLoadBalancerHealth();

    const statusCode = lbHealth.status === 'OK' ? 200 : 503;

    return NextResponse.json(lbHealth, { status: statusCode });
}
