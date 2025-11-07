#!/bin/bash

# Sanity Orb Database Setup Script
# This script automates the PostgreSQL database setup for Sanity Orb

set -e  # Exit on any error

echo " Sanity Orb Database Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if PostgreSQL is installed
check_postgres() {
    if ! command -v psql &> /dev/null; then
        print_error "PostgreSQL is not installed or not in PATH."
        echo "Please install PostgreSQL first:"
        echo "  - Windows (Chocolatey): choco install postgresql"
        echo "  - macOS (Homebrew): brew install postgresql"
        echo "  - Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
        echo "  - Download: https://www.postgresql.org/download/"
        exit 1
    fi
    print_success "PostgreSQL is installed"
}

# Check if PostgreSQL is running
check_postgres_running() {
    if ! pg_isready -h localhost -p 5432 &> /dev/null; then
        print_error "PostgreSQL is not running on localhost:5432"
        echo "Please start PostgreSQL service:"
        echo "  - Windows: services.msc (look for postgresql)"
        echo "  - Linux: sudo systemctl start postgresql"
        echo "  - macOS: brew services start postgresql"
        exit 1
    fi
    print_success "PostgreSQL is running"
}

# Generate a random password
generate_password() {
    openssl rand -base64 12 | tr -d "=+/" | cut -c1-16
}

# Create database and user
setup_database() {
    local db_name="sanity_orb_db"
    local db_user="sanity_orb_user"
    local db_password=$(generate_password)

    print_status "Creating database and user..."

    # Check if user already exists
    if psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$db_user'" | grep -q 1; then
        print_warning "User '$db_user' already exists. Using existing user."
        # Try to get existing password or create new one
        db_password=$(generate_password)
        print_warning "Generated new password for existing user"
    else
        # Create user
        psql -U postgres -c "CREATE USER $db_user WITH ENCRYPTED PASSWORD '$db_password';" 2>/dev/null || {
            print_error "Failed to create user. Make sure you're running as PostgreSQL admin."
            exit 1
        }
    fi

    # Check if database already exists
    if psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db_name'" | grep -q 1; then
        print_warning "Database '$db_name' already exists. Using existing database."
    else
        # Create database
        psql -U postgres -c "CREATE DATABASE $db_name;" 2>/dev/null || {
            print_error "Failed to create database. Make sure you're running as PostgreSQL admin."
            exit 1
        }
    fi

    # Grant permissions
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $db_name TO $db_user;" 2>/dev/null || {
        print_error "Failed to grant permissions"
        exit 1
    }

    print_success "Database and user created successfully"

    # Return connection details
    echo "$db_user:$db_password:$db_name"
}

# Update .env file
update_env_file() {
    local db_user=$1
    local db_password=$2
    local db_name=$3

    local env_file="backend/.env"
    local db_url="postgresql://$db_user:$db_password@localhost:5432/$db_name"

    print_status "Updating backend/.env file..."

    # Create .env file if it doesn't exist
    if [ ! -f "$env_file" ]; then
        touch "$env_file"
        print_warning ".env file created"
    fi

    # Remove existing DATABASE_URL if present
    sed -i.bak '/^DATABASE_URL=/d' "$env_file" 2>/dev/null || true

    # Add DATABASE_URL
    echo "DATABASE_URL=$db_url" >> "$env_file"

    # Ensure other required variables exist
    if ! grep -q "^PORT=" "$env_file"; then
        echo "PORT=3001" >> "$env_file"
    fi

    if ! grep -q "^NODE_ENV=" "$env_file"; then
        echo "NODE_ENV=development" >> "$env_file"
    fi

    if ! grep -q "^ML_API_URL=" "$env_file"; then
        echo "ML_API_URL=http://localhost:5001/api" >> "$env_file"
    fi

    if ! grep -q "^ALLOWED_ORIGINS=" "$env_file"; then
        echo "ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000" >> "$env_file"
    fi

    print_success ".env file updated"
}

# Initialize database schema
init_database_schema() {
    print_status "Initializing database schema..."

    cd backend

    if [ ! -f "migrations/init.sql" ]; then
        print_error "Database migration file not found: backend/migrations/init.sql"
        exit 1
    fi

    # Extract database URL components for psql
    local db_url=$(grep "^DATABASE_URL=" .env | cut -d'=' -f2)
    local db_user=$(echo $db_url | sed 's|postgresql://||' | cut -d':' -f1)
    local db_password=$(echo $db_url | sed 's|postgresql://||' | sed 's|@.*||' | cut -d':' -f2)
    local db_name=$(echo $db_url | sed 's|.*/||')

    PGPASSWORD=$db_password psql -U $db_user -d $db_name -f migrations/init.sql 2>/dev/null || {
        print_error "Failed to initialize database schema"
        echo "Make sure PostgreSQL is running and credentials are correct"
        exit 1
    }

    cd ..
    print_success "Database schema initialized"
}

# Test database connection
test_connection() {
    print_status "Testing database connection..."

    cd backend

    node -e "
    const { testConnection } = require('./config/database.js');
    testConnection().then(connected => {
      if (connected) {
        console.log('Database connection test passed');
        process.exit(0);
      } else {
        console.log('Database connection test failed');
        process.exit(1);
      }
    }).catch(err => {
      console.error('Database connection test error:', err.message);
      process.exit(1);
    });
    " 2>/dev/null

    if [ $? -eq 0 ]; then
        print_success "Database connection test passed"
    else
        print_error "Database connection test failed"
        exit 1
    fi

    cd ..
}

# Main setup function
main() {
    echo
    print_status "Starting Sanity Orb database setup..."
    echo

    # Run checks
    check_postgres
    check_postgres_running

    # Setup database
    local db_info=$(setup_database)
    IFS=':' read -r db_user db_password db_name <<< "$db_info"

    # Update configuration
    update_env_file "$db_user" "$db_password" "$db_name"

    # Initialize schema
    init_database_schema

    # Test connection
    test_connection

    echo
    echo "================================"
    print_success "Database setup completed successfully!"
    echo
    echo "Next steps:"
    echo "1. Start your Sanity Orb services: ./start-all.bat"
    echo "2. Check that the backend shows: '✓ Database: PostgreSQL connected'"
    echo "3. Your data will now persist between server restarts!"
    echo
    echo "Database Credentials (saved in backend/.env):"
    echo "   User: $db_user"
    echo "   Database: $db_name"
    echo "   Password: $db_password"
    echo
    echo "Keep this password secure and don't commit it to version control!"
    echo "================================"
}

# Run main function
main "$@"
