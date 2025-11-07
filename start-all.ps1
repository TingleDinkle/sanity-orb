# Sanity Orb - Start All Services (PowerShell Version)
Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SANITY ORB - Starting All Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to test database connection
function Test-DatabaseConnection {
    Write-Host "[0/5] Checking database connectivity..." -ForegroundColor Yellow
    try {
        Push-Location backend
        $result = & npm run db:test 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database connection successful!" -ForegroundColor Green
            Pop-Location
            return $true
        } else {
            Write-Host "Database connection failed!" -ForegroundColor Red
            Write-Host "Please ensure:" -ForegroundColor Red
            Write-Host "  • PostgreSQL is installed and running" -ForegroundColor Red
            Write-Host "  • Database 'sanity_orb_db' exists" -ForegroundColor Red
            Write-Host "  • backend/.env has correct DATABASE_URL" -ForegroundColor Red
            Pop-Location
            return $false
        }
    } catch {
        Write-Host "Error testing database: $_" -ForegroundColor Red
        Pop-Location
        return $false
    }
}

# Check database connection
if (-not (Test-DatabaseConnection)) {
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if models are trained
if (-not (Test-Path "ml-model\trained_models\session_predictor.json")) {
    Write-Host "[1/5] ML models not found. Training models first..." -ForegroundColor Yellow
    Write-Host ""
    Push-Location ml-model
    & python data_generator.py
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Data generation failed!" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    & python xgboost_models.py
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Model training failed!" -ForegroundColor Red
        Pop-Location
        Read-Host "Press Enter to exit"
        exit 1
    }
    Pop-Location
    Write-Host ""
    Write-Host "[✓] Models trained successfully!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[1/5] ✓ ML models already trained" -ForegroundColor Green
}

# Start ML API Server
Write-Host "[2/5] Starting ML API Server (Python/Flask on port 5001)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k cd ml-model && python ml_api.py" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Backend Server
Write-Host "[3/5] Starting Backend Server (Node.js on port 3001)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k cd backend && npm start" -WindowStyle Normal
Start-Sleep -Seconds 3

# Start Frontend Dev Server
Write-Host "[4/5] Starting Frontend Dev Server (Vite on port 5173)..." -ForegroundColor Yellow
Start-Process -FilePath "cmd" -ArgumentList "/k npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "[5/5] All services started successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host " SANITY ORB - ALL SERVICES RUNNING!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services running:" -ForegroundColor White
Write-Host "  • Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "  • Backend:     http://localhost:3001" -ForegroundColor White
Write-Host "  • ML API:      http://localhost:5001" -ForegroundColor White
Write-Host "  • Database:    PostgreSQL (connected)" -ForegroundColor White
Write-Host ""
Write-Host "Opening application in browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5173"

Write-Host ""
Write-Host "Service Health Checks:" -ForegroundColor White
Write-Host "  • Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "  • Backend:  http://localhost:3001/api/health" -ForegroundColor White
Write-Host "  • ML API:   http://localhost:5001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "To stop all services: Close all command windows" -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to continue"
