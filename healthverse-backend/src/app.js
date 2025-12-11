import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

// Config & Utilities
import { config, validateEnv, getConfig } from "./config/env.js";
import { generalLimiter } from "./config/ratelimit.js";
import { logger } from "./utils/logger.js";

// Routes
import authRoutes from "./routes/auth.routes.js";
import fitDataRoutes from "./routes/fitdata.routes.js";
import healthRoutes from "./routes/health.routes.js";
import blockchainRoutes from "./routes/blockchain.routes.js";

// Middleware
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

// Services
import blockchainService from "./services/blockchain.service.js";

// Initialize environment
validateEnv();

const app = express();

// ==================== SECURITY MIDDLEWARE ====================

// Helmet for security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
app.use(cors(getConfig().corsOptions));

// ==================== PERFORMANCE MIDDLEWARE ====================

// Compression for responses
app.use(compression());

// ==================== BODY PARSING MIDDLEWARE ====================

app.use(express.json({
  limit: '10mb', // Prevent large payload attacks
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  }
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

app.use(cookieParser());

// ==================== RATE LIMITING ====================

app.use(generalLimiter);

// ==================== SESSION CONFIGURATION ====================

const sessionConfig = {
  name: 'healthverse.sid', // Custom session cookie name
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: config.nodeEnv === 'production',
    httpOnly: true, // Prevent XSS attacks
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax', // CSRF protection
    ...(config.nodeEnv === 'production' && {
      domain: process.env.COOKIE_DOMAIN // Set in production
    })
  },
  store: // In production, use a proper session store like Redis
    config.nodeEnv === 'production'
      ? null // Add Redis store here for production
      : undefined // Use memory store for development
};

app.use(session(sessionConfig));

// ==================== REQUEST LOGGING MIDDLEWARE ====================

app.use((req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type')
  });

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;

    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length'),
      userAgent: req.get('User-Agent')
    });
  });

  next();
});

// ==================== HEALTH CHECK MIDDLEWARE ====================

// Early health check response (before all other middleware)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'HealthVerse API'
  });
});

// ==================== ROUTES REGISTRATION ====================

// API routes with versioning
app.use("/auth", authRoutes);
app.use("/fitdata", fitDataRoutes);
app.use("/health", healthRoutes);
app.use("/blockchain", blockchainRoutes);

// ==================== ROOT ENDPOINT ====================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "🏥 HealthVerse API Server",
    version: "1.0.0",
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: "/auth",
      fitdata: "/fitdata",
      health: "/health",
      blockchain: "/blockchain",
      documentation: "/docs" // You can add API docs later
    }
  });
});

// ==================== ERROR HANDLING ====================

// 404 Handler - must be after all routes
app.use(notFoundHandler);

// Global Error Handler - must be last
app.use(errorHandler);

// ==================== GRACEFUL SHUTDOWN ====================

const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}, starting graceful shutdown...`);

  // Give ongoing requests time to complete
  setTimeout(() => {
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ==================== EXPORT ====================

logger.info('Express application configured successfully', {
  environment: config.nodeEnv,
  nodeVersion: process.version
});

// Initialize blockchain service on startup
blockchainService.initialize().then((connected) => {
  if (connected) {
    logger.info('Blockchain service connected');
  } else {
    logger.warn('Blockchain service not connected - running in mock mode');
  }
});

export default app;