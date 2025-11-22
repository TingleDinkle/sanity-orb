import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

console.log(`Attempting to connect to Redis at ${REDIS_URL}...`);

const redisClient = new Redis(REDIS_URL, {
  // Options to handle connection errors gracefully
  maxRetriesPerRequest: 2,
  connectTimeout: 10000,
  lazyConnect: true, // Connect on first command, not on creation
  showFriendlyErrorStack: true,
});

redisClient.on('connect', () => {
  console.log('✓ Redis: Connection successful.');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
  // In a real app, you might want to have a more robust reconnection strategy
  // or a way to handle the app state when Redis is down.
});

// Function to test the connection
export const testRedisConnection = async () => {
  try {
    await redisClient.ping();
    return true;
  } catch (error) {
    console.error('Redis PING failed:', error.message);
    return false;
  }
};

export default redisClient;
