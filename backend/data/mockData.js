// Mock data for testing when database is unavailable

export const mockCollectiveData = {
  sessions: [
    // Low sanity clusters (0-30)
    { sanity_level: 12, timestamp: new Date().toISOString(), cluster_id: 1 },
    { sanity_level: 8, timestamp: new Date().toISOString(), cluster_id: 0 },
    { sanity_level: 25, timestamp: new Date().toISOString(), cluster_id: 2 },
    { sanity_level: 18, timestamp: new Date().toISOString(), cluster_id: 1 },

    // Medium-low sanity clusters (30-50)
    { sanity_level: 35, timestamp: new Date().toISOString(), cluster_id: 3 },
    { sanity_level: 42, timestamp: new Date().toISOString(), cluster_id: 4 },
    { sanity_level: 38, timestamp: new Date().toISOString(), cluster_id: 3 },
    { sanity_level: 47, timestamp: new Date().toISOString(), cluster_id: 4 },

    // Medium sanity clusters (50-70)
    { sanity_level: 55, timestamp: new Date().toISOString(), cluster_id: 5 },
    { sanity_level: 62, timestamp: new Date().toISOString(), cluster_id: 6 },
    { sanity_level: 58, timestamp: new Date().toISOString(), cluster_id: 5 },
    { sanity_level: 67, timestamp: new Date().toISOString(), cluster_id: 6 },

    // Medium-high sanity clusters (70-85)
    { sanity_level: 72, timestamp: new Date().toISOString(), cluster_id: 7 },
    { sanity_level: 78, timestamp: new Date().toISOString(), cluster_id: 7 },
    { sanity_level: 82, timestamp: new Date().toISOString(), cluster_id: 8 },
    { sanity_level: 75, timestamp: new Date().toISOString(), cluster_id: 7 },

    // High sanity clusters (85-100)
    { sanity_level: 88, timestamp: new Date().toISOString(), cluster_id: 8 },
    { sanity_level: 92, timestamp: new Date().toISOString(), cluster_id: 9 },
    { sanity_level: 95, timestamp: new Date().toISOString(), cluster_id: 9 },
    { sanity_level: 89, timestamp: new Date().toISOString(), cluster_id: 8 }
  ],
  snapshots: [
    // More diverse data points
    { sanity_level: 15, timestamp: new Date().toISOString(), cluster_id: 1 },
    { sanity_level: 28, timestamp: new Date().toISOString(), cluster_id: 2 },
    { sanity_level: 41, timestamp: new Date().toISOString(), cluster_id: 4 },
    { sanity_level: 53, timestamp: new Date().toISOString(), cluster_id: 5 },
    { sanity_level: 64, timestamp: new Date().toISOString(), cluster_id: 6 },
    { sanity_level: 76, timestamp: new Date().toISOString(), cluster_id: 7 },
    { sanity_level: 83, timestamp: new Date().toISOString(), cluster_id: 8 },
    { sanity_level: 91, timestamp: new Date().toISOString(), cluster_id: 9 },
    { sanity_level: 22, timestamp: new Date().toISOString(), cluster_id: 2 },
    { sanity_level: 49, timestamp: new Date().toISOString(), cluster_id: 4 },
    { sanity_level: 61, timestamp: new Date().toISOString(), cluster_id: 6 },
    { sanity_level: 74, timestamp: new Date().toISOString(), cluster_id: 7 },
    { sanity_level: 87, timestamp: new Date().toISOString(), cluster_id: 8 }
  ],
  metadata: {
    total_sessions: 20,
    total_snapshots: 13,
    time_range_hours: 24,
    generated_at: new Date().toISOString(),
    mock_data: true
  }
};

export const mockCollectiveAverage = {
  average_sanity: 65.2,
  confidence: 85,
  sample_size: 15,
  trend: 'improving',
  distribution: {
    "3": 1,
    "4": 2,
    "5": 3,
    "6": 4,
    "7": 3,
    "8": 2
  },
  generated_at: new Date().toISOString()
};
