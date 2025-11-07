import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// SECURE CONFIGURATION MANAGEMENT
// Enterprise-grade credential protection for repository safety
// =============================================================================

class SecureConfig {
  constructor() {
    this.algorithm = 'aes-256-cbc';
    this.keyLength = 32;
    this.ivLength = 16;
    this.encryptionKey = this.getEncryptionKey();
  }

  // Get encryption key from environment or generate secure one
  getEncryptionKey() {
    // Check for environment-specific key
    const envKey = process.env.CONFIG_ENCRYPTION_KEY;
    if (envKey && envKey.length >= 32) {
      return crypto.scryptSync(envKey, 'sanity-orb-salt', this.keyLength);
    }

    // Generate a secure key for development (should be overridden in production)
    const devKey = crypto.scryptSync('dev-sanity-orb-2024-secure-key', 'salt', this.keyLength);
    console.warn('⚠️  Using development encryption key. Set CONFIG_ENCRYPTION_KEY environment variable for production.');

    return devKey;
  }

  // Encrypt sensitive data
  encrypt(text) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Return format: iv:encrypted
    return iv.toString('hex') + ':' + encrypted;
  }

  // Decrypt sensitive data
  decrypt(encryptedText) {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 2) {
        throw new Error('Invalid encrypted data format');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];

      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('❌ Failed to decrypt sensitive data:', error.message);
      throw new Error('Configuration decryption failed - check CONFIG_ENCRYPTION_KEY');
    }
  }

  // Securely store sensitive configuration
  saveSecureConfig(config) {
    const secureConfigPath = path.join(__dirname, '..', 'config', 'secure-config.enc');

    // Encrypt sensitive values
    const secureData = {
      database: {
        password: config.database?.password ? this.encrypt(config.database.password) : null,
        ssl: config.database?.ssl || true
      },
      jwt: {
        secret: config.jwt?.secret ? this.encrypt(config.jwt.secret) : null
      },
      encryption_key: config.encryption_key,
      created_at: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Save encrypted configuration
    fs.writeFileSync(secureConfigPath, JSON.stringify(secureData, null, 2));

    console.log('🔐 Secure configuration saved to config/secure-config.enc');
    return secureConfigPath;
  }

  // Load and decrypt sensitive configuration
  loadSecureConfig() {
    const secureConfigPath = path.join(__dirname, '..', 'config', 'secure-config.enc');

    if (!fs.existsSync(secureConfigPath)) {
      console.log('ℹ️  No secure configuration found, using environment variables');
      return {};
    }

    try {
      const encryptedData = JSON.parse(fs.readFileSync(secureConfigPath, 'utf8'));

      // Decrypt sensitive values
      const config = {
        database: {
          password: encryptedData.database?.password ? this.decrypt(encryptedData.database.password) : null,
          ssl: encryptedData.database?.ssl ?? true
        },
        jwt: {
          secret: encryptedData.jwt?.secret ? this.decrypt(encryptedData.jwt.secret) : null
        },
        encryption_key: encryptedData.encryption_key,
        created_at: encryptedData.created_at,
        environment: encryptedData.environment
      };

      console.log('🔓 Secure configuration loaded successfully');
      return config;
    } catch (error) {
      console.error('❌ Failed to load secure configuration:', error.message);
      throw error;
    }
  }

  // Generate secure random credentials
  generateSecureCredentials() {
    const password = crypto.randomBytes(32).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 24);
    const jwtSecret = crypto.randomBytes(64).toString('base64');

    return {
      database: {
        password: password
      },
      jwt: {
        secret: jwtSecret
      }
    };
  }

  // Validate security configuration
  validateSecurityConfig() {
    const issues = [];

    // Check encryption key strength
    if (!process.env.CONFIG_ENCRYPTION_KEY || process.env.CONFIG_ENCRYPTION_KEY.length < 32) {
      issues.push('CONFIG_ENCRYPTION_KEY must be at least 32 characters');
    }

    // Check database SSL
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_SSL !== 'true') {
      issues.push('DATABASE_SSL must be enabled in production');
    }

    // Check for exposed credentials
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      if (envContent.includes('password') && !envContent.includes('ENCRYPTED_')) {
        issues.push('Plain text passwords found in .env file');
      }
    }

    return issues;
  }
}

// Create singleton instance
const secureConfig = new SecureConfig();

export default secureConfig;
export { SecureConfig };
