@echo off
echo ========================================
echo  DIRECTORY TEST
echo ========================================
echo.
echo Current directory: %CD%
echo Script directory: %~dp0
echo.
echo Changing to script directory...
cd /d "%~dp0"
echo New current directory: %CD%
echo.
echo Checking if files exist...
if exist "package.json" (
    echo ✓ package.json found
) else (
    echo ✗ package.json NOT found
)

if exist "backend\package.json" (
    echo ✓ backend/package.json found
) else (
    echo ✗ backend/package.json NOT found
)

if exist "ml-model\ml_api.py" (
    echo ✓ ml-model/ml_api.py found
) else (
    echo ✗ ml-model/ml_api.py NOT found
)
echo.
echo Test complete. Press any key to exit.
pause >nul
