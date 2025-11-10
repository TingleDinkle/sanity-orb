import { Session, Snapshot, UserAnalytics, sequelize } from '../models/index.js';
import { Op } from 'sequelize';

class DatabaseStorage {
  // Sessions
  async addSession(data) {
    try {
      const session = await Session.create({
        userId: data.userId || 'anonymous',
        sanityLevel: data.sanityLevel,
        preferences: data.preferences || {},
        ipAddress: data.ipAddress,
        userAgent: data.userAgent
      });

      // Update user analytics asynchronously (don't wait)
      this.updateUserAnalytics(data.userId || 'anonymous').catch(err =>
        console.error('Analytics update failed:', err)
      );

      return {
        id: session.id,
        user_id: session.userId,
        sanity_level: session.sanityLevel,
        preferences: session.preferences,
        created_at: session.created_at
      };
    } catch (error) {
      console.error('Error saving session:', error);
      throw error;
    }
  }

  async getUserSessions(userId, limit = 50) {
    try {
      const sessions = await Session.findAll({
        where: { userId },
        order: [['created_at', 'DESC']],
        limit,
        attributes: ['id', 'user_id', 'sanity_level', 'preferences', 'created_at']
      });

      return sessions.map(s => s.toJSON()).reverse();
    } catch (error) {
      console.error('Error fetching user sessions:', error);
      throw error;
    }
  }

  async getRecentSessions(count = 100) {
    try {
      const sessions = await Session.findAll({
        order: [['created_at', 'DESC']],
        limit: count,
        attributes: ['id', 'user_id', 'sanity_level', 'preferences', 'created_at']
      });

      return sessions.map(s => s.toJSON());
    } catch (error) {
      console.error('Error fetching recent sessions:', error);
      throw error;
    }
  }

  // Snapshots
  async addSnapshot(sanityLevel, timestamp, ipAddress) {
    try {
      const snapshot = await Snapshot.create({
        sanityLevel,
        timestamp: timestamp || new Date(),
        ipAddress
      });

      return snapshot.id;
    } catch (error) {
      console.error('Error saving snapshot:', error);
      throw error;
    }
  }

  async getRecentSnapshots(minutes = 5) {
    try {
      const cutoff = new Date(Date.now() - minutes * 60 * 1000);

      const snapshots = await Snapshot.findAll({
        where: {
          timestamp: {
            [Op.gte]: cutoff
          }
        },
        order: [['timestamp', 'DESC']],
        attributes: ['id', 'sanity_level', 'timestamp']
      });

      return snapshots.map(s => ({
        id: s.id,
        sanity_level: s.sanity_level,
        timestamp: s.timestamp
      }));
    } catch (error) {
      console.error('Error fetching recent snapshots:', error);
      throw error;
    }
  }

  // User Analytics
  async updateUserAnalytics(userId) {
    try {
      const [analytics] = await UserAnalytics.findOrCreate({
        where: { userId },
        defaults: { userId, sessionCount: 0 }
      });

      // Update session count and average sanity
      const userSessions = await Session.findAll({
        where: { userId },
        attributes: ['sanity_level']
      });

      const sessionCount = userSessions.length;
      const avgSanityLevel = sessionCount > 0
        ? userSessions.reduce((sum, s) => sum + s.sanity_level, 0) / sessionCount
        : 0;

      await analytics.update({
        sessionCount,
        avgSanityLevel: Math.round(avgSanityLevel * 100) / 100,
        lastActive: new Date()
      });
    } catch (error) {
      console.error('Error updating user analytics:', error);
      // Don't throw - analytics failure shouldn't break main functionality
    }
  }

  // Statistics
  async getGlobalStats() {
    try {
      const totalSessions = await Session.count();
      const uniqueUsers = await Session.count({
        distinct: true,
        col: 'user_id'
      });

      if (totalSessions === 0) {
        return {
          average_sanity: 50,
          lowest_sanity: 0,
          highest_sanity: 100,
          total_sessions: 0,
          unique_users: 0
        };
      }

      const sanityStats = await Session.findAll({
        attributes: [
          [sequelize.fn('AVG', sequelize.col('sanity_level')), 'avg'],
          [sequelize.fn('MIN', sequelize.col('sanity_level')), 'min'],
          [sequelize.fn('MAX', sequelize.col('sanity_level')), 'max']
        ]
      });

      return {
        average_sanity: Math.round(sanityStats[0].dataValues.avg * 100) / 100,
        lowest_sanity: sanityStats[0].dataValues.min,
        highest_sanity: sanityStats[0].dataValues.max,
        total_sessions: totalSessions,
        unique_users: uniqueUsers
      };
    } catch (error) {
      console.error('Error fetching global stats:', error);
      throw error;
    }
  }

