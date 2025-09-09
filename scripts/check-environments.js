const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

class EnvironmentChecker {
  constructor() {
    this.results = {
      nodejs: { installed: false, version: null, error: null },
      python: { installed: false, version: null, error: null },
      cpp: { installed: false, version: null, error: null },
      java: { installed: false, version: null, error: null }
    };
    this.platform = os.platform();
    this.installPaths = {
      windows: {
        python: 'https://www.python.org/downloads/',
        cpp: 'https://www.mingw-w64.org/downloads/',
        java: 'https://adoptium.net/'
      },
      darwin: {
        python: 'brew install python3',
        cpp: 'xcode-select --install',
        java: 'brew install openjdk'
      },
      linux: {
        python: 'sudo apt-get install python3',
        cpp: 'sudo apt-get install g++',
        java: 'sudo apt-get install openjdk-11-jdk'
      }
    };
  }

  async checkNodeJS() {
    try {
      const { stdout } = await execAsync('node --version');
      this.results.nodejs = {
        installed: true,
        version: stdout.trim(),
        error: null
      };
      console.log('✅ Node.js:', stdout.trim());
    } catch (error) {
      this.results.nodejs = {
        installed: false,
        version: null,
        error: error.message
      };
      console.log('❌ Node.js: Not installed or not in PATH');
    }
  }

  async checkPython() {
    try {
      // Try python first, then python3
      let command = 'python --version';
      try {
        const { stdout } = await execAsync(command);
        this.results.python = {
          installed: true,
          version: stdout.trim(),
          error: null
        };
        console.log('✅ Python:', stdout.trim());
      } catch {
        // Try python3
        command = 'python3 --version';
        const { stdout } = await execAsync(command);
        this.results.python = {
          installed: true,
          version: stdout.trim(),
          error: null
        };
        console.log('✅ Python3:', stdout.trim());
      }
    } catch (error) {
      this.results.python = {
        installed: false,
        version: null,
        error: error.message
      };
      console.log('❌ Python: Not installed or not in PATH');
    }
  }

  async checkCpp() {
    try {
      // Check for g++ compiler
      const { stdout } = await execAsync('g++ --version');
      this.results.cpp = {
        installed: true,
        version: stdout.split('\n')[0].trim(),
        error: null
      };
      console.log('✅ C++ (g++):', stdout.split('\n')[0].trim());
    } catch (error) {
      this.results.cpp = {
        installed: false,
        version: null,
        error: error.message
      };
      console.log('❌ C++ (g++): Not installed or not in PATH');
    }
  }

  async checkJava() {
    try {
      const { stdout } = await execAsync('java -version');
      this.results.java = {
        installed: true,
        version: stdout.split('\n')[0].trim(),
        error: null
      };
      console.log('✅ Java:', stdout.split('\n')[0].trim());
    } catch (error) {
      this.results.java = {
        installed: false,
        version: null,
        error: error.message
      };
      console.log('❌ Java: Not installed or not in PATH');
    }
  }

