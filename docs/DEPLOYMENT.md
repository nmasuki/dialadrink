# Deployment Guide

## Overview
This guide covers the complete deployment process for Dial A Drink Kenya from development to production, including server setup, configuration, monitoring, and maintenance procedures.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Environment Configuration](#environment-configuration)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Web Server Configuration](#web-server-configuration)
7. [SSL/TLS Setup](#ssltls-setup)
8. [Process Management](#process-management)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Backup and Recovery](#backup-and-recovery)
11. [Performance Optimization](#performance-optimization)
12. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04 LTS or CentOS 8+
- **RAM**: Minimum 2GB, Recommended 4GB+
- **CPU**: Minimum 2 cores, Recommended 4 cores
- **Storage**: Minimum 20GB SSD
- **Network**: Static IP address, Domain name configured

### Required Software
- Node.js 14.x or 16.x
- MongoDB 4.4+
- Nginx 1.18+
- PM2 Process Manager
- Git 2.x
- Certbot (for SSL certificates)

## Server Setup

### 1. Initial Server Configuration

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential software-properties-common

# Create application user
sudo adduser dialadrink
sudo usermod -aG sudo dialadrink

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. Node.js Installation

```bash
# Install Node.js 16.x via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should show v16.x.x
npm --version   # Should show 8.x.x

# Install global packages
sudo npm install -g pm2
```

### 3. MongoDB Installation

```bash
# Import MongoDB GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list

# Install MongoDB
sudo apt update
sudo apt install -y mongodb-org

# Start and enable MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
sudo systemctl status mongod
```

### 4. Nginx Installation

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify installation
sudo systemctl status nginx
```

## Environment Configuration

### 1. Create Production Environment File

Switch to application user and create environment configuration:

```bash
# Switch to application user
sudo su - dialadrink

# Create application directory
mkdir -p /home/dialadrink/apps
cd /home/dialadrink/apps

# Clone repository
git clone https://github.com/your-org/dial-a-drink-kenya.git dialadrink
cd dialadrink

# Create production environment file
cp .env.example .env.production
```

### 2. Configure Environment Variables

Edit `.env.production` with production values:

```bash
# Application Configuration
NODE_ENV=production
HTTP_PORT=4000
SITE_NAME=Dial A Drink Kenya
SITE_URL=https://dialadrinkkenya.com
SITE_LOGO=https://res.cloudinary.com/nmasuki/image/upload/logo.png
ADMIN_LOGO=https://res.cloudinary.com/nmasuki/image/upload/logo-email.gif

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/dialadrink_prod

# Session Configuration  
SESSION_SECRET=your-super-secure-session-secret-here

# Cloudinary Configuration (Image hosting)
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration (Zoho/Gmail/Custom SMTP)
SMTP_SERVICE=Zoho
SMTP_HOST=smtp.zoho.com
SMTP_PORT=587
SMTP_USER=order@dialadrinkkenya.com
SMTP_PASS=your_email_password
EMAIL_FROM=order@dialadrinkkenya.com

# Payment Gateway Configuration

# M-Pesa Configuration
MPESA_KEY=your_mpesa_consumer_key
MPESA_SECRET=your_mpesa_consumer_secret
MPESA_SHOTCODE=your_shortcode
MPESA_InitiatorName=your_initiator_name
LNM_Shortcode=your_lnm_shortcode  
LNM_PassKey=your_lnm_passkey

# PesaPal Configuration
PESAPAL_KEY=your_pesapal_consumer_key
PESAPAL_SECRET=your_pesapal_consumer_secret

# CyberSource Configuration (if used)
CYBERSOURCE_MERCHANT_ID=your_merchant_id
CYBERSOURCE_API_KEY=your_api_key
CYBERSOURCE_SECRET=your_secret_key

# SMS Service Configuration

# Africa's Talking
AFRICASTALKING_USERNAME=your_username
AFRICASTALKING_API_KEY=your_api_key

# Other SMS providers
MOVESMS_API_KEY=your_movesms_key
MYSMS_API_KEY=your_mysms_key
SMSAFRICA_API_KEY=your_smsafrica_key

# External API Keys
GOOGLE_API_KEY1=your_google_api_key
GOOGLE_API_KEY2=your_backup_google_key

# URL Shortening
BITLY_ACCESS_TOKEN=your_bitly_token

# Location Services
OKHI_KEY=your_okhi_key
OKHI_BRANCH=your_okhi_branch_id
OKHI_SERVER_KEY=your_okhi_server_key

# Business Configuration
CONTACT_PHONE_NUMBER=254723688108
DEVELOPER_EMAIL=admin@dialadrinkkenya.com
SUPPORT_EMAIL=support@dialadrinkkenya.com

# Firebase Configuration (for push notifications)
FCM_SERVER_KEY=your_fcm_server_key
FCM_SENDER_ID=your_fcm_sender_id

# Security Configuration
ADMIN_PASSWORD=your-secure-admin-password
API_SECRET_KEY=your-api-secret-key

# Performance Configuration
MAX_CONCURRENT_REQUESTS=100
CACHE_TTL=300
```

### 3. Secure Environment File

```bash
# Set proper permissions
chmod 600 .env.production
chown dialadrink:dialadrink .env.production

# Create symlink for application
ln -sf .env.production .env
```

## Database Setup

### 1. Configure MongoDB Security

```bash
# Create MongoDB admin user
sudo mongo
```

```javascript
// In MongoDB shell
use admin
db.createUser({
  user: "admin",
  pwd: "your-secure-admin-password",
  roles: ["root"]
});

// Create application database and user
use dialadrink_prod
db.createUser({
  user: "dialadrink",
  pwd: "your-secure-app-password", 
  roles: [
    { role: "readWrite", db: "dialadrink_prod" },
    { role: "dbAdmin", db: "dialadrink_prod" }
  ]
});

exit
```

### 2. Enable MongoDB Authentication

Edit MongoDB configuration:
```bash
sudo nano /etc/mongod.conf
```

Add security configuration:
```yaml
security:
  authorization: enabled
```

Restart MongoDB:
```bash
sudo systemctl restart mongod
```

### 3. Update Database Connection String

Update `.env` with authenticated connection:
```bash
MONGODB_URI=mongodb://dialadrink:your-secure-app-password@localhost:27017/dialadrink_prod?authSource=dialadrink_prod
```

## Application Deployment

### 1. Install Dependencies

```bash
# Install production dependencies
npm ci --only=production

# Install PM2 globally if not already installed
sudo npm install -g pm2
```

### 2. Build Assets

```bash
# Install dev dependencies temporarily for build
npm install

# Run Grunt build tasks
npx grunt

# Remove dev dependencies
npm prune --production
```

### 3. Create PM2 Ecosystem Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'dialadrink-web',
      script: 'app.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: '/home/dialadrink/logs/web-error.log',
      out_file: '/home/dialadrink/logs/web-out.log',
      log_file: '/home/dialadrink/logs/web-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024'
    },
    {
      name: 'dialadrink-workers',
      script: 'app-workers.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/home/dialadrink/logs/workers-error.log',
      out_file: '/home/dialadrink/logs/workers-out.log',
      log_file: '/home/dialadrink/logs/workers-combined.log',
      time: true,
      cron_restart: '0 2 * * *', // Restart daily at 2 AM
      max_memory_restart: '512M'
    }
  ]
};
```

### 4. Create Log Directory

```bash
mkdir -p /home/dialadrink/logs
```

### 5. Start Applications

```bash
# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
# Follow the instructions to run the generated command with sudo

# Check status
pm2 status
pm2 logs
```

## Web Server Configuration

### 1. Create Nginx Virtual Host

Create Nginx configuration:
```bash
sudo nano /etc/nginx/sites-available/dialadrinkkenya.com
```

Add configuration:
```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/m;
limit_req_zone $binary_remote_addr zone=general:10m rate=60r/m;

# Upstream for Node.js application
upstream dialadrink_app {
    least_conn;
    server 127.0.0.1:4000;
    # Add more servers for load balancing
    # server 127.0.0.1:4001;
    # server 127.0.0.1:4002;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name dialadrinkkenya.com www.dialadrinkkenya.com;
    return 301 https://dialadrinkkenya.com$request_uri;
}

# HTTPS configuration
server {
    listen 443 ssl http2;
    server_name dialadrinkkenya.com www.dialadrinkkenya.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/dialadrinkkenya.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dialadrinkkenya.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Root directory
    root /home/dialadrink/apps/dialadrink/public;
    index index.html;

    # Logging
    access_log /var/log/nginx/dialadrink_access.log;
    error_log /var/log/nginx/dialadrink_error.log;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API endpoints with rate limiting
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://dialadrink_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Admin interface
    location /admin/ {
        limit_req zone=general burst=20 nodelay;
        proxy_pass http://dialadrink_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # All other requests
    location / {
        limit_req zone=general burst=20 nodelay;
        try_files $uri $uri/ @proxy;
    }

    # Proxy fallback for dynamic content
    location @proxy {
        proxy_pass http://dialadrink_app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        access_log off;
        proxy_pass http://dialadrink_app;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
        access_log off;
    }

    location ~ /(package\.json|\.env|ecosystem\.config\.js)$ {
        deny all;
        access_log off;
    }
}
```

### 2. Enable Site and Test Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/dialadrinkkenya.com /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## SSL/TLS Setup

### 1. Install Certbot

```bash
# Install snapd
sudo apt install snapd
sudo snap install core; sudo snap refresh core

# Install certbot
sudo snap install --classic certbot

# Create symlink
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 2. Obtain SSL Certificate

```bash
# Get certificate for domain
sudo certbot certonly --webroot -w /home/dialadrink/apps/dialadrink/public -d dialadrinkkenya.com -d www.dialadrinkkenya.com

# Test certificate renewal
sudo certbot renew --dry-run
```

### 3. Setup Auto-Renewal

```bash
# Add cron job for automatic renewal
sudo crontab -e
```

Add line:
```bash
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## Process Management

### 1. PM2 Monitoring Dashboard

```bash
# Install PM2 web dashboard (optional)
pm2 install pm2-server-monit

# View monitoring interface
pm2 monit
```

### 2. PM2 Log Management

```bash
# Install log rotation module
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 3. Application Health Checks

Create health check script:
```bash
nano /home/dialadrink/scripts/health-check.sh
```

```bash
#!/bin/bash
# Application health check script

APP_URL="http://localhost:4000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $APP_URL)

if [ $RESPONSE -eq 200 ]; then
    echo "$(date): Application is healthy"
    exit 0
else
    echo "$(date): Application unhealthy, restarting..."
    pm2 restart dialadrink-web
    exit 1
fi
```

```bash
chmod +x /home/dialadrink/scripts/health-check.sh

# Add to cron for regular health checks
crontab -e
```

Add:
```bash
*/5 * * * * /home/dialadrink/scripts/health-check.sh >> /home/dialadrink/logs/health-check.log 2>&1
```

## Monitoring and Logging

### 1. System Monitoring with Netdata

```bash
# Install Netdata for system monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)

# Configure Netdata for Node.js monitoring
sudo nano /etc/netdata/node.d.conf
```

### 2. Application Logging

Configure Winston logger in application:
```javascript
// Add to app-init.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: '/home/dialadrink/logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/home/dialadrink/logs/combined.log' 
    })
  ]
});

