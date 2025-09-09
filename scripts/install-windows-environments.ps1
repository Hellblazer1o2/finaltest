# PowerShell script to install development environments on Windows
# Run as Administrator for best results

param(
    [switch]$Force,
    [switch]$SkipConfirmation
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    IdeaRpit - Windows Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")

if (-not $isAdmin) {
    Write-Host "⚠️  Warning: Not running as Administrator" -ForegroundColor Yellow
    Write-Host "   Some installations may require admin privileges" -ForegroundColor Yellow
    Write-Host ""
}

# Function to check if a command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Function to install Chocolatey if not present
function Install-Chocolatey {
    if (Test-Command choco) {
        Write-Host "✅ Chocolatey is already installed" -ForegroundColor Green
        return $true
    }
    
    Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
    try {
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        Write-Host "✅ Chocolatey installed successfully" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Failed to install Chocolatey: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to install Python
function Install-Python {
    if (Test-Command python) {
        Write-Host "✅ Python is already installed" -ForegroundColor Green
        return $true
    }
    
    Write-Host "🐍 Installing Python..." -ForegroundColor Yellow
    try {
        if (Test-Command choco) {
            choco install python -y
            Write-Host "✅ Python installed via Chocolatey" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Chocolatey not available. Please install Python manually:" -ForegroundColor Yellow
            Write-Host "   Download from: https://www.python.org/downloads/" -ForegroundColor Yellow
            Write-Host "   Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
            return $false
        }
        return $true
    } catch {
        Write-Host "❌ Failed to install Python: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to install C++ compiler
function Install-CppCompiler {
    if (Test-Command g++) {
        Write-Host "✅ C++ compiler (g++) is already installed" -ForegroundColor Green
        return $true
    }
    
    Write-Host "⚙️  Installing C++ compiler..." -ForegroundColor Yellow
    try {
        if (Test-Command choco) {
            choco install mingw -y
            Write-Host "✅ MinGW installed via Chocolatey" -ForegroundColor Green
            Write-Host "⚠️  You may need to restart your terminal or add MinGW to PATH manually" -ForegroundColor Yellow
        } else {
            Write-Host "⚠️  Chocolatey not available. Please install C++ compiler manually:" -ForegroundColor Yellow
            Write-Host "   Option 1: MinGW-w64 - https://www.mingw-w64.org/downloads/" -ForegroundColor Yellow
            Write-Host "   Option 2: Visual Studio Build Tools - https://visualstudio.microsoft.com/downloads/" -ForegroundColor Yellow
            return $false
        }
        return $true
    } catch {
        Write-Host "❌ Failed to install C++ compiler: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to install Java
function Install-Java {
    if (Test-Command java) {
        Write-Host "✅ Java is already installed" -ForegroundColor Green
        return $true
    }
    
    Write-Host "☕ Installing Java..." -ForegroundColor Yellow
    try {
        if (Test-Command choco) {
            choco install openjdk -y
            Write-Host "✅ OpenJDK installed via Chocolatey" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Chocolatey not available. Please install Java manually:" -ForegroundColor Yellow
            Write-Host "   Download from: https://adoptium.net/" -ForegroundColor Yellow
            Write-Host "   Make sure to add Java to PATH during installation" -ForegroundColor Yellow
            return $false
        }
        return $true
    } catch {
        Write-Host "❌ Failed to install Java: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to refresh environment variables
function Refresh-Environment {
    Write-Host "🔄 Refreshing environment variables..." -ForegroundColor Yellow
    try {
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        Write-Host "✅ Environment variables refreshed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Could not refresh environment variables. You may need to restart your terminal." -ForegroundColor Yellow
    }
}

# Main installation process
Write-Host "🔍 Checking current environment status..." -ForegroundColor Cyan
Write-Host ""

$chocoInstalled = Install-Chocolatey
Write-Host ""

if (-not $SkipConfirmation -and -not $Force) {
    $response = Read-Host "Do you want to install missing environments? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "Installation cancelled by user." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "🚀 Starting installation process..." -ForegroundColor Cyan
Write-Host ""

$pythonInstalled = Install-Python
Write-Host ""

$cppInstalled = Install-CppCompiler
Write-Host ""

$javaInstalled = Install-Java
Write-Host ""

Refresh-Environment
Write-Host ""

# Final status check
Write-Host "📊 Final Environment Status:" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan

$allInstalled = $true

if (Test-Command node) {
    Write-Host "✅ Node.js: $(node --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Node.js: Not installed" -ForegroundColor Red
    $allInstalled = $false
}

if (Test-Command python) {
    Write-Host "✅ Python: $(python --version)" -ForegroundColor Green
} else {
    Write-Host "❌ Python: Not installed" -ForegroundColor Red
    $allInstalled = $false
}

if (Test-Command g++) {
    Write-Host "✅ C++ (g++): $(g++ --version | Select-Object -First 1)" -ForegroundColor Green
} else {
    Write-Host "❌ C++ (g++): Not installed" -ForegroundColor Red
    $allInstalled = $false
}

if (Test-Command java) {
    Write-Host "✅ Java: $(java -version 2>&1 | Select-Object -First 1)" -ForegroundColor Green
} else {
    Write-Host "❌ Java: Not installed" -ForegroundColor Red
    $allInstalled = $false
}

Write-Host ""

if ($allInstalled) {
    Write-Host "🎉 All development environments are installed and ready!" -ForegroundColor Green
    Write-Host "   You can now run IdeaRpit with full language support." -ForegroundColor Green
} else {
    Write-Host "⚠️  Some environments are still missing." -ForegroundColor Yellow
    Write-Host "   You may need to:" -ForegroundColor Yellow
    Write-Host "   1. Restart your terminal/command prompt" -ForegroundColor Yellow
    Write-Host "   2. Manually add programs to your PATH" -ForegroundColor Yellow
    Write-Host "   3. Install missing programs manually" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "💡 To verify installations, run: npm run check:env" -ForegroundColor Cyan
