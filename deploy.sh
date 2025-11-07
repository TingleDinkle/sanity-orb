#!/bin/bash

# Internet Sanity Orb - Deployment Script
# Supports both local development and production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
}

# Deploy locally using Docker Compose
deploy_local() {
    log_info "Starting local deployment with Docker Compose..."

    # Check if .env file exists
    if [ ! -f ".env" ]; then
        log_warning ".env not found. Creating from template..."
        cp .env.example .env 2>/dev/null || log_warning "No .env.example found"
    fi

    # Check if backend/.env exists
    if [ ! -f "backend/.env" ]; then
        log_warning "backend/.env not found. Creating from template..."
        cp backend/.env.example backend/.env 2>/dev/null || log_warning "No backend/.env.example found"
    fi

    # First, run ML model training if needed
    log_info "Checking and training ML models if needed..."
    docker-compose --profile setup -f config/docker/docker-compose.yml up ml-trainer

    # Build and start all services
    log_info "Building and starting all services..."
    docker-compose -f config/docker/docker-compose.yml up --build -d

    # Wait for services to be healthy
    log_info "Waiting for services to be healthy..."
    sleep 30

    # Check service health
    check_services_health

    log_success "Local deployment completed!"
    log_info "Services running:"
    log_info "  • Frontend: http://localhost:5173"
    log_info "  • Backend:  http://localhost:3001"
    log_info "  • ML API:   http://localhost:5001"
    log_info "  • Database: localhost:5432"
    log_info ""
    log_info "Opening application in browser..."
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:5173
    elif command -v open &> /dev/null; then
        open http://localhost:5173
    elif command -v start &> /dev/null; then
        start http://localhost:5173
    fi
}

# Deploy to Railway
deploy_railway() {
    log_info "Deploying to Railway..."

    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        log_error "Railway CLI is not installed. Install with: npm install -g @railway/cli"
        exit 1
    fi

    # Login to Railway
    log_info "Logging into Railway..."
    railway login

    # Deploy services
    log_info "Deploying services to Railway..."
    railway up

    log_success "Railway deployment initiated!"
    log_info "Check Railway dashboard for deployment status"
}

# Deploy frontend to Vercel
deploy_vercel() {
    log_info "Deploying frontend to Vercel..."

    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        log_error "Vercel CLI is not installed. Install with: npm install -g vercel"
        exit 1
    fi

    # Login to Vercel
    log_info "Logging into Vercel..."
    vercel login

    # Deploy frontend
    log_info "Deploying frontend..."
    vercel --prod

    log_success "Vercel deployment completed!"
}

# Check service health
check_services_health() {
    log_info "Checking service health..."

    # Check backend health
    if curl -f http://localhost:3001/api/health &>/dev/null; then
        log_success "Backend is healthy"
    else
        log_warning "Backend health check failed"
    fi

    # Check ML API health
    if curl -f http://localhost:5001/api/health &>/dev/null; then
        log_success "ML API is healthy"
    else
        log_warning "ML API health check failed"
    fi

    # Check frontend
    if curl -f http://localhost:5173 &>/dev/null; then
        log_success "Frontend is responding"
    else
        log_warning "Frontend is not responding"
    fi
}

# Stop local services
stop_local() {
    log_info "Stopping local services..."
    docker-compose -f config/docker/docker-compose.yml down
    log_success "Services stopped"
}

# Show usage
usage() {
    echo "Internet Sanity Orb - Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  local     Deploy locally using Docker Compose"
    echo "  railway   Deploy to Railway"
    echo "  vercel    Deploy frontend to Vercel"
    echo "  stop      Stop local services"
    echo "  health    Check service health"
    echo "  help      Show this help"
    echo ""
    echo "Examples:"
    echo "  $0 local          # Start local development environment"
    echo "  $0 railway       # Deploy backend and ML to Railway"
    echo "  $0 vercel        # Deploy frontend to Vercel"
    echo "  $0 stop          # Stop local services"
}

# Main script
case "${1:-help}" in
    "local")
        check_docker
        deploy_local
        ;;
    "railway")
        deploy_railway
        ;;
    "vercel")
        deploy_vercel
        ;;
    "stop")
        check_docker
        stop_local
        ;;
    "health")
        check_services_health
        ;;
    "help"|*)
        usage
        ;;
esac
