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
      const [analytics, created] = await UserAnalytics.findOrCreate({
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
