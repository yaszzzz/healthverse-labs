import { NextResponse } from 'next/server';

export async function GET() {
    const livenessInfo = {
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };

    return NextResponse.json(livenessInfo, { status: 200 });
}
