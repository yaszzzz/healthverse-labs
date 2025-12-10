import { healthService } from '../services/health.service.js';
import { ApiResponse, asyncHandler } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export const healthCheck = asyncHandler(async (req, res) => {
  const healthInfo = await healthService.getSystemHealth();
  
  logger.debug('Health check requested', {
    authenticated: req.isAuthenticated,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  ApiResponse.success(res, healthInfo, 'Health check completed');
});

export const detailedHealth = asyncHandler(async (req, res) => {
  // Optional: Add authentication for detailed health info
  if (!req.isAuthenticated) {
    return ApiResponse.success(res, 
      await healthService.getSystemHealth(), 
      'Basic health information'
    );
  }

  const detailedHealth = await healthService.getDetailedHealth();
  
  logger.debug('Detailed health check requested', {
    userId: req.user?.id,
    ip: req.ip
  });

  ApiResponse.success(res, detailedHealth, 'Detailed health information');
});

export const loadBalancerHealth = asyncHandler(async (req, res) => {
  const lbHealth = await healthService.getLoadBalancerHealth();
  
  // Set appropriate status code for load balancer
  const statusCode = lbHealth.status === 'OK' ? 200 : 503;
  
  res.status(statusCode).json(lbHealth);
});

export const readinessCheck = asyncHandler(async (req, res) => {
  // Check if application is ready to receive traffic
  const dbHealth = await healthService.checkDatabaseHealth();
  const isReady = dbHealth.status === 'healthy';
  
  const readinessInfo = {
    status: isReady ? 'ready' : 'not ready',
    timestamp: new Date().toISOString(),
    checks: {
      database: dbHealth.status
    }
  };

  const statusCode = isReady ? 200 : 503;
  
  res.status(statusCode).json(readinessInfo);
});

export const livenessCheck = asyncHandler(async (req, res) => {
  // Simple check if application is running
  const livenessInfo = {
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  };

  res.status(200).json(livenessInfo);
});