// Export logger for use in application
global.logger = logger;
```

### 3. Log Rotation Configuration

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/dialadrink
```

```bash
/home/dialadrink/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0644 dialadrink dialadrink
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/dialadrink*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    postrotate
        systemctl reload nginx
    endscript
}
```

## Backup and Recovery

### 1. Database Backup Script

Create backup script:
```bash
nano /home/dialadrink/scripts/backup-database.sh
```

```bash
#!/bin/bash
# Database backup script

BACKUP_DIR="/home/dialadrink/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="dialadrink_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database dump
mongodump --db $DB_NAME --out $BACKUP_DIR/mongodb_$DATE

# Compress backup
tar -czf $BACKUP_DIR/mongodb_$DATE.tar.gz -C $BACKUP_DIR mongodb_$DATE

# Remove uncompressed backup
rm -rf $BACKUP_DIR/mongodb_$DATE

# Keep only last 30 days of backups
find $BACKUP_DIR -name "mongodb_*.tar.gz" -mtime +30 -delete

echo "$(date): Database backup completed: mongodb_$DATE.tar.gz"
```

```bash
chmod +x /home/dialadrink/scripts/backup-database.sh

# Schedule daily backup
crontab -e
```

Add:
```bash
0 2 * * * /home/dialadrink/scripts/backup-database.sh >> /home/dialadrink/logs/backup.log 2>&1
```

