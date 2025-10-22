// src/services/api.ts
// API service for connecting to Sanity Orb backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
}

// Export singleton instance
export const api = new SanityOrbAPI();

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