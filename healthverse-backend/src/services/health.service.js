import prismaService from './prisma.service.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

class HealthService {
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
        this.getSystemInfo()
      ]);

      const overallStatus = dbHealth.status === 'healthy' ? 'healthy' : 'unhealthy';

      const healthInfo = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        services: {
          database: dbHealth,
          api: { status: 'healthy' }
        },
        system: systemInfo,
        environment: process.env.NODE_ENV
      };

      logger.debug('System health check performed', {
        status: overallStatus,
        database: dbHealth.status
      });

      return healthInfo;

    } catch (error) {
      logger.error('System health check failed', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: { status: 'unhealthy', error: error.message },
          api: { status: 'unhealthy' }
        },
        environment: process.env.NODE_ENV
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
      await prismaService.getClient().$queryRaw`SELECT 1`;
      
      const responseTime = Date.now() - startTime;

      // Check database metrics if available
      const dbStatus = await prismaService.healthCheck();

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        ...dbStatus,
        checkedAt: new Date().toISOString()
      };

    } catch (error) {
      logger.error('Database health check failed', error);
      
      return {
        status: 'unhealthy',
        error: error.message,
        checkedAt: new Date().toISOString()
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
      arrayBuffers: Math.round(memory.arrayBuffers / 1024 / 1024)
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
      serverUptime: Math.floor((new Date() - this.startTime) / 1000),
      memory: this.getMemoryUsage(),
      cpu: {
        usage: process.cpuUsage(),
        architecture: process.arch
      }
    };
  }

  /**
   * Get detailed health information (for admin/internal use)
   */
  async getDetailedHealth() {
    try {
      const [systemHealth, dbMetrics, activeConnections] = await Promise.all([
        this.getSystemHealth(),
        this.getDatabaseMetrics(),
        this.getActiveConnections()
      ]);

      return {
        ...systemHealth,
        detailed: {
          database: dbMetrics,
          connections: activeConnections,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('Detailed health check failed', error);
      throw new AppError('Failed to get detailed health information', 500, 'HEALTH_CHECK_ERROR');
    }
  }

  /**
   * Get database metrics (if supported)
   */
  async getDatabaseMetrics() {
    try {
      // Example metrics - adjust based on your database
      const metrics = {
        // Add database-specific metrics here
        connected: true,
        checkedAt: new Date().toISOString()
      };

      return metrics;

    } catch (error) {
      logger.warn('Failed to get database metrics', error);
      return { error: 'Metrics unavailable', connected: false };
    }
  }

  /**
   * Get active connections info
   */
  async getActiveConnections() {
    // This would depend on your server setup
    // For Express, you might track active requests
    return {
      activeRequests: 0, // You can implement request tracking
      maxConnections: 0,
      checkedAt: new Date().toISOString()
    };
  }

  /**
   * Health check with dependencies (for load balancers)
   */
  async getLoadBalancerHealth() {
    try {
      const dbHealth = await this.checkDatabaseHealth();
      
      // Simple pass/fail for load balancers
      const isHealthy = dbHealth.status === 'healthy';
      
      return {
        status: isHealthy ? 'OK' : 'FAIL',
        timestamp: new Date().toISOString(),
        checks: {
          database: isHealthy ? 'OK' : 'FAIL'
        }
      };

    } catch (error) {
      return {
        status: 'FAIL',
        timestamp: new Date().toISOString(),
        checks: {
          database: 'FAIL'
        },
        error: error.message
      };
    }
  }
}

export const healthService = new HealthService();
export default healthService;