### 2. Application Backup Script

```bash
nano /home/dialadrink/scripts/backup-application.sh
```

```bash
#!/bin/bash
# Application backup script

BACKUP_DIR="/home/dialadrink/backups"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/home/dialadrink/apps/dialadrink"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup application files (excluding node_modules and logs)
tar --exclude='node_modules' --exclude='logs' --exclude='.git' \
    -czf $BACKUP_DIR/application_$DATE.tar.gz -C /home/dialadrink/apps dialadrink

# Keep only last 7 days of application backups
find $BACKUP_DIR -name "application_*.tar.gz" -mtime +7 -delete

echo "$(date): Application backup completed: application_$DATE.tar.gz"
```

### 3. Recovery Procedures

**Database Recovery:**
```bash
# Extract backup
tar -xzf /home/dialadrink/backups/mongodb_YYYYMMDD_HHMMSS.tar.gz

# Restore database
mongorestore --db dialadrink_prod --drop mongodb_YYYYMMDD_HHMMSS/dialadrink_prod/
```

**Application Recovery:**
```bash
# Stop application
pm2 stop all

# Extract application backup
tar -xzf /home/dialadrink/backups/application_YYYYMMDD_HHMMSS.tar.gz -C /home/dialadrink/apps/

# Install dependencies
cd /home/dialadrink/apps/dialadrink
npm ci --only=production

# Start application
pm2 start ecosystem.config.js
```