  // Collective Consciousness Data
  async getCollectiveData(limit = 1000, hoursBack = 24) {
    console.log('DatabaseStorage.getCollectiveData called with limit:', limit, 'hoursBack:', hoursBack);
    try {
      // For testing, if hoursBack is very large, get ALL data instead of time-limited
      let sessionWhere = {};
      let snapshotWhere = {};

      if (hoursBack < 1000) { // Normal time-limited query
        const cutoff = new Date(Date.now() - hoursBack * 60 * 60 * 1000);
        sessionWhere = {
          created_at: {
            [Op.gte]: cutoff
          }
        };
        snapshotWhere = {
          timestamp: {
            [Op.gte]: cutoff
          }
        };
      }
      // If hoursBack >= 1000, get ALL data (for testing when no recent data exists)

      // Try Sequelize queries with proper error handling
      console.log('DatabaseStorage: Trying Sequelize queries...');

      const sessions = await Session.findAll({
        attributes: ['id', 'sanity_level', 'created_at'],
        order: [['created_at', 'DESC']],
        limit: 50,
        raw: true // Use raw results to avoid Sequelize instance issues
      });

      const snapshots = await Snapshot.findAll({
        attributes: ['id', 'sanity_level', 'timestamp'],
        order: [['timestamp', 'DESC']],
        limit: 50,
        raw: true
      });

      console.log('DatabaseStorage: Sequelize results - sessions:', sessions.length, 'snapshots:', snapshots.length);

      // Combine and anonymize data
      const collectiveData = {
        sessions: sessions.map(s => ({
          sanity_level: s.sanity_level,
          timestamp: s.created_at,
          // Anonymize by grouping similar sanity levels (0-9 clusters)
          cluster_id: Math.min(9, Math.floor(s.sanity_level / 10))
        })),
        snapshots: snapshots.map(s => ({
          sanity_level: s.sanity_level,
          timestamp: s.timestamp,
          cluster_id: Math.min(9, Math.floor(s.sanity_level / 10))
        })),
        metadata: {
          total_sessions: sessions.length,
          total_snapshots: snapshots.length,
          time_range_hours: hoursBack,
          generated_at: new Date().toISOString()
        }
      };

      console.log('DatabaseStorage: Returning collective data with', collectiveData.sessions.length, 'sessions and', collectiveData.snapshots.length, 'snapshots');
      return collectiveData;
    } catch (error) {
      console.error('Error fetching collective data:', error);
      throw error;
    }
  }

  // Get AI-enhanced collective average
  async getCollectiveAverage(hoursBack = 24) {
    try {
      const collectiveData = await this.getCollectiveData(2000, hoursBack);

      if (collectiveData.sessions.length === 0 && collectiveData.snapshots.length === 0) {
        return {
          average_sanity: 50,
          confidence: 0,
          sample_size: 0,
          trend: 'stable',
          distribution: {}
        };
      }

      // Combine all sanity levels
      const allSanityLevels = [
        ...collectiveData.sessions.map(s => s.sanity_level),
        ...collectiveData.snapshots.map(s => s.sanity_level)
      ];

      // Calculate weighted average (recent data has higher weight)
      const now = Date.now();
      const weights = allSanityLevels.map((_, index) => {
        const age = (now - new Date(collectiveData.sessions[index]?.timestamp || collectiveData.snapshots[index]?.timestamp).getTime()) / (1000 * 60 * 60); // hours old
        return Math.max(0.1, 1 - age / hoursBack); // Weight decreases with age
      });

      const weightedSum = allSanityLevels.reduce((sum, level, index) => sum + level * weights[index], 0);
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
      const average = weightedSum / totalWeight;

      // Calculate distribution
      const distribution = {};
      allSanityLevels.forEach(level => {
        const range = Math.floor(level / 10) * 10;
        distribution[range] = (distribution[range] || 0) + 1;
      });

      // Simple trend calculation
      const recent = allSanityLevels.slice(0, Math.min(50, allSanityLevels.length));
      const older = allSanityLevels.slice(Math.max(0, allSanityLevels.length - 50));
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      const trend = recentAvg > olderAvg + 2 ? 'improving' :
                   recentAvg < olderAvg - 2 ? 'declining' : 'stable';

      return {
        average_sanity: Math.round(average * 100) / 100,
        confidence: Math.min(100, allSanityLevels.length * 5), // Confidence based on sample size
        sample_size: allSanityLevels.length,
        trend,
        distribution,
        generated_at: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating collective average:', error);
      throw error;
    }
  }

  // Cleanup old data (optional maintenance)
  async cleanupOldData(daysOld = 90) {
    try {
      const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);

      const deletedSessions = await Session.destroy({
        where: { created_at: { [Op.lt]: cutoff } }
      });

      const deletedSnapshots = await Snapshot.destroy({
        where: { timestamp: { [Op.lt]: cutoff } }
      });

      console.log(`🧹 Cleaned up ${deletedSessions} old sessions and ${deletedSnapshots} old snapshots`);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

export default DatabaseStorage;
