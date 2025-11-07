#!/usr/bin/env node

/* eslint-disable no-undef */
/**
 * Database Initialization Script
 * Creates tables using Sequelize instead of raw SQL
 */

import { sequelize, Session, Snapshot, UserAnalytics } from '../models/index.js';

async function initializeDatabase() {
  try {
    console.log('🔄 Connecting to database...');

    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');

    console.log('🏗️  Creating tables...');

    // Sync all models (create tables if they don't exist)
    await sequelize.sync({ force: false, alter: false });

    console.log('✅ Tables created successfully');
    console.log('📊 Available tables:');
    console.log('   - sessions');
    console.log('   - snapshots');
    console.log('   - user_analytics');

    // Optional: Create some initial data
    console.log('🌱 Checking for existing data...');

    const sessionCount = await Session.count();
    const snapshotCount = await Snapshot.count();

    console.log(`📈 Current data: ${sessionCount} sessions, ${snapshotCount} snapshots`);

    console.log('🎉 Database initialization complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    console.log('💡 Make sure DATABASE_URL is properly configured');
    process.exit(1);
  }
}

// Run the initialization
initializeDatabase();
