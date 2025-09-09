const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');

const execAsync = promisify(exec);

class StandaloneExeBuilder {
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

  async installPkg() {
    console.log('📦 Installing pkg for executable creation...');
    try {
      await execAsync('npm install -g pkg');
      console.log('✅ pkg installed successfully');
    } catch (error) {
      console.log('⚠️  pkg installation failed, trying local install...');
      try {
        await execAsync('npm install pkg --save-dev');
        console.log('✅ pkg installed locally');
      } catch (localError) {
        console.error('❌ Failed to install pkg:', localError.message);
        throw localError;
      }
    }
  }

  async createStandaloneApp() {
    console.log('🔧 Creating standalone application...');
    
    const appCode = `
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import our custom modules
const EnvironmentChecker = require('./check-environments.js');
const EnhancedCodeExecutor = require('./enhanced-code-executor.js');

const dev = false;
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Create Next.js app
const app = next({ 
  dev, 
  hostname, 
  port,
  dir: path.join(__dirname, '.next')
});

const handle = app.getRequestHandler();

// Global instances
global.codeExecutor = new EnhancedCodeExecutor();
global.environmentChecker = new EnvironmentChecker();

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
    
    console.log('='.repeat(50));
    console.log('🚀 IdeaRpit - Competitive Programming Platform');
    console.log('='.repeat(50));
    console.log(\`🌐 Server running at http://\${hostname}:\${port}\`);
    console.log('📱 Open this URL in your browser to access the platform');
    console.log('='.repeat(50));
    
    // Check environments on startup
    console.log('🔍 Checking development environments...');
    global.environmentChecker.checkAll().then((results) => {
      const allInstalled = Object.values(results).every(result => result.installed);
      if (allInstalled) {
        console.log('🎉 All development environments are ready!');
      } else {
        console.log('⚠️  Some environments are missing. Check the logs above.');
        console.log('💡 Install missing environments for full functionality.');
      }
      console.log('='.repeat(50));
    });
    
    // Auto-open browser
    const { exec } = require('child_process');
    const start = process.platform === 'darwin' ? 'open' : 
                  process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(\`\${start} http://\${hostname}:\${port}\`);
  });
}).catch((ex) => {
  console.error('Failed to start server:', ex);
  process.exit(1);
});
`;

    const appPath = path.join(this.buildDir, 'app.js');
    fs.writeFileSync(appPath, appCode);
    console.log('✅ Standalone app created');
  }

  async copyNextBuild() {
    console.log('📋 Copying Next.js build files...');
    
    const nextBuildDir = path.join(this.projectRoot, '.next');
    const buildNextDir = path.join(this.buildDir, '.next');
    
    if (fs.existsSync(nextBuildDir)) {
      await this.copyDirectory(nextBuildDir, buildNextDir);
      console.log('✅ Next.js build files copied');
    } else {
      console.log('⚠️  Next.js build not found, building now...');
      await execAsync('npm run build', { cwd: this.projectRoot });
      await this.copyDirectory(nextBuildDir, buildNextDir);
      console.log('✅ Next.js built and copied');
    }
  }

