# Building IdeaRpit Executable

This guide explains how to create a standalone executable of the IdeaRpit competitive programming platform.

## 🎯 Overview

The executable build process creates a self-contained application that includes:
- ✅ **Environment Detection**: Automatically checks for Python, Node.js, C++, and Java
- ✅ **Multi-language Support**: JavaScript, Python, Java, C++ with proper compilation
- ✅ **Standalone Server**: No external dependencies required
- ✅ **Auto-browser Launch**: Opens automatically in the default browser
- ✅ **Cross-platform**: Works on Windows, macOS, and Linux

## 🚀 Quick Start

### Windows
```bash
# Run the automated build script
build-executable.bat
```

### Linux/macOS
```bash
# Make script executable (Linux/macOS only)
chmod +x build-executable.sh

# Run the automated build script
./build-executable.sh
```

### Manual Build
```bash
# Install dependencies
npm install

# Setup database
npm run db:setup

# Check environments
npm run check:env

# Build Next.js app
npm run build

# Create executable
npm run build:standalone
```

## 📋 System Requirements

### Required for Building
- **Node.js 18+** - Download from [nodejs.org](https://nodejs.org/)
- **npm** - Comes with Node.js
- **Git** - For version control (optional)

### Required for Target Machines
- **Windows 10/11** (64-bit) or **macOS 10.15+** or **Linux**
- **Web Browser** (Chrome, Firefox, Safari, Edge)

### Optional for Full Functionality
- **Python 3.x** - For Python code execution
- **C++ Compiler (g++)** - For C++ code execution
- **Java JDK 8+** - For Java code execution

## 🔧 Build Process Details

### 1. Environment Checker (`scripts/check-environments.js`)
- ✅ Checks Node.js installation and version
- ✅ Checks Python installation (python or python3)
- ✅ Checks C++ compiler (g++)
- ✅ Checks Java installation
- ✅ Provides detailed error messages for missing components

### 2. Enhanced Code Executor (`scripts/enhanced-code-executor.js`)
- ✅ **JavaScript**: Direct execution with Node.js
- ✅ **Python**: Direct execution with Python interpreter
- ✅ **Java**: Automatic compilation with `javac`, then execution
- ✅ **C++**: Automatic compilation with `g++`, then execution
- ✅ **Error Handling**: Comprehensive error reporting
- ✅ **Complexity Analysis**: Automatic time/space complexity detection
- ✅ **Cleanup**: Automatic file cleanup after execution

### 3. Standalone Server (`scripts/create-standalone-exe.js`)
- ✅ **Next.js Integration**: Bundles the entire Next.js application
- ✅ **Database Setup**: Includes SQLite database with admin user
- ✅ **Auto-browser Launch**: Opens application automatically
- ✅ **Environment Detection**: Checks and reports language availability
- ✅ **Port Management**: Uses PORT environment variable or defaults to 3000

## 📁 Output Structure

After building, you'll find:

```
dist/
├── idearpit.exe          # Main executable (Windows)
├── start-idearpit.bat    # Startup script (Windows)
├── README.md             # User documentation
└── build/                # Build artifacts
    ├── app.js            # Standalone server
    ├── package.json      # Dependencies
    ├── check-environments.js
    ├── enhanced-code-executor.js
    └── .next/            # Next.js build files
```

## 🎮 Usage

### For End Users
1. **Download** the `dist` folder
2. **Run** `start-idearpit.bat` (Windows) or the executable directly
3. **Access** the application at http://localhost:3000
4. **Register** as an admin to create problems

### For Administrators
1. **Create Admin Account**: Register with "Admin (Teacher/Judge)" role
2. **Create Problems**: Use the admin panel to add coding problems
3. **Manage Users**: Monitor user activity and warnings
4. **View Submissions**: See all code submissions with complexity analysis

## 🔍 Environment Detection

The application automatically detects available programming languages:

### ✅ Fully Supported
- **JavaScript**: Always available (Node.js required)
- **Python**: Detected automatically (python or python3)

### ⚠️ Requires Installation
- **C++**: Requires g++ compiler
  - Windows: Install MinGW-w64 or Visual Studio Build Tools
  - macOS: Install Xcode Command Line Tools (`xcode-select --install`)
  - Linux: `sudo apt-get install g++` (Ubuntu/Debian)

- **Java**: Requires JDK 8+
  - Download from [Adoptium](https://adoptium.net/)
  - Ensure `java` and `javac` are in PATH

## 🛠️ Troubleshooting

### Build Issues

**Node.js not found**
```bash
# Install Node.js from https://nodejs.org/
# Verify installation
node --version
npm --version
```

**Build fails**
```bash
# Clear cache and reinstall
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**Database setup fails**
```bash
# Manual database setup
npm run db:setup-only
```

### Runtime Issues

**Port 3000 in use**
```bash
# Set different port
set PORT=3001
idearpit.exe
```

**Languages not detected**
- Ensure languages are installed and in PATH
- Restart the application after installing new languages
- Check the console output for specific error messages

**Browser doesn't open**
- Manually navigate to http://localhost:3000
- Check firewall settings
- Ensure no other application is using the port

## 🔒 Security Features

The executable includes all security features:
- ✅ **Tab Restrictions**: Prevents tab switching during problem solving
- ✅ **Developer Tools Blocking**: Disables F12, Ctrl+Shift+I, etc.
- ✅ **Right-click Disabled**: Prevents context menu access
- ✅ **Admin Exemptions**: Admins are exempt from all restrictions
- ✅ **Warning System**: Automatic warnings and disqualification
- ✅ **Session Management**: Secure JWT-based authentication

## 📊 Performance

- **Startup Time**: ~2-3 seconds
- **Memory Usage**: ~100-200MB
- **Code Execution**: <2 seconds per test case
- **Database**: SQLite (fast, no external dependencies)

## 🚀 Distribution

### Single Machine
- Copy the entire `dist` folder
- Run the executable or startup script

### Network Deployment
- Place executable on a server
- Set PORT environment variable
- Access via network IP address

### Educational Institutions
- Deploy on multiple machines
- Each instance runs independently
- No network dependencies required

## 📝 Development

### Modifying the Build
1. Edit scripts in the `scripts/` folder
2. Update `package.json` dependencies
3. Rebuild with `npm run build:standalone`

### Adding Languages
1. Update `enhanced-code-executor.js`
2. Add compilation logic
3. Update environment checker
4. Rebuild executable

### Customizing UI
1. Modify Next.js components
2. Run `npm run build`
3. Rebuild executable

## 📄 License

This project is licensed under the MIT License. The executable includes all necessary dependencies and can be distributed freely.

## 🆘 Support

For issues:
1. Check the console output for error messages
2. Verify all system requirements are met
3. Ensure languages are properly installed
4. Check firewall and antivirus settings

---

**IdeaRpit** - Empowering competitive programming with advanced technology! 🚀
