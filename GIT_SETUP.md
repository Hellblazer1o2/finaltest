# Git Setup Guide

## 🚀 Quick Start

Your code is now ready to push to Git! Here's how to set it up:

### Option 1: Use the Push Script (Recommended)
```bash
# Make sure the script is executable
chmod +x push.sh

# Run the push script
./push.sh
```

### Option 2: Manual Git Commands
```bash
# Add all changes
git add .

# Commit with a message
git commit -m "Your commit message"

# Push to remote
git push origin main
```

## 🌐 Setting Up a Remote Repository

### GitHub (Recommended)
1. Go to [GitHub.com](https://github.com)
2. Click "New Repository"
3. Name it `igenium-ide` or similar
4. Don't initialize with README (we already have one)
5. Copy the repository URL

### Add Remote and Push
```bash
# Add your GitHub repository as origin
git remote add origin https://github.com/YOUR_USERNAME/igenium-ide.git

# Push your code
git push -u origin main
```

### GitLab
```bash
# Add GitLab repository
git remote add origin https://gitlab.com/YOUR_USERNAME/igenium-ide.git

# Push your code
git push -u origin main
```

### Bitbucket
```bash
# Add Bitbucket repository
git remote add origin https://bitbucket.org/YOUR_USERNAME/igenium-ide.git

# Push your code
git push -u origin main
```

## 📁 What's Included

Your Git repository includes:
- ✅ **Source Code**: All TypeScript/React files
- ✅ **Configuration**: Package.json, Next.js config, etc.
- ✅ **Database Schema**: Prisma schema and migrations
- ✅ **Documentation**: README, setup guides
- ✅ **Scripts**: Build and deployment scripts
- ❌ **node_modules**: Excluded (will be installed with `npm install`)
- ❌ **Build Files**: Excluded (generated during build)
- ❌ **Test Files**: Excluded (temporary test files)

## 🔄 Daily Workflow

### Making Changes
1. Edit your code
2. Test your changes
3. Run `./push.sh` to commit and push

### Pulling Changes
```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install
```

## 🛠️ Troubleshooting

### If Push Fails
```bash
# Check remote URL
git remote -v

# Update remote URL if needed
git remote set-url origin NEW_URL

# Force push (use carefully)
git push -f origin main
```

### If You Need to Reset
```bash
# Reset to last commit
git reset --hard HEAD

# Reset to remote
git reset --hard origin/main
```

## 📝 Commit Messages

Good commit message format:
```
Brief description of changes

- Detailed bullet point 1
- Detailed bullet point 2
- Fix for specific issue
```

Example:
```
Add client-side Python execution

- Implemented Pyodide integration
- Added fallback executor for reliability
- Fixed syntax error handling
- Updated UI to show execution mode
```

## 🎯 Next Steps

1. **Set up remote repository** (GitHub/GitLab/Bitbucket)
2. **Add remote origin** to your local repository
3. **Push your code** using `./push.sh` or manual commands
4. **Share your repository** with others
5. **Set up CI/CD** for automatic deployment

Your Igenium IDE is now ready for version control! 🚀
