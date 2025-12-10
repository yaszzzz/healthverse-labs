// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_ERROR: 500
};

// Error Messages
export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_NOT_FOUND: 'User not found',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  INVALID_TOKEN: 'Invalid or expired token',
  
  // Health data errors
  HEALTH_DATA_NOT_FOUND: 'Health data not found',
  DUPLICATE_HEALTH_DATA: 'Health data already exists for this date',
  INVALID_HEALTH_METRIC: 'Invalid health metric value',
  
  // OAuth errors
  OAUTH_TOKEN_EXPIRED: 'OAuth token expired',
  OAUTH_PROVIDER_ERROR: 'OAuth provider error',
  
  // General errors
  SERVER_ERROR: 'Internal server error',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  VALIDATION_ERROR: 'Validation failed'
};

// User Roles based on YOUR schema
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// OAuth Providers
export const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  FITBIT: 'fitbit', 
  APPLE: 'apple'
};

// Health Metrics based on YOUR schema (HealthData model)
export const HEALTH_METRICS = {
  STEPS: 'steps',
  CALORIES: 'calories',
  BPM_AVG: 'bpmAvg',
  BPM_MIN: 'bpmMin', 
  BPM_MAX: 'bpmMax'
};

// Health Data Validation Ranges
export const HEALTH_RANGES = {
  STEPS: { MIN: 0, MAX: 100000 },
  CALORIES: { MIN: 0, MAX: 20000 },
  HEART_RATE: { MIN: 30, MAX: 220 }, // bpmMin, bpmAvg, bpmMax
  SLEEP: { MIN: 0, MAX: 24 } // in hours, if you add sleep later
};

// JWT Configuration
export const JWT_CONFIG = {
  expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  secret: process.env.JWT_SECRET
};

// OAuth Scopes for Health Apps
export const OAUTH_SCOPES = {
  GOOGLE_FIT: [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.heart_rate.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email'
  ]
};


// Rate Limit Config
export const RATE_LIMIT = {
  GENERAL: {
    WINDOW_MS: 15 * 60 * 1000,
    MAX: process.env.NODE_ENV === 'development' ? 1000 : 100
  },
  AUTH: {
    WINDOW_MS: 60 * 60 * 1000,
    MAX: 5
  },
  FIT_DATA: {
    WINDOW_MS: 1 * 60 * 1000,
    MAX: 10
  }
};


// Date Formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  DATABASE: 'YYYY-MM-DDTHH:mm:ss.SSSZ'
};
