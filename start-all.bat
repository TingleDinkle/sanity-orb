@echo off
echo ========================================
echo  SANITY ORB - Starting All Services
echo ========================================
echo.

REM Check if models are trained
if not exist "ml-model\trained_models\session_predictor.json" (
    echo [!] ML models not found. Training models first...
    echo.
    cd ml-model
    python data_generator.py
    python xgboost_models.py
    cd ..
    echo.
    echo [✓] Models trained successfully!
    echo.
)

echo [1/4] Starting ML API Server (Python/Flask on port 5001)...
start "ML API Server" cmd /k "cd ml-model && python ml_api.py"
timeout /t 3 /nobreak >nul

echo [2/4] Starting Backend Server (Node.js on port 3001)...
start "Backend Server" cmd /k "cd backend && npm start"
timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend Dev Server (Vite on port 5173)...
start "Frontend Dev Server" cmd /k "npm run dev"
timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo  ALL SERVICES STARTED!
echo ========================================
echo.
echo Services running:
echo   • ML API:      http://localhost:5001
echo   • Backend:     http://localhost:3001
echo   • Frontend:    http://localhost:5173
echo.
echo Press any key to open the application in your browser...
pause >nul

start http://localhost:5173

echo.
echo To stop all services, close all the command windows.
echo.
pause
