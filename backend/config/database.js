/* eslint-disable no-undef */
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import secureConfig from './secure-config.js';

dotenv.config();

// Load secure configuration
const secureCfg = secureConfig.loadSecureConfig();

// Build database URL with decrypted credentials
const buildDatabaseUrl = () => {
  // Check for Railway's environment variable first, then fallback to DATABASE_URL
  const baseUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;

  // Check if database URL is set
  if (!baseUrl) {
    throw new Error('Database URL not found. Please set RAILWAY_DATABASE_URL (Railway) or DATABASE_URL (local) environment variable.');
  }

  // Replace encrypted placeholders with actual decrypted values
  let finalUrl = baseUrl;
  if (finalUrl.includes('ENCRYPTED_DATABASE_PASSWORD') && secureCfg.database?.password) {
    finalUrl = finalUrl.replace('ENCRYPTED_DATABASE_PASSWORD', secureCfg.database.password);
  }

  return finalUrl;
};

const sequelize = new Sequelize(buildDatabaseUrl(), {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,

  // Enhanced security settings
  dialectOptions: {
    // SSL/TLS encryption (required for production)
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: true, // Strict SSL validation
    } : (process.env.DATABASE_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false, // Allow self-signed certs in development
    } : false),

    // Connection timeout and security
    connectTimeout: 10000, // 10 second timeout
    acquireTimeout: 30000,
    timeout: 30000,

    // Additional security options
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
  },

  // Connection pool security
  pool: {
    max: parseInt(process.env.DB_POOL_MAX) || 5,        // Limit concurrent connections
    min: parseInt(process.env.DB_POOL_MIN) || 0,
    acquire: parseInt(process.env.DB_POOL_ACQUIRE) || 30000, // 30 second acquire timeout
    idle: parseInt(process.env.DB_POOL_IDLE) || 10000,       // 10 second idle timeout
    evict: parseInt(process.env.DB_POOL_EVICT) || 60000,     // 1 minute eviction check
    handleDisconnects: true, // Automatically handle disconnections
  },

  // Query security and performance
  define: {
    timestamps: true,
    underscored: true,
    paranoid: false, // Soft deletes disabled for performance
    freezeTableName: true, // Prevent table name pluralization

    // Security hooks
    hooks: {
      beforeCreate: (instance) => {
        // Log sensitive operations in production
        if (process.env.NODE_ENV === 'production') {
          console.log(`[AUDIT] Creating ${instance.constructor.name} record`);
        }
      },
      beforeUpdate: (instance) => {
        if (process.env.NODE_ENV === 'production') {
          console.log(`[AUDIT] Updating ${instance.constructor.name} record`);
        }
      },
    },
  },

  // Retry configuration for resilience
  retry: {
    max: 3,
    timeout: 5000,
    match: [
      /Connection terminated/,
      /Connection lost/,
      /Connection timeout/,
      /read ECONNRESET/,
    ],
  },
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error.message);
    console.log('💡 Make sure PostgreSQL is running and DATABASE_URL is configured in .env');
    return false;
  }
};

export { sequelize, testConnection };
