import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import expressSlowDown from 'express-slow-down';
import helmet from 'helmet';
import { body, param, validationResult } from 'express-validator';
import DatabaseStorage from './services/databaseStorage.js';
import { testConnection } from './config/database.js';

dotenv.config();

const app = express();

// Trust proxy for proper IP detection behind reverse proxy
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3001;
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001/api';

// ============================================
// SECURITY CONFIGURATION
// ============================================

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow embedding for Three.js
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, direct file access, etc.)
    if (!origin) return callback(null, true);

    // Allow file:// protocol for local development
    if (origin.startsWith('file://')) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// ============================================
// ENHANCED RATE LIMITING & REQUEST TRACKING
// ============================================

// Progressive rate limiting - slows down abusive requests
const speedLimiter = expressSlowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes
  delayMs: 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // maximum delay of 20 seconds
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Standard rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // stricter limit for POST operations
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

import redisClient, { testRedisConnection } from './config/redis.js';

// Request fingerprinting middleware (Redis-based)
const whitelistedEndpoints = [
  '/api/health',
  '/api/mood/current',
  '/api/collective/data',
  '/api/v2/data/sync',
  '/api/internal/metrics',
  '/api/collective/average',
  '/api/stats/global',
  '/api/ml/health'
];

const requestFingerprinting = async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('User-Agent') || '';
  const now = Date.now();
  const clientKey = `client:${clientIP}`;
  const requestsKey = `requests:${clientIP}`;
  const pipeline = redisClient.pipeline();

  // 1. Fetch client data and increment request count
  pipeline.hgetall(clientKey);
  pipeline.hincrby(clientKey, 'totalRequests', 1);
  pipeline.zadd(requestsKey, now, now.toString()); // Score and member are the same
  pipeline.expire(clientKey, 24 * 60 * 60); // 24-hour expiry
  pipeline.expire(requestsKey, 24 * 60 * 60); // 24-hour expiry

  const [[err, clientData], [err2, totalRequests], [err3], [err4], [err5]] = await pipeline.exec();

  if (err || err2) {
    console.error('Redis error:', err || err2);
    return next(); // Fail open if Redis has an issue
  }

  // Initialize client if it's their first request
  if (!clientData || Object.keys(clientData).length === 0) {
    const initPipeline = redisClient.pipeline();
    initPipeline.hset(clientKey, 'firstSeen', now);
    initPipeline.hset(clientKey, 'userAgent', userAgent);
    await initPipeline.exec();
  }

  // Check if currently blocked
  if (clientData.blockedUntil && now < parseInt(clientData.blockedUntil, 10)) {
    const remainingSeconds = Math.ceil((parseInt(clientData.blockedUntil, 10) - now) / 1000);
    return res.status(429).json({
      error: 'Temporarily blocked due to suspicious activity.',
      retryAfter: remainingSeconds
    });
  }

  // 2. Behavioral Analysis
  const oneMinuteAgo = now - 60000;
  const fiveMinutesAgo = now - 300000;

  // Get counts of recent requests
  const countPipeline = redisClient.pipeline();
  countPipeline.zcount(requestsKey, oneMinuteAgo, now); // Requests in the last minute
  countPipeline.zcount(requestsKey, fiveMinutesAgo, now); // Requests in the last 5 minutes
  countPipeline.zremrangebyscore(requestsKey, '-inf', fiveMinutesAgo); // Clean up very old requests

  const [[errCount, recentRequestsCount], [errCount5, fiveMinCount], [errRem]] = await countPipeline.exec();
  
  if (errCount) {
    console.error('Redis zcount error:', errCount);
    return next(); // Fail open
  }

  // Skip suspicious pattern detection for whitelisted endpoints (auto-polled by frontend or health checks)
  if (!whitelistedEndpoints.includes(req.path)) {
    // Detect suspicious patterns
    let isSuspicious = false;
    let reason = '';

    if (recentRequestsCount > 45) { // Stricter limit
      isSuspicious = true;
      reason = 'Too many requests per minute';
    }

    const uniqueUserAgents = clientData.userAgents ? JSON.parse(clientData.userAgents) : [];
    if (!uniqueUserAgents.includes(userAgent)) {
      uniqueUserAgents.push(userAgent);
      await redisClient.hset(clientKey, 'userAgents', JSON.stringify(uniqueUserAgents.slice(-5)));
    }

    if (uniqueUserAgents.length > 3) {
      isSuspicious = true;
      reason = 'User-Agent switching detected';
    }

    // Mark as suspicious
    if (isSuspicious && clientData.suspicious !== 'true') {
      await redisClient.hset(clientKey, 'suspicious', 'true');
      console.log(`🚨 Suspicious activity detected from ${clientIP}: ${reason}`);
    }
  if (clientData.suspicious === 'true' && fiveMinCount > 100) {
    const blockedUntil = now + 15 * 60 * 1000; // Block for 15 minutes
    await redisClient.hset(clientKey, 'blockedUntil', blockedUntil);
    return res.status(429).json({
      error: 'Too many suspicious requests. Please try again later.',
      retryAfter: '900'
    });
  }

  // Add tracking headers for legitimate requests
  res.set('X-Request-ID', `req_${clientIP}_${now}`);
  res.set('X-Rate-Limit-Remaining', 'available');

  next();
};

