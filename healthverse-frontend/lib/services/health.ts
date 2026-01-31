import prisma from '@/lib/db';
import { logger } from '@/lib/utils/logger';

export class HealthService {
    private startTime: Date;

    constructor() {
        this.startTime = new Date();
    }

    /**
     * Get system health status
     */
    async getSystemHealth() {
        try {
            const [dbHealth, memoryUsage, systemInfo] = await Promise.all([
                this.checkDatabaseHealth(),
                this.getMemoryUsage(),
                this.getSystemInfo(),
            ]);

            const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

            const healthInfo = {
                status: overallStatus,
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                services: {
                    database: dbHealth,
                    api: { status: 'healthy' },
                },
                system: systemInfo,
                environment: process.env.NODE_ENV,
            };

            logger.debug('System health check performed', {
                status: overallStatus,
                database: dbHealth.status,
            });

            return healthInfo;
        } catch (error) {
            logger.error('System health check failed', error);

            return {
                status: 'unhealthy',
                timestamp: new Date().toISOString(),
                services: {
                    database: { status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' },
                    api: { status: 'unhealthy' },
                },
                environment: process.env.NODE_ENV,
            };
        }
    }

    /**
     * Check database connection and health
     */
    async checkDatabaseHealth() {
        try {
            const startTime = Date.now();

            // Test database connection with a simple query
            await prisma.$queryRaw`SELECT 1`;

            const responseTime = Date.now() - startTime;

            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                checkedAt: new Date().toISOString(),
            };
        } catch (error) {
            logger.error('Database health check failed', error);

            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
                checkedAt: new Date().toISOString(),
            };
        }
    }

    /**
     * Get memory usage information
     */
    getMemoryUsage() {
        const memory = process.memoryUsage();

        return {
            used: Math.round(memory.heapUsed / 1024 / 1024),
            total: Math.round(memory.heapTotal / 1024 / 1024),
            rss: Math.round(memory.rss / 1024 / 1024),
            external: Math.round(memory.external / 1024 / 1024),
            arrayBuffers: Math.round(memory.arrayBuffers / 1024 / 1024),
        };
    }

    /**
     * Get system information
     */
    getSystemInfo() {
        return {
            nodeVersion: process.version,
            platform: process.platform,
            arch: process.arch,
            pid: process.pid,
            uptime: process.uptime(),
            serverUptime: Math.floor((new Date().getTime() - this.startTime.getTime()) / 1000),
            memory: this.getMemoryUsage(),
        };
    }

    /**
     * Get detailed health information (for admin/internal use)
     */
    async getDetailedHealth() {
        const systemHealth = await this.getSystemHealth();

        return {
            ...systemHealth,
            detailed: {
                database: await this.getDatabaseMetrics(),
                timestamp: new Date().toISOString(),
            },
        };
    }

    /**
     * Get database metrics
     */
    async getDatabaseMetrics() {
        try {
            return {
                connected: true,
                checkedAt: new Date().toISOString(),
            };
        } catch {
            logger.warn('Failed to get database metrics');
            return { error: 'Metrics unavailable', connected: false };
        }
    }

    /**
     * Health check for load balancers
     */
    async getLoadBalancerHealth() {
        try {
            const dbHealth = await this.checkDatabaseHealth();
            const isHealthy = dbHealth.status === 'healthy';

            return {
                status: isHealthy ? 'OK' : 'FAIL',
                timestamp: new Date().toISOString(),
                checks: {
                    database: isHealthy ? 'OK' : 'FAIL',
                },
            };
        } catch (error) {
            return {
                status: 'FAIL',
                timestamp: new Date().toISOString(),
                checks: {
                    database: 'FAIL',
                },
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}

export const healthService = new HealthService();
export default healthService;
