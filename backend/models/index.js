import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Session = sequelize.define('Session', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'anonymous',
    field: 'user_id'
  },
  sanityLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    },
    field: 'sanity_level'
  },
  preferences: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  ipAddress: {
    type: DataTypes.INET,
    field: 'ip_address'
  },
  userAgent: {
    type: DataTypes.TEXT,
    field: 'user_agent'
  }
}, {
  tableName: 'sessions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

const Snapshot = sequelize.define('Snapshot', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  sanityLevel: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0,
      max: 100
    },
    field: 'sanity_level'
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  ipAddress: {
    type: DataTypes.INET,
    field: 'ip_address'
  }
}, {
  tableName: 'snapshots',
  timestamps: false
});

const UserAnalytics = sequelize.define('UserAnalytics', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    field: 'user_id'
  },
  sessionCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    field: 'session_count'
  },
  avgSanityLevel: {
    type: DataTypes.DECIMAL(5, 2),
    field: 'avg_sanity_level'
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'last_active'
  }
}, {
  tableName: 'user_analytics',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

export { Session, Snapshot, UserAnalytics, sequelize };
