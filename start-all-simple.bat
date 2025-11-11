@echo off
echo ========================================
echo  SANITY ORB - Simple Startup Script
echo ========================================
echo .

REM Change to the script's directory so it works when double-clicked
cd /d "%~dp0"
echo Working directory: %CD%
echo Script location: %~dp0
echo.

REM Check if we're in the right directory
if exist "package.json" (
    echo ✓ Found package.json - in correct directory
) else (
    echo ✗ ERROR: package.json not found!
    echo Current directory: %CD%
    echo Script directory: %~dp0
    echo.
    echo Please make sure this script is in the sanity-orb project root folder.
    pause
    exit /b 1
)
echo.

echo [1/4] Starting ML API Server (Python/Flask on port 5001)...
start "ML API Server" cmd /k "cd ml-model && python ml_api.py"
timeout /t 2 /nobreak >nul

echo [2/4] Starting Backend Server (Node.js on port 3001)...
start "Backend Server" cmd /k "cd /d %~dp0backend && npm start"
timeout /t 3 /nobreak >nul

echo [3/4] Starting Frontend Dev Server (Vite on port 5173)...
start "Frontend Dev Server" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo [4/4] Opening application in browser...
start http://localhost:5173

echo.
echo ========================================
echo  SANITY ORB - ALL SERVICES STARTED!
echo ========================================
echo.
echo Services running:
echo   • Frontend:    http://localhost:5173
echo   • Backend:     http://localhost:3001
echo   • ML API:      http://localhost:5001
echo   • Database:    PostgreSQL (running)
echo.
echo To stop all services: Close all command windows
echo.
pause
