@echo off
echo ========================================
echo  SANITY ORB - Starting All Services
echo ========================================
echo.

REM Check if PostgreSQL is running (basic check)
echo [0/5] Checking database connectivity...
cd backend
node -e "
const { testConnection } = await import('./config/database.js');
const connected = await testConnection();
if (!connected) {
  console.log('Database connection failed!');
  console.log('Make sure PostgreSQL is running and DATABASE_URL is configured in backend/.env');
  process.exit(1);
}
console.log('Database connection successful!');
"
if %errorlevel% neq 0 (
    echo.
    echo DATABASE CONNECTION FAILED!
    echo Please ensure:
    echo    • PostgreSQL is installed and running
    echo    • Database 'sanity_orb' exists
    echo    • backend/.env has correct DATABASE_URL
    echo.
    pause
    exit /b 1
)
cd ..
echo.

REM Check if models are trained
if not exist "ml-model\trained_models\session_predictor.json" (
    echo [1/5] ML models not found. Training models first...
    echo.
    cd ml-model
    python data_generator.py
    if %errorlevel% neq 0 (
        echo Data generation failed!
        cd ..
        pause
        exit /b 1
    )
    python xgboost_models.py
    if %errorlevel% neq 0 (
        echo Model training failed!
        cd ..
        pause
        exit /b 1
    )
    cd ..
    echo.
    echo [✓] Models trained successfully!
    echo.
) else (
    echo [1/5] ✓ ML models already trained
)

echo [2/5] Starting ML API Server (Python/Flask on port 5001)...
start "ML API Server" cmd /k "cd ml-model && python ml_api.py"
timeout /t 2 /nobreak >nul

echo [3/5] Starting Backend Server (Node.js on port 3001)...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo [4/5] Starting Frontend Dev Server (Vite on port 5173)...
start "Frontend Dev Server" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo.
echo [5/5] All services started successfully!
echo.

echo ========================================
echo  SANITY ORB - ALL SERVICES RUNNING!
echo ========================================
echo.
echo Services running:
echo   • Frontend:    http://localhost:5173
echo   • Backend:     http://localhost:3001
echo   • ML API:      http://localhost:5001
echo   • Database:    PostgreSQL (connected)
echo.
echo Opening application in browser...
start http://localhost:5173

echo.
echo Service Health Checks:
echo   • Frontend: http://localhost:5173
echo   • Backend:  http://localhost:3001/api/health
echo   • ML API:   http://localhost:5001/api/health
echo.
echo To stop all services: Close all command windows
echo.
echo Press any key to continue...
pause >nul
