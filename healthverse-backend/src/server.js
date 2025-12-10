import app from './app.js';
import { config } from './config/env.js';
import { logger } from './utils/logger.js';
import { verifyOAuthConfig } from './utils/oauthClient.js';

const PORT = config.port || 3000;

// Verify critical configurations on startup
try {
  verifyOAuthConfig();
  
  app.listen(PORT, () => {
    logger.info(`🚀 HealthVerse Server started successfully`, {
      port: PORT,
      environment: config.nodeEnv,
      nodeVersion: process.version,
      timestamp: new Date().toISOString()
    });
    
    logger.info(`📊 API endpoints available at: http://localhost:${PORT}`);
    logger.info(`🏥 Health checks at: http://localhost:${PORT}/health`);
  });

} catch (error) {
  logger.error('Failed to start server', error);
  process.exit(1);
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection', { reason, promise });
  process.exit(1);
});

export default app;