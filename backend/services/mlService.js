import fetch from 'node-fetch';
import { ML_API_URL, ERROR_MESSAGES } from '../constants/index.js';

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
    return { success: false, error: ERROR_MESSAGES.ML_UNAVAILABLE };
  }
}

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

export const mlService = {
  // Get AI predictions for user
  async getAdvancedPrediction(userId, currentSanity, storage) {
    try {
      // Sanitize userId
      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50) || 'anonymous';

      // Get user history
      const sessions = await storage.getUserSessions(sanitizedUserId, 20);

      if (sessions.length < 5) {
        return {
          success: false,
          error: 'Not enough session data for predictions (need at least 5 sessions)'
        };
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
      return prediction;

    } catch (error) {
      console.error('Error getting ML predictions:', error);
      return { success: false, error: ERROR_MESSAGES.ML_UNAVAILABLE };
    }
  },

  // Predict trend
  async getTrendPrediction(userId, storage) {
    try {
      // Sanitize userId
      const sanitizedUserId = userId.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 50) || 'anonymous';

      const sessions = await storage.getUserSessions(sanitizedUserId, 10);

      if (sessions.length < 5) {
        return {
          success: false,
          error: 'Need at least 5 sessions for trend prediction'
        };
      }

      const history = sessions.reverse().map(s => s.sanity_level);
      const prediction = await callMLAPI('/predict/trend', 'POST', { history });
      return prediction;

    } catch (error) {
      console.error('Error predicting trend:', error);
      return { success: false, error: 'Oops! Our crystal ball is foggy. Please try again!' };
    }
  },

  // Check ML API health
  async getHealth() {
    try {
      const health = await callMLAPI('/health');
      return health;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  }
};
