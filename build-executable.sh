#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "========================================"
echo "    IdeaRpit - Building Executable"
echo "========================================"
echo -e "${NC}"

echo -e "${YELLOW}Step 1: Checking system requirements...${NC}"
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}ERROR: Node.js is not installed or not in PATH${NC}"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}Node.js: OK${NC}"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}ERROR: npm is not available${NC}"
    exit 1
fi

echo -e "${GREEN}npm: OK${NC}"

echo
echo -e "${YELLOW}Step 2: Installing dependencies...${NC}"
echo
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Failed to install dependencies${NC}"
    exit 1
fi

echo
echo -e "${YELLOW}Step 3: Setting up database...${NC}"
echo
npm run db:setup
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}WARNING: Database setup failed, but continuing...${NC}"
fi

echo
echo -e "${YELLOW}Step 4: Checking development environments...${NC}"
echo
npm run check:env

echo
echo -e "${YELLOW}Step 4.1: Auto-installing missing environments (if needed)...${NC}"
echo
npm run install:env

echo
echo -e "${YELLOW}Step 5: Building Next.js application...${NC}"
echo
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Next.js build failed${NC}"
    exit 1
fi

echo
echo -e "${YELLOW}Step 6: Creating standalone executable...${NC}"
echo
npm run build:standalone
if [ $? -ne 0 ]; then
    echo -e "${RED}ERROR: Executable creation failed${NC}"
    exit 1
fi

echo
echo -e "${GREEN}========================================"
echo "    Build Completed Successfully!"
echo "========================================${NC}"
echo
echo "The executable has been created in the 'dist' folder."
echo
echo "To distribute the application:"
echo "1. Copy the entire 'dist' folder to target machines"
echo "2. Run the executable or startup script"
echo "3. The application will open automatically in the browser"
echo
