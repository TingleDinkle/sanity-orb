import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const ML_API_URL = process.env.ML_API_URL || 'http://localhost:5001/api';

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
app.post('/api/ml/predict/advanced', async (req, res) => {
  try {
    const { userId, currentSanity } = req.body;
    
    // Get user history
    const sessions = storage.getUserSessions(userId, 20);
    
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
      current_sanity: currentSanity,
      history: history,
      session_data: {
        hour: now.getHours(),
        day_of_week: now.getDay(),
        session_duration: 15.0,
        interactions: sessions.length,
        stress_level: currentSanity < 50 ? 100 - currentSanity : 50,
        mood_factor: currentSanity / 20
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
    res.status(500).json({ success: false, error: 'Failed to get predictions' });
  }
});

// Predict trend
app.post('/api/ml/predict/trend', async (req, res) => {
  try {
    const { userId } = req.body;
    const sessions = storage.getUserSessions(userId, 10);
    
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
    res.status(500).json({ success: false, error: 'Failed to predict trend' });
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
