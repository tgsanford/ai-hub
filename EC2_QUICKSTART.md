# EC2 Quick Reference

## Initial Setup (One-time)
```bash
# Clone repository
git clone https://github.com/tgsanford/ai-hub.git
cd ai-hub

# Create environment file
echo "NODE_ENV=production" > .env
echo "PORT=8020" >> .env
echo "NODE_TLS_REJECT_UNAUTHORIZED=0" >> .env

# Install dependencies
npm install --legacy-peer-deps

# Build
npm run build

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 startup  # Follow instructions to enable auto-start
pm2 save
```

## Deploy Updates
```bash
cd ai-hub
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

## Common Commands

### Application Management
```bash
# View status
pm2 status

# View logs (live)
pm2 logs ai-hub

# Restart
pm2 restart ai-hub

# Stop
pm2 stop ai-hub

# Delete from PM2
pm2 delete ai-hub
```

### Troubleshooting
```bash
# Check if running
sudo netstat -tlnp | grep 8020

# View recent logs
pm2 logs ai-hub --lines 50

# Check Node process
ps aux | grep node

# Test API locally
curl http://localhost:8020/api/settings

# Kill process on port 8020
lsof -ti:8020 | xargs kill -9
```

### Manual Start (without PM2)
```bash
PORT=8020 NODE_ENV=production node dist/api/server.js
```

## Environment Variables
Edit `.env` file:
```bash
nano .env
```

Then restart:
```bash
pm2 restart ai-hub
```

## Data Backup
```bash
# Backup data
cp .data/store.json .data/store.json.backup

# Restore data
cp .data/store.json.backup .data/store.json
pm2 restart ai-hub
```

## Security Group
**Port 8020** must be open in AWS Console:
- EC2 → Security Groups → Inbound Rules → Add Rule
- Type: Custom TCP, Port: 8020, Source: 0.0.0.0/0

## Access URL
```
http://YOUR-EC2-PUBLIC-IP:8020
```

Find your EC2 IP:
```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```