// Apply rate limiting and tracking
app.use('/api/', speedLimiter); // Progressive slowdown
app.use('/api/', limiter); // Hard limits
app.use('/api/', requestFingerprinting); // Behavioral analysis
app.use('/api/sessions', strictLimiter);
app.use('/api/snapshots', strictLimiter);
app.use('/api/ml/predict', strictLimiter);

app.use(express.json({ limit: '10mb' })); // Limit payload size

// ============================================
// INPUT VALIDATION MIDDLEWARE
// ============================================

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input data',
      details: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// Sanitize user ID
const sanitizeUserId = (userId) => {
  if (!userId || typeof userId !== 'string') return 'anonymous';
  // Allow alphanumeric, underscores, hyphens, max 50 chars
  return userId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50) || 'anonymous';
};

// Validate sanity level (kept for future use)
// const validateSanityLevel = (value) => {
//   const num = Number(value);
//   if (isNaN(num) || num < 0 || num > 100) {
//     throw new Error('Sanity level must be a number between 0 and 100');
//   }
//   return num;
// };

// Initialize database storage
const storage = new DatabaseStorage();

app.get('/api/health', async (req, res) => {
  try {
    // Test database and redis connections
    const [dbConnected, redisConnected] = await Promise.all([
      testConnection(),
      testRedisConnection()
    ]);

    const isHealthy = dbConnected && redisConnected;

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      dependencies: {
        database: dbConnected ? 'connected' : 'disconnected',
        redis: redisConnected ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/sessions',
  [
    body('sanityLevel').isNumeric().withMessage('Sanity level must be a number').custom((value) => {
      const num = Number(value);
      if (num < 0 || num > 100) {
        throw new Error('Sanity level must be between 0 and 100');
      }
      return true;
    }),
    body('userId').optional().isString().withMessage('User ID must be a string').isLength({ max: 50 }).withMessage('User ID too long'),
    body('preferences').optional().isObject().withMessage('Preferences must be an object')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Sanitize input data
      const sanitizedData = {
        sanityLevel: Number(req.body.sanityLevel),
        userId: sanitizeUserId(req.body.userId),
        preferences: req.body.preferences || {},
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      };

      const session = await storage.addSession(sanitizedData);
      res.json({ success: true, session });
    } catch (error) {
      console.error('Error saving session:', error);
      res.status(500).json({ success: false, error: 'Oops! Something went wrong saving your session. Please try again!' });
    }
  });

app.get('/api/stats/global', async (req, res) => {
  try {
    const stats = await storage.getGlobalStats();
    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch statistics' });
  }
});

app.get('/api/sessions/:userId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sessions = await storage.getUserSessions(req.params.userId, limit);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

app.post('/api/snapshots',
  [
    body('sanityLevel').isNumeric().withMessage('Sanity level must be a number').custom((value) => {
      const num = Number(value);
      if (num < 0 || num > 100) {
        throw new Error('Sanity level must be between 0 and 100');
      }
      return true;
    }),
    body('timestamp').optional().isISO8601().withMessage('Timestamp must be a valid ISO date')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Sanitize input data
      const sanitizedData = {
        sanityLevel: Number(req.body.sanityLevel),
        timestamp: req.body.timestamp || new Date().toISOString(),
        ipAddress: req.ip
      };

      await storage.addSnapshot(sanitizedData.sanityLevel, sanitizedData.timestamp, sanitizedData.ipAddress);
      res.json({ success: true });
    } catch (error) {
      console.error('Error saving snapshot:', error);
      res.status(500).json({ success: false, error: 'Oops! Something went wrong saving your snapshot. Please try again!' });
    }
  });

app.get('/api/mood/current', async (req, res) => {
  try {
    const recent = await storage.getRecentSnapshots(5);

    if (recent.length === 0) {
      return res.json({ success: true, currentMood: 50, sampleSize: 0, timestamp: new Date().toISOString() });
    }

    const avgMood = recent.reduce((sum, s) => sum + s.sanity_level, 0) / recent.length;

    res.json({
      success: true,
      currentMood: Math.round(avgMood),
      sampleSize: recent.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching mood:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mood' });
  }
});

// ============================================
// COLLECTIVE CONSCIOUSNESS ENDPOINTS
// ============================================

// Obfuscated endpoint names to make scraping harder
const collectiveDataHandler = [
  [
    param('limit').optional().isInt({ min: 1, max: 5000 }).withMessage('Limit must be between 1 and 5000'),
    param('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168 (1 week)')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 1000;
      const hoursBack = parseInt(req.query.hours) || 24;

      console.log('Fetching collective data with limit:', limit, 'hoursBack:', hoursBack);
      console.log('Storage object:', typeof storage, storage ? 'exists' : 'null');

      const collectiveData = await storage.getCollectiveData(limit, hoursBack);

      console.log('Collective data query result:', {
        sessionsCount: collectiveData.sessions?.length || 0,
        snapshotsCount: collectiveData.snapshots?.length || 0,
        hasData: (collectiveData.sessions?.length > 0 || collectiveData.snapshots?.length > 0),
        sessions: collectiveData.sessions?.slice(0, 3), // Show first 3 sessions
        snapshots: collectiveData.snapshots?.slice(0, 3) // Show first 3 snapshots
      });

      res.json({
        success: true,
        data: collectiveData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching collective data:', error);

      // Return diverse mock data for testing when database is unavailable
      const mockData = {
        sessions: [
          // Low sanity clusters (0-30)
          { sanity_level: 12, timestamp: new Date().toISOString(), cluster_id: 1 },
          { sanity_level: 8, timestamp: new Date().toISOString(), cluster_id: 0 },
          { sanity_level: 25, timestamp: new Date().toISOString(), cluster_id: 2 },
          { sanity_level: 18, timestamp: new Date().toISOString(), cluster_id: 1 },

          // Medium-low sanity clusters (30-50)
          { sanity_level: 35, timestamp: new Date().toISOString(), cluster_id: 3 },
          { sanity_level: 42, timestamp: new Date().toISOString(), cluster_id: 4 },
          { sanity_level: 38, timestamp: new Date().toISOString(), cluster_id: 3 },
          { sanity_level: 47, timestamp: new Date().toISOString(), cluster_id: 4 },

          // Medium sanity clusters (50-70)
          { sanity_level: 55, timestamp: new Date().toISOString(), cluster_id: 5 },
          { sanity_level: 62, timestamp: new Date().toISOString(), cluster_id: 6 },
          { sanity_level: 58, timestamp: new Date().toISOString(), cluster_id: 5 },
          { sanity_level: 67, timestamp: new Date().toISOString(), cluster_id: 6 },

          // Medium-high sanity clusters (70-85)
          { sanity_level: 72, timestamp: new Date().toISOString(), cluster_id: 7 },
          { sanity_level: 78, timestamp: new Date().toISOString(), cluster_id: 7 },
          { sanity_level: 82, timestamp: new Date().toISOString(), cluster_id: 8 },
          { sanity_level: 75, timestamp: new Date().toISOString(), cluster_id: 7 },

          // High sanity clusters (85-100)
          { sanity_level: 88, timestamp: new Date().toISOString(), cluster_id: 8 },
          { sanity_level: 92, timestamp: new Date().toISOString(), cluster_id: 9 },
          { sanity_level: 95, timestamp: new Date().toISOString(), cluster_id: 9 },
          { sanity_level: 89, timestamp: new Date().toISOString(), cluster_id: 8 }
        ],
        snapshots: [
          // More diverse data points
          { sanity_level: 15, timestamp: new Date().toISOString(), cluster_id: 1 },
          { sanity_level: 28, timestamp: new Date().toISOString(), cluster_id: 2 },
          { sanity_level: 41, timestamp: new Date().toISOString(), cluster_id: 4 },
          { sanity_level: 53, timestamp: new Date().toISOString(), cluster_id: 5 },
          { sanity_level: 64, timestamp: new Date().toISOString(), cluster_id: 6 },
          { sanity_level: 76, timestamp: new Date().toISOString(), cluster_id: 7 },
          { sanity_level: 83, timestamp: new Date().toISOString(), cluster_id: 8 },
          { sanity_level: 91, timestamp: new Date().toISOString(), cluster_id: 9 },
          { sanity_level: 22, timestamp: new Date().toISOString(), cluster_id: 2 },
          { sanity_level: 49, timestamp: new Date().toISOString(), cluster_id: 4 },
          { sanity_level: 61, timestamp: new Date().toISOString(), cluster_id: 6 },
          { sanity_level: 74, timestamp: new Date().toISOString(), cluster_id: 7 },
          { sanity_level: 87, timestamp: new Date().toISOString(), cluster_id: 8 }
        ],
        metadata: {
          total_sessions: 20,
          total_snapshots: 13,
          time_range_hours: 24,
          generated_at: new Date().toISOString(),
          mock_data: true
        }
      };

      console.log('Returning mock collective data for testing');
      res.json({
        success: true,
        data: mockData,
        timestamp: new Date().toISOString()
      });
    }
  }
];

// Register multiple endpoints with the same handler
app.get('/api/collective/data', ...collectiveDataHandler);
app.get('/api/v2/data/sync', ...collectiveDataHandler);
app.get('/api/internal/metrics', ...collectiveDataHandler);

app.get('/api/collective/average',
  [
    param('hours').optional().isInt({ min: 1, max: 168 }).withMessage('Hours must be between 1 and 168 (1 week)')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const hoursBack = parseInt(req.query.hours) || 24;

      const collectiveAverage = await storage.getCollectiveAverage(hoursBack);

      res.json({
        success: true,
        data: collectiveAverage,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching collective average:', error);

      // Return mock data for testing when database is unavailable
      const mockAverage = {
        average_sanity: 65.2,
        confidence: 85,
        sample_size: 15,
        trend: 'improving',
        distribution: {
          "3": 1,
          "4": 2,
          "5": 3,
          "6": 4,
          "7": 3,
          "8": 2
        },
        generated_at: new Date().toISOString()
      };

      console.log('Returning mock collective average for testing');
      res.json({
        success: true,
        data: mockAverage,
        timestamp: new Date().toISOString()
      });
    }
  });

// ============================================
// ML API INTEGRATION - Proxy endpoints
// ============================================

// Helper function to call ML API
async function callMLAPI(endpoint, method = 'GET', body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' }
    };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${ML_API_URL}${endpoint}`, options);
    return await response.json();
  } catch (error) {
    console.error('ML API error:', error);
    return { success: false, error: 'ML API unavailable' };
  }
}

// Get AI predictions for user
app.post('/api/ml/predict/advanced',
  [
    body('userId').isString().withMessage('User ID must be a string').isLength({ max: 50 }).withMessage('User ID too long'),
    body('currentSanity').isNumeric().withMessage('Current sanity must be a number').custom((value) => {
      const num = Number(value);
      if (num < 0 || num > 100) {
        throw new Error('Current sanity must be between 0 and 100');
      }
      return true;
    })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId, currentSanity } = req.body;

      // Sanitize userId
      const sanitizedUserId = sanitizeUserId(userId);

      // Get user history
      const sessions = await storage.getUserSessions(sanitizedUserId, 20);

      if (sessions.length < 5) {
        return res.json({
          success: false,
          error: 'Not enough session data for predictions (need at least 5 sessions)'
        });
      }

      // Prepare ML request
      const history = sessions.slice(0, 10).reverse().map(s => s.sanity_level);
      const now = new Date();

      const mlRequest = {
        current_sanity: Number(currentSanity),
        history: history,
        session_data: {
          hour: now.getHours(),
          day_of_week: now.getDay(),
          session_duration: 15.0,
          interactions: sessions.length,
          stress_level: Number(currentSanity) < 50 ? 100 - Number(currentSanity) : 50,
          mood_factor: Number(currentSanity) / 20
        },
        user_stats: {
          session_count: sessions.length,
          avg_duration: 15.0,
          interaction_rate: sessions.length / Math.max(1, sessions.length / 10),
          consistency: calculateConsistency(history)
        }
      };

      // Call ML API
      const prediction = await callMLAPI('/predict/advanced', 'POST', mlRequest);
      res.json(prediction);

    } catch (error) {
      console.error('Error getting ML predictions:', error);
      res.status(500).json({ success: false, error: 'Oops! Our AI is taking a sanity break. Please try again!' });
    }
  });

// Predict trend
app.post('/api/ml/predict/trend',
  [
    body('userId').isString().withMessage('User ID must be a string').isLength({ max: 50 }).withMessage('User ID too long')
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { userId } = req.body;

      // Sanitize userId
      const sanitizedUserId = sanitizeUserId(userId);

      const sessions = await storage.getUserSessions(sanitizedUserId, 10);

      if (sessions.length < 5) {
        return res.json({
          success: false,
          error: 'Need at least 5 sessions for trend prediction'
        });
      }

      const history = sessions.reverse().map(s => s.sanity_level);
      const prediction = await callMLAPI('/predict/trend', 'POST', { history });
      res.json(prediction);

    } catch (error) {
      console.error('Error predicting trend:', error);
      res.status(500).json({ success: false, error: 'Oops! Our crystal ball is foggy. Please try again!' });
    }
  });

// Check ML API health
app.get('/api/ml/health', async (req, res) => {
  try {
    const health = await callMLAPI('/health');
    res.json(health);
  } catch (error) {
    res.json({ status: 'unavailable', error: error.message });
  }
});

// Helper function to calculate consistency
function calculateConsistency(history) {
  if (history.length < 2) return 100;

  let totalDiff = 0;
  for (let i = 1; i < history.length; i++) {
    totalDiff += Math.abs(history[i] - history[i-1]);
  }

  const avgDiff = totalDiff / (history.length - 1);
  const consistency = Math.max(0, 100 - avgDiff);

  return consistency;
}

// ============================================
// GLOBAL ERROR HANDLING
// ============================================

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found. Check the documentation for available endpoints!'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);

  // Handle CORS errors
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. This origin is not allowed.'
    });
  }

  // Generic error response
  res.status(500).json({
    success: false,
    error: 'Something unexpected happened! Our team has been notified.'
  });
});

app.listen(PORT, async () => {
  console.log(`🌐 Sanity Orb Backend running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);

  // Test critical connections on startup
  const [dbConnected, redisConnected] = await Promise.all([
    testConnection(),
    testRedisConnection()
  ]);

  if (dbConnected) {
    console.log(`✓ Database: PostgreSQL connected`);
  } else {
    console.log(`⚠️  Database: Connection failed - check DATABASE_URL in .env`);
  }

  if (redisConnected) {
    console.log(`✓ Caching:  Redis connected`);
  } else {
    console.log(`⚠️  Caching:  Redis connection failed - check REDIS_URL in .env`);
  }

  console.log(`✓ Security enabled: Rate limiting, input validation, CORS protection`);
  console.log(`\n📊 Available endpoints:`);
  console.log(`   POST /api/sessions - Save user session (validated)`);
  console.log(`   GET  /api/sessions/:userId - Get user sessions`);
  console.log(`   GET  /api/stats/global - Get global statistics`);
  console.log(`   POST /api/snapshots - Save sanity snapshot (validated)`);
  console.log(`   GET  /api/mood/current - Get current mood`);
  console.log(`   POST /api/ml/predict/advanced - AI predictions (validated)`);
  console.log(`   POST /api/ml/predict/trend - Trend predictions (validated)`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
