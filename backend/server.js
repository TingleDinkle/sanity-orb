import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { body, param, validationResult } from 'express-validator';
import DatabaseStorage from './services/databaseStorage.js';
import { testConnection } from './config/database.js';

dotenv.config();

const app = express();
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

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // stricter limit for POST operations
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting
app.use('/api/', limiter);
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

// Validate sanity level
const validateSanityLevel = (value) => {
  const num = Number(value);
  if (isNaN(num) || num < 0 || num > 100) {
    throw new Error('Sanity level must be a number between 0 and 100');
  }
  return num;
};

// Initialize database storage
const storage = new DatabaseStorage();

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const dbConnected = await testConnection();

    res.json({
      status: dbConnected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      database: dbConnected ? 'postgresql' : 'disconnected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: 'Database connection failed',
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
      const sessions = storage.getUserSessions(sanitizedUserId, 20);

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

      const sessions = storage.getUserSessions(sanitizedUserId, 10);

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

  // Test database connection on startup
  const dbConnected = await testConnection();
  if (dbConnected) {
    console.log(`✓ Database: PostgreSQL connected`);
  } else {
    console.log(`⚠️  Database: Connection failed - check DATABASE_URL in .env`);
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
