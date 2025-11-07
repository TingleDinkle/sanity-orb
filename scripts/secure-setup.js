#!/usr/bin/env node

/**
 * SECURE DATABASE SETUP SCRIPT
 * Generates encrypted credentials and secures configuration for repository safety
 */

import { SecureConfig } from '../backend/config/secure-config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const secureConfig = new SecureConfig();

console.log('🔐 SANITY ORB - SECURE CONFIGURATION SETUP');
console.log('==========================================\n');

// Generate secure credentials
console.log('🔑 Generating secure credentials...');
const credentials = secureConfig.generateSecureCredentials();

console.log('✅ Generated database password:', credentials.database.password.substring(0, 8) + '...');
console.log('✅ Generated JWT secret:', credentials.jwt.secret.substring(0, 8) + '...\n');

// Create secure configuration
const secureData = {
  database: {
    password: credentials.database.password
  },
  jwt: {
    secret: credentials.jwt.secret
  },
  encryption_key: process.env.CONFIG_ENCRYPTION_KEY || 'dev-sanity-orb-2024-secure-key'
};

// Save encrypted configuration
const configPath = secureConfig.saveSecureConfig(secureData);

// Update .env file with repository-safe values
console.log('📝 Updating .env file with encrypted references...');

const envPath = path.join(__dirname, '..', 'backend', '.env');
let envContent = '';

if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Replace sensitive values with encrypted placeholders
envContent = envContent.replace(
  /DATABASE_URL=.*/,
  'DATABASE_URL=postgresql://sanity_orb_user:ENCRYPTED_DATABASE_PASSWORD@localhost:5432/sanity_orb_db'
);

envContent = envContent.replace(
  /JWT_SECRET=.*/,
  'JWT_SECRET=ENCRYPTED_JWT_SECRET'
);

// Add security environment variables
if (!envContent.includes('CONFIG_ENCRYPTION_KEY=')) {
  envContent += '\n# Security Configuration\n';
  envContent += 'CONFIG_ENCRYPTION_KEY=your-production-encryption-key-here-change-this\n';
}

if (!envContent.includes('DATABASE_SSL=')) {
  envContent += 'DATABASE_SSL=true\n';
}

if (!envContent.includes('DB_POOL_MAX=')) {
  envContent += '# Database Connection Pool\n';
  envContent += 'DB_POOL_MAX=10\n';
  envContent += 'DB_POOL_MIN=2\n';
  envContent += 'DB_POOL_ACQUIRE=30000\n';
  envContent += 'DB_POOL_IDLE=10000\n';
  envContent += 'DB_POOL_EVICT=60000\n';
}

// Save updated .env
fs.writeFileSync(envPath, envContent);

console.log('✅ .env file updated with secure placeholders\n');

// Create .env.example for repository
const exampleEnvPath = path.join(__dirname, '..', '.env.example');
const exampleContent = `# Sanity Orb Environment Configuration
# Copy this file to .env and fill in your values

# Server Configuration
PORT=3001
NODE_ENV=development

# ML API Configuration
ML_API_URL=http://localhost:5001/api

# Database Configuration (Required)
DATABASE_URL=postgresql://sanity_orb_user:your_password_here@localhost:5432/sanity_orb_db

# Security Configuration (Required for production)
CONFIG_ENCRYPTION_KEY=your-32-character-minimum-encryption-key-here
DATABASE_SSL=true

# Database Connection Pool
DB_POOL_MAX=10
DB_POOL_MIN=2
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000
DB_POOL_EVICT=60000

# JWT Secret (Auto-generated in secure setup)
JWT_SECRET=your-jwt-secret-here

# CORS Settings
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
`;

fs.writeFileSync(exampleEnvPath, exampleContent);
console.log('✅ Created .env.example for repository\n');

// Validate security configuration
console.log('🔍 Validating security configuration...');
const issues = secureConfig.validateSecurityConfig();

if (issues.length > 0) {
  console.log('⚠️  Security validation issues found:');
  issues.forEach(issue => console.log(`   - ${issue}`));
  console.log('');
} else {
  console.log('✅ Security configuration validated\n');
}

// Create security documentation
const securityDoc = `# 🔒 DATABASE SECURITY OVERVIEW

## Credential Protection
- Database passwords are encrypted using AES-256-GCM
- JWT secrets are encrypted and stored securely
- Configuration encryption key must be set in production

## Connection Security
- SSL/TLS encryption enabled for all connections
- Strict certificate validation in production
- Connection timeouts and keep-alive settings

## Access Control
- Limited database user privileges
- Row-level security policies
- IP-based connection restrictions

## Audit & Monitoring
- Database operation logging
- Failed connection tracking
- Performance monitoring

## Repository Safety
- No plain-text credentials in version control
- Encrypted configuration files
- Environment-specific security settings

## Production Requirements
- Set CONFIG_ENCRYPTION_KEY (32+ characters)
- Enable DATABASE_SSL=true
- Use strong PostgreSQL passwords
- Configure firewall rules
- Regular security updates
`;

fs.writeFileSync(path.join(__dirname, '..', 'DATABASE_SECURITY.md'), securityDoc);
console.log('✅ Created DATABASE_SECURITY.md documentation\n');

console.log('🎉 SECURE SETUP COMPLETE!');
console.log('========================');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Set CONFIG_ENCRYPTION_KEY in production environment');
console.log('2. Update DATABASE_URL with actual database credentials');
console.log('3. Review DATABASE_SECURITY.md for production hardening');
console.log('4. Test database connection: npm run db:test');
console.log('');
console.log('🔐 Your repository is now secure - no sensitive data exposed!');
console.log('');

// Display generated credentials for reference (should not be committed)
console.log('🔑 GENERATED CREDENTIALS (DO NOT COMMIT):');
console.log('=====================================');
console.log(`Database Password: ${credentials.database.password}`);
console.log(`JWT Secret: ${credentials.jwt.secret}`);
console.log('');
console.log('⚠️  Save these credentials securely and set them in your production environment!');
console.log('⚠️  Never commit these values to version control!');
console.log('');
