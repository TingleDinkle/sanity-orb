#  Sanity Orb Database Setup Guide

This guide will help you set up PostgreSQL database storage for your Sanity Orb project, replacing the in-memory storage with persistent data storage.

## Prerequisites

1. **PostgreSQL installed** on your system
   - Download from: https://www.postgresql.org/download/
   - Or use package managers:
     - Windows (Chocolatey): `choco install postgresql`
     - macOS (Homebrew): `brew install postgresql`
     - Ubuntu/Debian: `sudo apt install postgresql postgresql-contrib`

2. **PostgreSQL running**
   - Start PostgreSQL service
   - Default port: 5432

##  Quick Setup (Automated)

### Option 1: Using the Setup Script (Recommended)

I've created an automated setup script. Run this from your project root:

```bash
# Make the script executable (Linux/Mac)
chmod +x setup-database.sh

# Run the setup
./setup-database.sh
```

### Option 2: Manual Setup

If the automated script doesn't work, follow these manual steps:

#### Step 1: Create Database and User

Open PostgreSQL command line (`psql`) as admin user:

```sql
-- Connect as postgres superuser
psql -U postgres

-- Create database
CREATE DATABASE sanity_orb_db;

-- Create user (replace 'your_secure_password' with a strong password)
CREATE USER sanity_orb_user WITH ENCRYPTED PASSWORD 'your_secure_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sanity_orb_db TO sanity_orb_user;

-- Exit psql
\q
```

#### Step 2: Configure Environment Variables

Update your `backend/.env` file:

```env
# Database Configuration
DATABASE_URL=postgresql://sanity_orb_user:your_secure_password@localhost:5432/sanity_orb_db

# Other existing variables...
PORT=3001
NODE_ENV=development
ML_API_URL=http://localhost:5001/api
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

#### Step 3: Initialize Database Schema

```bash
cd backend

# Initialize database tables
npm run db:init
```

#### Step 4: Test Database Connection

```bash
# Test connection
npm run db:test

# Should output: Database connection established successfully.
```

##  Database Schema

The database includes these tables:

### `sessions`
- Stores user sanity sessions
- Fields: id, user_id, sanity_level, preferences, ip_address, user_agent, created_at

### `snapshots`
- Stores real-time mood snapshots
- Fields: id, sanity_level, timestamp, ip_address

### `user_analytics`
- Tracks user statistics
- Fields: id, user_id, session_count, avg_sanity_level, last_active, created_at

## 🛠️ Available Database Commands

```bash
cd backend

# Initialize database (create tables)
npm run db:init

# Reset database (drop and recreate tables)
npm run db:reset

# Test database connection
npm run db:test

# Start server (will show database connection status)
npm start
```

## Troubleshooting

### Connection Issues

**Error: "Unable to connect to the database"**

1. **Check PostgreSQL is running:**
   ```bash
   # Windows
   services.msc (look for postgresql)

   # Linux/Mac
   sudo systemctl status postgresql
   # or
   brew services list | grep postgresql
   ```

2. **Verify DATABASE_URL:**
   - Ensure username/password are correct
   - Check database name exists
   - Verify PostgreSQL is accepting connections on localhost:5432

3. **Test connection manually:**
   ```bash
   psql -U sanity_orb_user -d sanity_orb_db -h localhost
   ```

### Permission Issues

**Error: "permission denied for database"**

```sql
-- Connect as postgres superuser
psql -U postgres

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE sanity_orb_db TO sanity_orb_user;
GRANT ALL ON SCHEMA public TO sanity_orb_user;
```

### Table Creation Issues

**Error: "relation already exists"**

```bash
# Reset the database
npm run db:reset
```

## Database Features

### Automatic Analytics
- User session counting
- Average sanity level tracking
- Last activity monitoring

### Data Persistence
- Sessions survive server restarts
- Historical data for ML predictions
- Real-time mood tracking

### Performance Optimizations
- Database indexes on frequently queried fields
- Connection pooling
- Efficient queries with Sequelize ORM

## Migration from In-Memory Storage

The system automatically handles migration from in-memory to database storage:

1. **No data loss** - Previous in-memory data wasn't persisted anyway
2. **Seamless transition** - API endpoints work identically
3. **Enhanced features** - Analytics, persistence, scalability

## Production Deployment

For production, consider:

1. **Connection pooling** (already configured)
2. **SSL connections** (`DATABASE_SSL=true`)
3. **Regular backups**
4. **Monitoring** (query performance, connection counts)
5. **Scaling** (read replicas, connection limits)

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Verify PostgreSQL is properly installed and running
3. Ensure DATABASE_URL is correctly formatted
4. Check server logs for detailed error messages

The database integration maintains all existing functionality while adding persistency :v
