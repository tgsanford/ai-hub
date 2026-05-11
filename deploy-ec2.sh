#!/bin/bash

# AI Hub - EC2 Deployment Script
# This script automates the deployment process on EC2

set -e  # Exit on any error

echo "🚀 Starting AI Hub Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the ai-hub directory."
    exit 1
fi

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code from GitHub...${NC}"
git pull origin main

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Build application
echo -e "${YELLOW}🔨 Building application...${NC}"
npm run build

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}🔄 Restarting application with PM2...${NC}"
    
    # Check if app is already running
    if pm2 list | grep -q "ai-hub"; then
        pm2 restart ai-hub
        echo -e "${GREEN}✅ Application restarted successfully${NC}"
    else
        # Create logs directory
        mkdir -p logs
        
        # Start with PM2
        pm2 start ecosystem.config.cjs
        pm2 save
        echo -e "${GREEN}✅ Application started successfully${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}📊 Application Status:${NC}"
    pm2 list
    echo ""
    echo -e "${GREEN}📝 View logs with: pm2 logs ai-hub${NC}"
    
else
    echo -e "${YELLOW}⚠️  PM2 not found. Starting with Node directly...${NC}"
    echo -e "${YELLOW}   Install PM2 for better process management: npm install -g pm2${NC}"
    
    # Kill any existing process on port 8020
    PID=$(lsof -ti:8020 || true)
    if [ ! -z "$PID" ]; then
        echo "Killing existing process on port 8020..."
        kill -9 $PID
    fi
    
    # Start with nohup
    nohup PORT=8020 NODE_ENV=production node dist/api/server.js > app.log 2>&1 &
    echo -e "${GREEN}✅ Application started (PID: $!)${NC}"
    echo -e "${GREEN}📝 View logs with: tail -f app.log${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Access your application at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo 'your-ec2-ip'):8020"
echo ""
echo "⚠️  Make sure port 8020 is open in your EC2 Security Group!"
