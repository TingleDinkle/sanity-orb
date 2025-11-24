import express from 'express';
import { testConnection } from '../config/database.js';
import { testRedisConnection } from '../config/redis.js';

const router = express.Router();

// Health check endpoint
router.get('/health', async (req, res) => {
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

export default router;
