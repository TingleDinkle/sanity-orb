import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import expressSlowDown from 'express-slow-down';
import redisClient from '../config/redis.js';

export const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false // Allow embedding for Three.js
});

export const corsConfig = cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, direct file access, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// Progressive rate limiting - slows down abusive requests
export const speedLimiter = expressSlowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes
  delayMs: 500, // add 500ms delay per request after delayAfter
  maxDelayMs: 20000, // maximum delay of 20 seconds
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
});

// Standard rate limiting
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // stricter limit for POST operations
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Request fingerprinting middleware (Redis-based)
export const whitelistedEndpoints = [
  '/api/health',
  '/api/mood/current',
  '/api/collective/data',
  '/api/v2/data/sync',
  '/api/internal/metrics',
  '/api/collective/average',
  '/api/stats/global',
  '/api/ml/health'
];

export const requestFingerprinting = async (req, res, next) => {
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
  }

  // Add tracking headers for legitimate requests
  res.set('X-Request-ID', `req_${clientIP}_${now}`);
  res.set('X-Rate-Limit-Remaining', 'available');

  next();
};
