@echo off
title IdeaRpit - Building Executable
color 0B

echo.
echo ========================================
echo    IdeaRpit - Building Executable
echo ========================================
echo.

echo Step 1: Checking system requirements...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js: OK

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    pause
    exit /b 1
)

echo npm: OK

echo.
echo Step 2: Installing dependencies...
echo.
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo Step 3: Setting up database...
echo.
npm run db:setup
if %errorlevel% neq 0 (
    echo WARNING: Database setup failed, but continuing...
)

echo.
echo Step 4: Checking development environments...
echo.
npm run check:env

echo.
echo Step 4.1: Auto-installing missing environments (if needed)...
echo.
npm run install:env

echo.
echo Step 5: Building Next.js application...
echo.
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Next.js build failed
    pause
    exit /b 1
)

echo.
echo Step 6: Creating standalone executable...
echo.
npm run build:standalone
if %errorlevel% neq 0 (
    echo ERROR: Executable creation failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Build Completed Successfully!
echo ========================================
echo.
echo The executable has been created in the 'dist' folder.
echo.
echo To distribute the application:
echo 1. Copy the entire 'dist' folder to target machines
echo 2. Run 'start-idearpit.bat' or 'idearpit.exe'
echo 3. The application will open automatically in the browser
echo.
echo Press any key to exit...
pause >nul
