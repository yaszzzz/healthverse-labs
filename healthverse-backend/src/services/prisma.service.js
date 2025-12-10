import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';
import { config } from '../config/env.js';

class PrismaService {
  constructor() {
    // Singleton pattern
    if (PrismaService._instance) {
      return PrismaService._instance;
    }

    // Simple Prisma client without middleware for now
    this.prisma = new PrismaClient({
      log: config.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
      errorFormat: config.nodeEnv === 'development' ? 'pretty' : 'minimal'
    });

    // Handle graceful shutdown
    this.setupShutdownHooks();

    // Prevent multiple instances in development
    if (config.nodeEnv !== 'production') {
      global.prisma = this.prisma;
    }

    PrismaService._instance = this;
    
    logger.info('Prisma service initialized successfully', {
      environment: config.nodeEnv
    });
  }

  /**
   * Setup graceful shutdown hooks
   */
  setupShutdownHooks() {
    const shutdown = async () => {
      logger.info('Shutting down database connection...');
      await this.disconnect();
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('beforeExit', shutdown);
  }

  /**
   * Get Prisma client instance
   */
  getClient() {
    return this.prisma;
  }

  /**
   * Disconnect from database
   */
  async disconnect() {
    try {
      await this.prisma.$disconnect();
      logger.info('Database disconnected successfully');
    } catch (error) {
      logger.error('Failed to disconnect from database', error);
      throw error;
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck() {
    try {
      const startTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        database: 'connected',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Database health check failed', error);
      
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create and export singleton instance
export const prismaService = new PrismaService();
export default prismaService;