  async copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async copyScripts() {
    console.log('📋 Copying scripts...');
    
    const scriptsToCopy = [
      'scripts/check-environments.js',
      'scripts/enhanced-code-executor.js'
    ];
    
    for (const script of scriptsToCopy) {
      const srcPath = path.join(this.projectRoot, script);
      const destPath = path.join(this.buildDir, path.basename(script));
      
      if (fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(\`✅ Copied \${path.basename(script)}\`);
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
      main: 'app.js',
      scripts: {
        start: 'node app.js'
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
      pkg: {
        assets: [
          '.next/**/*',
          'node_modules/**/*',
          'prisma/**/*'
        ],
        targets: [
          'node18-win-x64',
          'node18-macos-x64',
          'node18-linux-x64'
        ]
      }
    };
    
    const packagePath = path.join(this.buildDir, 'package.json');
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Package.json created');
  }

  async buildExecutable() {
    console.log('🔨 Building executable...');
    
    try {
      // Try to use global pkg first
      await execAsync(\`pkg app.js --targets node18-win-x64 --output idearpit.exe\`, { 
        cwd: this.buildDir 
      });
      console.log('✅ Windows executable created');
    } catch (error) {
      console.log('⚠️  Global pkg failed, trying local...');
      try {
        await execAsync(\`npx pkg app.js --targets node18-win-x64 --output idearpit.exe\`, { 
          cwd: this.buildDir 
        });
        console.log('✅ Windows executable created with npx');
      } catch (localError) {
        console.error('❌ Failed to create executable:', localError.message);
        throw localError;
      }
    }
  }

  async createDistribution() {
    console.log('📦 Creating distribution package...');
    
    const exePath = path.join(this.buildDir, 'idearpit.exe');
    const distExePath = path.join(this.distDir, 'idearpit.exe');
    
    if (fs.existsSync(exePath)) {
      fs.copyFileSync(exePath, distExePath);
      console.log('✅ Executable copied to distribution');
    }
    
    // Create startup script
    const startupScript = \`@echo off
title IdeaRpit - Competitive Programming Platform
color 0A

echo.
echo ========================================
echo    IdeaRpit - Competitive Programming
echo ========================================
echo.
echo Starting the platform...
echo.
echo The application will open in your browser automatically.
echo If it doesn't open, go to: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server.
echo.

idearpit.exe

echo.
echo Press any key to exit...
pause >nul
\`;
    
    const scriptPath = path.join(this.distDir, 'start-idearpit.bat');
    fs.writeFileSync(scriptPath, startupScript);
    
    // Copy environment installer
    const installerPath = path.join(this.projectRoot, 'install-environments.bat');
    const distInstallerPath = path.join(this.distDir, 'install-environments.bat');
    if (fs.existsSync(installerPath)) {
      fs.copyFileSync(installerPath, distInstallerPath);
      console.log('✅ Environment installer copied to distribution');
    }
    
    // Create README
    const readme = \`# IdeaRpit - Competitive Programming Platform

## Quick Start

1. **Run the application:**
   - Double-click \`start-idearpit.bat\`
   - Or run \`idearpit.exe\` directly

2. **Access the platform:**
   - The application will automatically open in your browser
   - Or manually go to http://localhost:3000

3. **Create an admin account:**
   - Click "Register" on the homepage
   - Select "Admin (Teacher/Judge)" role
   - Complete the registration

## System Requirements

### Required:
- **Windows 10/11** (64-bit)
- **Web Browser** (Chrome, Firefox, Edge, etc.)

### Optional (for code execution):
- **Python 3.x** - Auto-installable via \`install-environments.bat\`
- **C++ Compiler (g++)** - Auto-installable via \`install-environments.bat\`
- **Java JDK 8+** - Auto-installable via \`install-environments.bat\`

## Features

- **Multi-language Support**: JavaScript, Python, Java, C++
- **Real-time Code Execution**: Test your solutions instantly
- **Advanced Security**: Tab restrictions and anti-cheating measures
- **Admin Panel**: Create and manage problems
- **User Management**: Track warnings and disqualifications
- **Competition Rounds**: Time-limited competitions with round-specific problems
- **Leaderboard**: Track user performance
- **Auto-Environment Detection**: Automatically detects and installs missing languages

## Troubleshooting

### Environment Issues
If you see warnings about missing languages:
1. Run \`install-environments.bat\` to auto-install missing environments
2. Or install manually and ensure they're added to your system PATH
3. Restart the application

### Round Problems
- **Active Rounds**: Only problems from active rounds are shown
- **Round Ended**: When a round ends, problems are hidden automatically
- **Latest Round**: The system automatically shows the latest active round

### Port Already in Use
If port 3000 is busy:
1. Close other applications using port 3000
2. Or set PORT environment variable

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
    
    console.log('✅ Distribution package created');
  }

  async build() {
    try {
      console.log('🏗️  Building IdeaRpit Standalone Executable...\n');
      
      await this.ensureDirectories();
      await this.installPkg();
      await this.createStandaloneApp();
      await this.copyNextBuild();
      await this.copyScripts();
      await this.createPackageJson();
      await this.buildExecutable();
      await this.createDistribution();
      
      console.log('\n🎉 Build completed successfully!');
      console.log(\`📁 Executable created in: \${this.distDir}\`);
      console.log('\n🚀 To distribute the application:');
      console.log(\`   1. Copy the entire \${this.distDir} folder to target machines\`);
      console.log('   2. Run start-idearpit.bat or idearpit.exe directly');
      console.log('   3. The application will open automatically in the browser');
      
    } catch (error) {
      console.error('\n❌ Build failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const builder = new StandaloneExeBuilder();
  builder.build();
}

module.exports = StandaloneExeBuilder;
