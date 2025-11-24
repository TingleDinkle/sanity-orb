import express from 'express';
import dotenv from 'dotenv';
import DatabaseStorage from './services/databaseStorage.js';
import { PORT } from './constants/index.js';
import { testConnection } from './config/database.js';
import { testRedisConnection } from './config/redis.js';

// Import middleware
import {
  helmetConfig,
  corsConfig,
  speedLimiter,
  limiter,
  strictLimiter,
  requestFingerprinting
} from './middleware/security.js';
import {
  handleValidationErrors,
  sanitizeUserId,
  sessionValidation,
  snapshotValidation,
  sessionsListValidation,
  collectiveDataValidation,
  collectiveAverageValidation,
  mlAdvancedValidation,
  mlTrendValidation
} from './middleware/validation.js';

// Import services
import { mlService } from './services/mlService.js';

// Import mock data
import { mockCollectiveData, mockCollectiveAverage } from './data/mockData.js';

// Import routes
import healthRouter from './routes/health.js';

dotenv.config();

const app = express();

// Trust proxy for proper IP detection behind reverse proxy
app.set('trust proxy', 1);

// ============================================
// SECURITY CONFIGURATION
// ============================================

// Security headers
app.use(helmetConfig);

// CORS configuration
app.use(corsConfig);

// ============================================
// ENHANCED RATE LIMITING & REQUEST TRACKING
// ============================================

// Apply rate limiting and tracking
app.use('/api/', speedLimiter); // Progressive slowdown
app.use('/api/', limiter); // Hard limits
app.use('/api/', requestFingerprinting); // Behavioral analysis
app.use('/api/sessions', strictLimiter);
app.use('/api/snapshots', strictLimiter);
app.use('/api/ml/predict', strictLimiter);

app.use(express.json({ limit: '10mb' })); // Limit payload size

// ============================================
// INITIALIZE SERVICES
// ============================================

const storage = new DatabaseStorage();

// ============================================
// ROUTES
// ============================================

// Health routes
app.use('/api', healthRouter);

// Session endpoints
app.post('/api/sessions', sessionValidation, handleValidationErrors, async (req, res) => {
  try {
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

app.get('/api/sessions/:userId', sessionsListValidation, handleValidationErrors, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sessions = await storage.getUserSessions(req.params.userId, limit);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

// Global stats
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

// Snapshot endpoints
app.post('/api/snapshots', snapshotValidation, handleValidationErrors, async (req, res) => {
  try {
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

// Mood endpoint
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
// COLLECTIVE DATA ENDPOINTS
// ============================================

const collectiveDataHandler = [
  collectiveDataValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 1000;
      const hoursBack = parseInt(req.query.hours) || 24;

      const collectiveData = await storage.getCollectiveData(limit, hoursBack);
      res.json({
        success: true,
        data: collectiveData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching collective data:', error);
      res.json({
        success: true,
        data: mockCollectiveData,
        timestamp: new Date().toISOString()
      });
    }
  }
];

app.get('/api/collective/data', ...collectiveDataHandler);
app.get('/api/v2/data/sync', ...collectiveDataHandler);
app.get('/api/internal/metrics', ...collectiveDataHandler);

// Collective average
app.get('/api/collective/average', collectiveAverageValidation, handleValidationErrors, async (req, res) => {
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
    res.json({
      success: true,
      data: mockCollectiveAverage,
      timestamp: new Date().toISOString()
    });
  }
});

// ============================================
// ML ENDPOINTS
// ============================================

app.post('/api/ml/predict/advanced', mlAdvancedValidation, handleValidationErrors, async (req, res) => {
  const result = await mlService.getAdvancedPrediction(req.body.userId, req.body.currentSanity, storage);
  res.json(result);
});

app.post('/api/ml/predict/trend', mlTrendValidation, handleValidationErrors, async (req, res) => {
  const result = await mlService.getTrendPrediction(req.body.userId, storage);
  res.json(result);
});

app.get('/api/ml/health', async (req, res) => {
  const result = await mlService.getHealth();
  res.json(result);
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'API endpoint not found. Check the documentation for available endpoints!'
  });
});

// Global error handler
app.use((error, req, res) => {
  console.error('Unhandled error:', error);

  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      error: 'Access denied. This origin is not allowed.'
    });
  }

  res.status(500).json({
    success: false,
    error: 'Something unexpected happened! Our team has been notified.'
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`🌐 Sanity Orb Backend running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);

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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
