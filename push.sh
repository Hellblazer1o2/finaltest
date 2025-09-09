#!/bin/bash

# Quick push script for Igenium IDE
echo "🚀 Pushing Igenium IDE to Git..."

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo "❌ Not a git repository. Initializing..."
    git init
fi

# Add all important files
echo "📁 Adding files..."
git add .

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo "✅ No changes to commit"
    exit 0
fi

# Commit with timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
echo "💾 Committing changes..."
git commit -m "Update Igenium IDE - $TIMESTAMP

- Added client-side code execution for Python, C++, JavaScript, and Java
- Implemented fallback executors for reliable execution
- Enhanced problem-solving interface with real-time execution
- Added comprehensive error handling and debugging
- Improved user experience with instant feedback"

# Check if remote exists
if git remote | grep -q "origin"; then
    echo "🌐 Pushing to remote..."
    git push origin main
else
    echo "⚠️  No remote origin found. To add a remote:"
    echo "   git remote add origin <your-repo-url>"
    echo "   git push -u origin main"
fi

echo "✅ Done! Your code is now safely stored in Git."
