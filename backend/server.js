import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const storage = {
  sessions: [],
  snapshots: [],
  
  addSession(data) {
    const session = {
      id: this.sessions.length + 1,
      user_id: data.userId || 'anonymous',
      sanity_level: data.sanityLevel,
      preferences: data.preferences,
      created_at: new Date().toISOString()
    };
    this.sessions.push(session);
    if (this.sessions.length > 1000) this.sessions = this.sessions.slice(-1000);
    return session;
  },
  
  addSnapshot(sanityLevel, timestamp) {
    this.snapshots.push({
      id: this.snapshots.length + 1,
      sanity_level: sanityLevel,
      timestamp: timestamp || new Date().toISOString()
    });
    if (this.snapshots.length > 100) this.snapshots = this.snapshots.slice(-100);
  },
  
  getRecentSessions(count = 100) {
    return this.sessions.slice(-count);
  },
  
  getUserSessions(userId, limit = 50) {
    return this.sessions
      .filter(s => s.user_id === userId)
      .slice(-limit)
      .reverse();
  },
  
  getRecentSnapshots(minutes = 5) {
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return this.snapshots.filter(s => new Date(s.timestamp) > cutoff);
  }
};

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    database: 'in-memory'
  });
});

app.post('/api/sessions', (req, res) => {
  try {
    const session = storage.addSession(req.body);
    res.json({ success: true, session });
  } catch (error) {
    console.error('Error saving session:', error);
    res.status(500).json({ error: 'Failed to save session' });
  }
});

app.get('/api/stats/global', (req, res) => {
  try {
    const recent = storage.getRecentSessions();
    
    if (recent.length === 0) {
      return res.json({
        success: true,
        stats: { average_sanity: 50, lowest_sanity: 0, highest_sanity: 100, total_sessions: 0, unique_users: 0 }
      });
    }
    
    const levels = recent.map(s => s.sanity_level);
    const uniqueUsers = new Set(recent.map(s => s.user_id)).size;
    
    res.json({ 
      success: true, 
      stats: {
        average_sanity: levels.reduce((a, b) => a + b, 0) / levels.length,
        lowest_sanity: Math.min(...levels),
        highest_sanity: Math.max(...levels),
        total_sessions: recent.length,
        unique_users: uniqueUsers
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

app.get('/api/sessions/:userId', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const sessions = storage.getUserSessions(req.params.userId, limit);
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

app.post('/api/snapshots', (req, res) => {
  try {
    storage.addSnapshot(req.body.sanityLevel, req.body.timestamp);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving snapshot:', error);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

app.get('/api/mood/current', (req, res) => {
  try {
    const recent = storage.getRecentSnapshots(5);
    
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
    res.status(500).json({ error: 'Failed to fetch mood' });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Sanity Orb Backend running on port ${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✓ Running in IN-MEMORY mode (no database required)`);
  console.log(`\n📊 Available endpoints:`);
  console.log(`   POST /api/sessions - Save user session`);
  console.log(`   GET  /api/sessions/:userId - Get user sessions`);
  console.log(`   GET  /api/stats/global - Get global statistics`);
  console.log(`   POST /api/snapshots - Save sanity snapshot`);
  console.log(`   GET  /api/mood/current - Get current mood`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});