## Performance Optimization

### 1. Node.js Optimization

Update PM2 configuration for performance:
```javascript
// ecosystem.config.js optimization
{
  instances: 'max', // Use all CPU cores
  exec_mode: 'cluster',
  max_memory_restart: '1G',
  node_args: '--max_old_space_size=1024 --optimize-for-size'
}
```

### 2. MongoDB Optimization

```javascript
// Add to MongoDB configuration
// /etc/mongod.conf
operationProfiling:
  slowOpThresholdMs: 100
  mode: slowOp

# Create database indexes
mongo dialadrink_prod
```

```javascript
// Essential indexes for performance
db.products.createIndex({ "state": 1, "publishedDate": -1 });
db.products.createIndex({ "tags": 1, "category": 1 });
db.products.createIndex({ "popularity": -1 });
db.orders.createIndex({ "orderDate": -1, "state": 1 });
db.orders.createIndex({ "delivery.phoneNumber": 1 });
db.clients.createIndex({ "phoneNumber": 1 });
db.clients.createIndex({ "email": 1 });
```

### 3. Nginx Caching

Add caching configuration to Nginx:
```nginx
# Add to nginx configuration
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=dialadrink:10m max_size=1g inactive=60m;

# In server block
location /api/products {
    proxy_cache dialadrink;
    proxy_cache_valid 200 5m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    proxy_pass http://dialadrink_app;
}
```

## Troubleshooting

### 1. Common Issues and Solutions

**Application Won't Start:**
```bash
# Check PM2 logs
pm2 logs

# Check environment variables
pm2 show dialadrink-web

# Restart application
pm2 restart all
```

**Database Connection Issues:**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongo --eval 'db.runCommand("connectionStatus")'
```

**SSL Certificate Issues:**
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check Nginx SSL configuration
sudo nginx -t
```

### 2. Performance Monitoring

**Monitor Application Performance:**
```bash
# PM2 monitoring
pm2 monit

# System resources
htop
iostat 1
```

**Monitor Database Performance:**
```javascript
// MongoDB profiling
db.setProfilingLevel(2)
db.system.profile.find().limit(5).sort({ts:-1}).pretty()
```

### 3. Emergency Procedures

**Application Emergency Restart:**
```bash
# Quick restart all services
pm2 restart all
sudo systemctl reload nginx

# If issues persist, restart server
sudo reboot
```

**Database Emergency Recovery:**
```bash
# If database is corrupted, restore from backup
sudo systemctl stop mongod
sudo rm -rf /var/lib/mongodb/*
mongorestore --db dialadrink_prod /path/to/backup/
sudo systemctl start mongod
```

This deployment guide provides comprehensive instructions for setting up and maintaining a production-ready Dial A Drink Kenya application with proper security, monitoring, and backup procedures.