  async installPython() {
    console.log('🐍 Installing Python...');
    try {
      if (this.platform === 'win32') {
        // For Windows, we'll download and run the installer
        const { exec } = require('child_process');
        const installerUrl = 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe';
        const installerPath = path.join(os.tmpdir(), 'python-installer.exe');
        
        console.log('📥 Downloading Python installer...');
        // Note: In a real implementation, you'd use a proper download library
        console.log('⚠️  Please download Python from: https://www.python.org/downloads/');
        console.log('   Make sure to check "Add Python to PATH" during installation');
        return false;
      } else if (this.platform === 'darwin') {
        await execAsync('brew install python3');
        return true;
      } else {
        await execAsync('sudo apt-get update && sudo apt-get install -y python3 python3-pip');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to install Python:', error.message);
      return false;
    }
  }

  async installCpp() {
    console.log('⚙️  Installing C++ compiler...');
    try {
      if (this.platform === 'win32') {
        console.log('⚠️  Please install MinGW-w64 from: https://www.mingw-w64.org/downloads/');
        console.log('   Or install Visual Studio Build Tools');
        return false;
      } else if (this.platform === 'darwin') {
        await execAsync('xcode-select --install');
        return true;
      } else {
        await execAsync('sudo apt-get update && sudo apt-get install -y g++');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to install C++ compiler:', error.message);
      return false;
    }
  }

  async installJava() {
    console.log('☕ Installing Java...');
    try {
      if (this.platform === 'win32') {
        console.log('⚠️  Please download Java from: https://adoptium.net/');
        console.log('   Make sure to add Java to PATH during installation');
        return false;
      } else if (this.platform === 'darwin') {
        await execAsync('brew install openjdk');
        return true;
      } else {
        await execAsync('sudo apt-get update && sudo apt-get install -y openjdk-11-jdk');
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to install Java:', error.message);
      return false;
    }
  }

  async addToPath(program, pathToAdd) {
    try {
      if (this.platform === 'win32') {
        // For Windows, we'll add to user PATH
        const { exec } = require('child_process');
        await execAsync(`setx PATH "%PATH%;${pathToAdd}"`);
        console.log(`✅ Added ${program} to PATH`);
      } else {
        // For Unix-like systems, add to shell profile
        const shellProfile = os.homedir() + '/.bashrc';
        const pathLine = `export PATH="$PATH:${pathToAdd}"`;
        
        if (fs.existsSync(shellProfile)) {
          const content = fs.readFileSync(shellProfile, 'utf8');
          if (!content.includes(pathLine)) {
            fs.appendFileSync(shellProfile, `\n${pathLine}\n`);
            console.log(`✅ Added ${program} to PATH in ~/.bashrc`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Failed to add ${program} to PATH:`, error.message);
    }
  }

  async autoInstall() {
    console.log('🔧 Auto-installing missing environments...\n');
    
    const installPromises = [];
    
    if (!this.results.python.installed) {
      installPromises.push(this.installPython());
    }
    
    if (!this.results.cpp.installed) {
      installPromises.push(this.installCpp());
    }
    
    if (!this.results.java.installed) {
      installPromises.push(this.installJava());
    }
    
    if (installPromises.length > 0) {
      const results = await Promise.all(installPromises);
      console.log('\n🔄 Re-checking environments after installation...\n');
      
      // Re-check after installation
      await this.checkPython();
      await this.checkCpp();
      await this.checkJava();
    }
  }

  async checkAll(autoInstall = false) {
    console.log('🔍 Checking development environments...\n');
    
    await this.checkNodeJS();
    await this.checkPython();
    await this.checkCpp();
    await this.checkJava();
    
    console.log('\n📊 Environment Check Summary:');
    console.log('============================');
    
    const allInstalled = Object.values(this.results).every(result => result.installed);
    
    if (allInstalled) {
      console.log('🎉 All required environments are installed and ready!');
    } else {
      console.log('⚠️  Some environments are missing:');
      Object.entries(this.results).forEach(([lang, result]) => {
        if (!result.installed) {
          console.log(`   - ${lang.toUpperCase()}: ${result.error}`);
        }
      });
      
      if (autoInstall) {
        console.log('\n🔧 Attempting auto-installation...');
        await this.autoInstall();
      } else {
        console.log('\n💡 To auto-install missing environments, run:');
        console.log('   npm run check:env -- --install');
      }
    }
    
    return this.results;
  }

  getResults() {
    return this.results;
  }
}

// Export for use in other modules
module.exports = EnvironmentChecker;

// Run if called directly
if (require.main === module) {
  const checker = new EnvironmentChecker();
  const args = process.argv.slice(2);
  const autoInstall = args.includes('--install') || args.includes('-i');
  
  checker.checkAll(autoInstall).then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Error during environment check:', error);
    process.exit(1);
  });
}
