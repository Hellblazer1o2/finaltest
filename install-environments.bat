@echo off
title IdeaRpit - Install Development Environments
color 0B

echo.
echo ========================================
echo    IdeaRpit - Environment Installer
echo ========================================
echo.

echo This script will install the following development environments:
echo - Python 3.x
echo - C++ Compiler (MinGW)
echo - Java JDK
echo.
echo Note: Node.js should already be installed to run this script.
echo.

set /p choice="Do you want to continue? (y/N): "
if /i not "%choice%"=="y" (
    echo Installation cancelled.
    pause
    exit /b 0
)

echo.
echo Starting installation...
echo.

REM Check if PowerShell is available
powershell -Command "Get-Host" >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: PowerShell is not available on this system.
    echo Please install PowerShell or run the installation manually.
    pause
    exit /b 1
)

REM Run the PowerShell script
powershell -ExecutionPolicy Bypass -File "scripts\install-windows-environments.ps1" -SkipConfirmation

echo.
echo Installation process completed.
echo.
echo To verify the installations, run: npm run check:env
echo.
pause
