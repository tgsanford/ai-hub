# EC2 Deployment Guide - AI Hub on Port 8020

## Prerequisites on EC2 Instance

1. **Node.js** (v18 or higher)
   ```bash
   # Check if installed
   node --version
   
   # If not installed (Amazon Linux 2023):
   sudo dnf install nodejs -y
   
   # Or use nvm for specific version:
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   source ~/.bashrc
   nvm install 20
   ```

2. **Git**
   ```bash
   # Should be pre-installed, but verify:
   git --version
   
   # If needed:
   sudo dnf install git -y
   ```

3. **PM2** (recommended for process management)
   ```bash
   npm install -g pm2
   ```

## Deployment Steps

### 1. Clone Repository
```bash
# Navigate to your desired directory
cd /home/ec2-user

# Clone the repository
git clone https://github.com/tgsanford/ai-hub.git
cd ai-hub
```

### 2. Configure Environment Variables
```bash
# Create .env file
cat > .env << 'EOF'
NODE_ENV=production
PORT=8020
NODE_TLS_REJECT_UNAUTHORIZED=0
EOF

# Add your OpenAI API key (optional, can also set via UI)
# echo "OPENAI_API_KEY=sk-your-key-here" >> .env
```

### 3. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 4. Build for Production
```bash
# This builds both the API (TypeScript) and Angular frontend
npm run build

# Expected output:
# - API compiled to: dist/api/
# - Angular built to: dist/web/browser/
```

### 5. Start the Application

#### Option A: Using PM2 (Recommended)
```bash
# Start with PM2
pm2 start dist/api/server.js --name ai-hub --env production

# Set to auto-start on reboot
pm2 startup
pm2 save

# View logs
pm2 logs ai-hub

# Check status
pm2 status

# Restart after updates
pm2 restart ai-hub
```

#### Option B: Direct Node
```bash
# Run directly (will stop when SSH session ends)
PORT=8020 NODE_ENV=production node dist/api/server.js

# Or use nohup to keep running
nohup PORT=8020 NODE_ENV=production node dist/api/server.js > app.log 2>&1 &
```

### 6. Verify It's Running
```bash
# Check if port 8020 is listening
sudo netstat -tlnp | grep 8020

# Or using ss command
sudo ss -tlnp | grep 8020

# Test locally on EC2
curl http://localhost:8020/api/settings
```

## Security Group Configuration

**IMPORTANT:** Open port 8020 in your EC2 Security Group:

1. Go to AWS Console → EC2 → Security Groups
2. Select your instance's security group
3. Edit Inbound Rules
4. Add Rule:
   - **Type:** Custom TCP
   - **Port:** 8020
   - **Source:** 
     - `0.0.0.0/0` (public access) OR
     - Your specific IP/CIDR block (more secure)
5. Save rules

## Accessing the Application

Once deployed and security group is configured:
```
http://your-ec2-public-ip:8020
```

Or if you have a domain:
```
http://yourdomain.com:8020
```

## Updating the Application

```bash
cd /home/ec2-user/ai-hub

# Pull latest changes
git pull origin main

# Reinstall dependencies if package.json changed
npm install --legacy-peer-deps

# Rebuild
npm run build

# Restart (if using PM2)
pm2 restart ai-hub

# Or restart manual process
pkill -f "node dist/api/server.js"
PORT=8020 NODE_ENV=production node dist/api/server.js &
```

## Monitoring & Logs

### With PM2:
```bash
# Real-time logs
pm2 logs ai-hub

# Last 100 lines
pm2 logs ai-hub --lines 100

# Monitor CPU/Memory
pm2 monit
```

### Without PM2:
```bash
# If using nohup
tail -f app.log

# Check if process is running
ps aux | grep "node dist/api/server.js"
```

## Troubleshooting

### App won't start
```bash
# Check Node version
node --version  # Should be v18+

# Check if port is already in use
sudo lsof -i :8020

# View detailed error logs
pm2 logs ai-hub --err
```

### Can't access from browser
1. Verify app is running: `sudo netstat -tlnp | grep 8020`
2. Check security group has port 8020 open
3. Check firewall (if enabled): `sudo firewall-cmd --list-all`
4. Test from EC2 itself: `curl http://localhost:8020/api/settings`

### Build fails
```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Try build again
npm run build
```

## Data Persistence

Application data is stored in:
```
/home/ec2-user/ai-hub/.data/store.json
```

**Backup this file regularly!**

```bash
# Create backup
cp .data/store.json .data/store.json.backup

# Or automated daily backup
echo "0 2 * * * cp /home/ec2-user/ai-hub/.data/store.json /home/ec2-user/ai-hub/.data/store.json.\$(date +\%Y\%m\%d)" | crontab -
```

## Optional: Nginx Reverse Proxy

To serve on port 80 without `:8020` in URL:

```bash
# Install nginx
sudo dnf install nginx -y

# Configure
sudo tee /etc/nginx/conf.d/ai-hub.conf << 'EOF'
server {
    listen 80;
    server_name your-domain-or-ip;

    location / {
        proxy_pass http://localhost:8020;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
EOF

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Open port 80 in security group instead of 8020
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Set to `production` for deployment |
| `PORT` | No | `3000` | Port to listen on (use `8020` for EC2) |
| `OPENAI_API_KEY` | No | - | OpenAI API key (can also set via UI) |
| `NODE_TLS_REJECT_UNAUTHORIZED` | No | `1` | Set to `0` if behind corporate proxy |
