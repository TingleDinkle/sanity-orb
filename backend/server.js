// server.js - Simple Express backend for Sanity Orb
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors());
app.use(express.json());

// ============================================
// ENDPOINTS
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Save user session
app.post('/api/sessions', async (req, res) => {
  try {
    const { sanityLevel, userId, preferences } = req.body;
    
    const result = await pool.query(
      `INSERT INTO sessions (user_id, sanity_level, preferences, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [userId || 'anonymous', sanityLevel, JSON.stringify(preferences)]
    );
    
    res.json({ success: true, session: result.rows[0] });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

// Get global sanity statistics
app.get('/api/stats/global', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        AVG(sanity_level) as average_sanity,
        MIN(sanity_level) as lowest_sanity,
        MAX(sanity_level) as highest_sanity,
        COUNT(*) as total_sessions,
        COUNT(DISTINCT user_id) as unique_users
      FROM sessions
      WHERE created_at > NOW() - INTERVAL '24 hours'
    `);
    
    res.json({ 
      success: true, 
      stats: result.rows[0],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get sanity history for a user
app.get('/api/sessions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    
    const result = await pool.query(
      `SELECT * FROM sessions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );
    
    res.json({ 
      success: true, 
      sessions: result.rows 
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Save sanity snapshot (for real-time mood tracking)
app.post('/api/snapshots', async (req, res) => {
  try {
    const { sanityLevel, timestamp } = req.body;
    
    await pool.query(
      `INSERT INTO sanity_snapshots (sanity_level, timestamp)
       VALUES ($1, $2)`,
      [sanityLevel, timestamp || new Date().toISOString()]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving snapshot:', error);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

// Get real-time internet mood (average of recent snapshots)
app.get('/api/mood/current', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        AVG(sanity_level) as current_mood,
        COUNT(*) as sample_size
      FROM sanity_snapshots
      WHERE timestamp > NOW() - INTERVAL '5 minutes'
    `);
    
    const mood = result.rows[0].current_mood || 50; // Default to neutral
    
    res.json({ 
      success: true, 
      currentMood: Math.round(mood),
      sampleSize: result.rows[0].sample_size,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching mood:', error);
    res.status(500).json({ error: 'Failed to fetch mood' });
  }
});

// ============================================
// DATABASE INITIALIZATION
// ============================================

const initDatabase = async () => {
  try {
    // Create sessions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        sanity_level INTEGER NOT NULL CHECK (sanity_level >= 0 AND sanity_level <= 100),
        preferences JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create sanity snapshots table for real-time tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sanity_snapshots (
        id SERIAL PRIMARY KEY,
        sanity_level INTEGER NOT NULL CHECK (sanity_level >= 0 AND sanity_level <= 100),
        timestamp TIMESTAMP DEFAULT NOW()
      )
    `);
    
    // Create index for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_snapshots_timestamp ON sanity_snapshots(timestamp DESC);
    `);
    
    console.log('✓ Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
};

// ============================================
// START SERVER
// ============================================

const startServer = async () => {
  try {
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(` Sanity Orb Backend running on port ${PORT}`);
      console.log(` Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connection...');
  await pool.end();
  process.exit(0);
});