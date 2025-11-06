// src/services/api.ts
// API service for connecting to Sanity Orb backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const ML_API_BASE_URL = import.meta.env.VITE_ML_API_URL || 'http://localhost:5001/api';

interface SessionData {
  sanityLevel: number;
  userId?: string;
  preferences?: Record<string, any>;
}

interface GlobalStats {
  average_sanity: number;
  lowest_sanity: number;
  highest_sanity: number;
  total_sessions: number;
  unique_users: number;
}

interface CurrentMood {
  currentMood: number;
  sampleSize: number;
  timestamp: string;
}

class SanityOrbAPI {
  private baseURL: string;
  private userId: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    // Generate or retrieve user ID
    this.userId = this.getUserId();
  }

  private getUserId(): string {
    // Check if user ID exists in localStorage
    let userId = localStorage.getItem('sanity_orb_user_id');
    
    if (!userId) {
      // Generate new user ID
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('sanity_orb_user_id', userId);
    }
    
    return userId;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  async saveSession(sanityLevel: number, preferences?: Record<string, any>) {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify({
        sanityLevel,
        userId: this.userId,
        preferences,
      }),
    });
  }

  async getUserSessions(limit: number = 50) {
    return this.request(`/sessions/${this.userId}?limit=${limit}`, {
      method: 'GET',
    });
  }

  // ============================================
  // GLOBAL STATISTICS
  // ============================================

  async getGlobalStats(): Promise<{ success: boolean; stats: GlobalStats }> {
    return this.request('/stats/global', {
      method: 'GET',
    });
  }

  // ============================================
  // REAL-TIME MOOD TRACKING
  // ============================================

  async saveSnapshot(sanityLevel: number) {
    return this.request('/snapshots', {
      method: 'POST',
      body: JSON.stringify({
        sanityLevel,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  async getCurrentMood(): Promise<{ success: boolean } & CurrentMood> {
    return this.request('/mood/current', {
      method: 'GET',
    });
  }

  // ============================================
  // UTILITIES
  // ============================================

  async checkHealth() {
    try {
      const response = await this.request('/health', { method: 'GET' });
      return { healthy: true, data: response };
    } catch (error) {
      return { healthy: false, error };
    }
  }

  getUserIdForSharing(): string {
    return this.userId;
  }

  // ============================================
  // ML PREDICTIONS (via Backend)
  // ============================================

  async getMLPredictions(currentSanity: number) {
    return this.request('/ml/predict/advanced', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId,
        currentSanity
      }),
    });
  }

  async getMLTrend() {
    return this.request('/ml/predict/trend', {
      method: 'POST',
      body: JSON.stringify({
        userId: this.userId
      }),
    });
  }

  async checkMLHealth() {
    try {
      const response = await this.request('/ml/health', { method: 'GET' });
      return { healthy: true, data: response };
    } catch (error) {
      return { healthy: false, error };
    }
  }
}

// ============================================
// ML API (XGBoost Models)
// ============================================

interface MLPredictionResponse {
  success: boolean;
  prediction?: number;
  next_value?: number;
  confidence?: number;
  trend?: string;
  slope?: number;
  category?: string;
  error?: string;
}

interface MLAdvancedResponse {
  success: boolean;
  results?: {
    session_prediction?: number;
    trend_prediction?: {
      next_value: number;
      confidence: number;
      trend: string;
      slope: number;
    };
    classification?: {
      category: string;
      confidence: number;
    };
  };
  recommendations?: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
  error?: string;
}

class SanityOrbMLAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = ML_API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('ML API request failed:', error);
      return { success: false, error: String(error) } as T;
    }
  }

  async checkHealth() {
    try {
      const response = await this.request('/health', { method: 'GET' });
      return response;
    } catch (error) {
      return { healthy: false, error };
    }
  }

  async predictSession(data: {
    hour: number;
    day_of_week: number;
    session_duration: number;
    interactions: number;
    prev_sanity_1: number;
    prev_sanity_2: number;
    prev_sanity_3: number;
    stress_level: number;
    mood_factor: number;
  }): Promise<MLPredictionResponse> {
    return this.request('/predict/session', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async predictTrend(history: number[]): Promise<MLPredictionResponse> {
    return this.request('/predict/trend', {
      method: 'POST',
      body: JSON.stringify({ history }),
    });
  }

  async classifySanity(data: {
    current_sanity: number;
    session_count: number;
    avg_duration: number;
    interaction_rate: number;
    consistency: number;
  }): Promise<MLPredictionResponse> {
    return this.request('/predict/classify', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async advancedPrediction(data: {
    current_sanity: number;
    history: number[];
    session_data: {
      hour: number;
      day_of_week: number;
      session_duration: number;
      interactions: number;
      stress_level: number;
      mood_factor: number;
    };
    user_stats: {
      session_count: number;
      avg_duration: number;
      interaction_rate: number;
      consistency: number;
    };
  }): Promise<MLAdvancedResponse> {
    return this.request('/predict/advanced', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getModelsInfo() {
    return this.request('/models/info', { method: 'GET' });
  }
}

// Export singleton instances
export const api = new SanityOrbAPI();
export const mlAPI = new SanityOrbMLAPI();

// Hook for React components
export const useSanityAPI = () => {
  return {
    saveSession: api.saveSession.bind(api),
    getUserSessions: api.getUserSessions.bind(api),
    getGlobalStats: api.getGlobalStats.bind(api),
    saveSnapshot: api.saveSnapshot.bind(api),
    getCurrentMood: api.getCurrentMood.bind(api),
    checkHealth: api.checkHealth.bind(api),
    getUserId: api.getUserIdForSharing.bind(api),
  };
};

// Hook for ML API
export const useMLAPI = () => {
  return {
    checkHealth: mlAPI.checkHealth.bind(mlAPI),
    predictSession: mlAPI.predictSession.bind(mlAPI),
    predictTrend: mlAPI.predictTrend.bind(mlAPI),
    classifySanity: mlAPI.classifySanity.bind(mlAPI),
    advancedPrediction: mlAPI.advancedPrediction.bind(mlAPI),
    getModelsInfo: mlAPI.getModelsInfo.bind(mlAPI),
  };
};
