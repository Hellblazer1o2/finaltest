const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class ExeBuilder {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.buildDir = path.join(this.projectRoot, 'build');
    this.distDir = path.join(this.projectRoot, 'dist');
  }

  async ensureDirectories() {
    const dirs = [this.buildDir, this.distDir];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    }
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');
    try {
      await execAsync('npm install', { cwd: this.projectRoot });
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message);
      throw error;
    }
  }

  async buildNextApp() {
    console.log('🏗️  Building Next.js application...');
    try {
      await execAsync('npm run build', { cwd: this.projectRoot });
      console.log('✅ Next.js build completed');
    } catch (error) {
      console.error('❌ Next.js build failed:', error.message);
      throw error;
    }
  }

  async createStandaloneServer() {
    console.log('🔧 Creating standalone server...');
    
    const serverCode = `
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const dev = false;
const hostname = 'localhost';
const port = 3000;

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Environment checker
const EnvironmentChecker = require('./scripts/check-environments.js');
const EnhancedCodeExecutor = require('./scripts/enhanced-code-executor.js');

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(\`🚀 IdeaRpit server running at http://\${hostname}:\${port}\`);
    console.log('🔍 Checking development environments...');
    
    // Check environments on startup
    const checker = new EnvironmentChecker();
    checker.checkAll().then((results) => {
      const allInstalled = Object.values(results).every(result => result.installed);
      if (allInstalled) {
        console.log('🎉 All development environments are ready!');
      } else {
        console.log('⚠️  Some environments are missing. Check the logs above.');
      }
    });
  });
});
`;

    const serverPath = path.join(this.buildDir, 'server.js');
    fs.writeFileSync(serverPath, serverCode);
    console.log('✅ Standalone server created');
  }

  async copyScripts() {
    console.log('📋 Copying scripts...');
    
    const scriptsToCopy = [
      'scripts/check-environments.js',
      'scripts/enhanced-code-executor.js'
    ];
    
    for (const script of scriptsToCopy) {
      const srcPath = path.join(this.projectRoot, script);
      const destPath = path.join(this.buildDir, script);
      
      if (fs.existsSync(srcPath)) {
        // Ensure destination directory exists
        const destDir = path.dirname(destPath);
        if (!fs.existsSync(destDir)) {
          fs.mkdirSync(destDir, { recursive: true });
        }
        
        fs.copyFileSync(srcPath, destPath);
        console.log(\`✅ Copied \${script}\`);
      } else {
        console.log(\`⚠️  Script not found: \${script}\`);
      }
    }
  }

  async createPackageJson() {
    console.log('📄 Creating package.json for executable...');
    
    const packageJson = {
      name: 'idearpit-standalone',
      version: '1.0.0',
      description: 'IdeaRpit - Competitive Programming Platform',
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        'check-env': 'node scripts/check-environments.js'
      },
      dependencies: {
        'next': '^15.5.2',
        'react': '^19.1.0',
        'react-dom': '^19.1.0',
        '@prisma/client': '^6.15.0',
        'prisma': '^6.15.0',
        'bcryptjs': '^3.0.2',
        'jsonwebtoken': '^9.0.2',
        '@monaco-editor/react': '^4.7.0',
        'lucide-react': '^0.542.0',
        'clsx': '^2.1.1',
        'tailwind-merge': '^3.3.1'
      },
      engines: {
        node: '>=18.0.0'
      }
    };
    
    const packagePath = path.join(this.buildDir, 'package.json');
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json created');
  }

  async createStartupScript() {
    console.log('🚀 Creating startup script...');
    
    const startupScript = \`@echo off
echo ========================================
echo    IdeaRpit - Competitive Programming
echo ========================================
echo.
echo Checking system requirements...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js: OK

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    python3 --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo WARNING: Python is not installed or not in PATH
        echo Python support will not be available
    ) else (
        echo Python3: OK
    )
) else (
    echo Python: OK
)

REM Check if g++ is installed
g++ --version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: C++ compiler (g++) is not installed or not in PATH
    echo C++ support will not be available
) else (
    echo C++: OK
)

REM Check if Java is installed
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Java is not installed or not in PATH
    echo Java support will not be available
) else (
    echo Java: OK
)

echo.
echo Starting IdeaRpit server...
echo.
echo The application will open in your default browser.
echo If it doesn't open automatically, go to: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.

REM Start the server
node server.js

pause
\`;
    
    const scriptPath = path.join(this.distDir, 'start-idearpit.bat');
    fs.writeFileSync(scriptPath, startupScript);
    console.log('✅ Startup script created');
  }

  async createReadme() {
    console.log('📖 Creating README...');
    
    const readme = \`# IdeaRpit - Competitive Programming Platform

## System Requirements

Before running IdeaRpit, ensure you have the following installed:

### Required:
- **Node.js 18+** - Download from https://nodejs.org/
- **Web Browser** - Chrome, Firefox, Safari, or Edge

### Optional (for code execution):
- **Python 3.x** - Download from https://python.org/
- **C++ Compiler (g++)** - Install via:
  - Windows: MinGW-w64 or Visual Studio Build Tools
  - macOS: Xcode Command Line Tools (\`xcode-select --install\`)
  - Linux: \`sudo apt-get install g++\` (Ubuntu/Debian)
- **Java JDK 8+** - Download from https://adoptium.net/

## Quick Start

1. **Run the application:**
   - Double-click \`start-idearpit.bat\` (Windows)
   - Or run \`node server.js\` in terminal

2. **Access the platform:**
   - Open your browser and go to http://localhost:3000
   - The application will automatically open in your default browser

3. **Create an admin account:**
   - Click "Register" on the homepage
   - Select "Admin (Teacher/Judge)" role
   - Complete the registration

4. **Start using the platform:**
   - Login with your admin account
   - Create problems in the Admin Panel
   - Users can register and start solving problems

## Features

- **Multi-language Support**: JavaScript, Python, Java, C++
- **Real-time Code Execution**: Test your solutions instantly
- **Advanced Security**: Tab restrictions and anti-cheating measures
- **Admin Panel**: Create and manage problems
- **User Management**: Track warnings and disqualifications
- **Competition Rounds**: Time-limited competitions
- **Leaderboard**: Track user performance

## Troubleshooting

### Environment Issues
If you see warnings about missing languages:
1. Install the missing language/environment
2. Ensure it's added to your system PATH
3. Restart the application

### Port Already in Use
If port 3000 is busy:
1. Close other applications using port 3000
2. Or modify the port in server.js

### Database Issues
The application uses SQLite by default. For production use:
1. Set up PostgreSQL
2. Update the DATABASE_URL in your environment

## Support

For issues and questions:
- Check the console output for error messages
- Ensure all system requirements are met
- Verify that all languages are properly installed

## License

This project is licensed under the MIT License.
\`;
    
    const readmePath = path.join(this.distDir, 'README.md');
    fs.writeFileSync(readmePath, readme);
    console.log('✅ README created');
  }

  async build() {
    try {
      console.log('🏗️  Building IdeaRpit Executable...\n');
      
      await this.ensureDirectories();
      await this.installDependencies();
      await this.buildNextApp();
      await this.createStandaloneServer();
      await this.copyScripts();
      await this.createPackageJson();
      await this.createStartupScript();
      await this.createReadme();
      
      console.log('\n🎉 Build completed successfully!');
      console.log(\`📁 Distribution files created in: \${this.distDir}\`);
      console.log('📁 Build files created in:', this.buildDir);
      console.log('\n🚀 To run the application:');
      console.log(\`   1. Copy the contents of \${this.distDir} to your target machine\`);
      console.log('   2. Run start-idearpit.bat (Windows) or node server.js');
      console.log('   3. Open http://localhost:3000 in your browser');
      
    } catch (error) {
      console.error('\n❌ Build failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const builder = new ExeBuilder();
  builder.build();
}

module.exports = ExeBuilder;
