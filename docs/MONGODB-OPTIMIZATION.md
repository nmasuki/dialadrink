# MongoDB Optimization Tools

This directory contains scripts to optimize and maintain MongoDB database performance for the Dial A Drink application.

## Overview

These tools help with:
- 🧹 **Database Cleanup**: Remove old cart items and expired sessions
- 📊 **Performance Monitoring**: Track database health and performance metrics  
- ⚡ **Index Optimization**: Create and maintain optimal database indexes
- 🚨 **Health Alerts**: Monitor for issues that need attention

## Scripts

### 1. Database Cleanup (`cleanup-mongodb.js`)

Removes old data to keep the database lean and performant.

**What it cleans:**
- Cart items older than 30 days (configurable)
- Expired sessions older than 7 days (configurable)  
- Optionally archives very old completed orders (180+ days)

**Usage:**
```bash
# Run cleanup (live mode)
npm run cleanup

# Dry run to see what would be deleted
npm run cleanup:dry-run

# Or run directly with node
node scripts/cleanup-mongodb.js
node scripts/cleanup-mongodb.js --dry-run
```

**Configuration:**
Edit the `CLEANUP_CONFIG` object in the script to adjust retention periods:
```javascript
const CLEANUP_CONFIG = {
    CART_ITEMS_RETENTION_DAYS: 30,        // Keep cart items for 30 days
    SESSIONS_RETENTION_DAYS: 7,           // Keep sessions for 7 days  
    COMPLETED_ORDERS_RETENTION_DAYS: 180, // Keep completed orders for 6 months
    BATCH_SIZE: 1000,                     // Process in batches of 1000
    DRY_RUN: false                        // Set to true for dry run
};
```

### 2. Index Optimization (`optimize-indexes.js`)

Creates and maintains optimal database indexes for better query performance.

**What it does:**
- Creates indexes on frequently queried fields
- Sets up TTL (Time To Live) indexes for automatic session cleanup
- Analyzes collection statistics and index usage
- Compacts collections to reclaim space

**Usage:**
```bash
# Run index optimization
npm run optimize-db

# Or run directly
node scripts/optimize-indexes.js
```

**Created Indexes:**
- **CartItems**: `date`, `state`, `product`, `date+state` compound
- **Sessions**: `expires` (TTL), `_id`  
- **Products**: `state`, `category`, `brand`, `inStock`, `popularity`, `price`, compound indexes
- **Orders**: `date`, `state`, `client`, `date+state` compound
- **AppUsers**: `phoneNumber`, `sessions`, `accountStatus`
- **Clients**: `phoneNumber`, `sessions`

### 3. Health Monitor (`mongodb-health-check.js`)

Monitors database health and alerts on potential issues.

**What it monitors:**
- Collection sizes and document counts
- Expired sessions and old cart items
- Query performance and response times
- Connection usage and memory consumption
- Server status and uptime

**Usage:**
```bash
# Run health check
npm run health-check

# Or run directly
node scripts/mongodb-health-check.js
```

**Alert Thresholds:**
```javascript
const THRESHOLDS = {
    MAX_COLLECTION_SIZE_MB: 500,      // Alert if collection > 500MB
    MAX_DOCUMENT_COUNT: 100000,       // Alert if collection > 100k docs
    MAX_OLD_SESSIONS_COUNT: 1000,     // Alert if > 1000 expired sessions
    MAX_OLD_CARTITEMS_COUNT: 5000,    // Alert if > 5000 old cart items
    MAX_RESPONSE_TIME_MS: 1000        // Alert if queries > 1s
};
```

**Exit Codes:**
- `0`: Healthy (no issues)
- `1`: Warning (minor issues) 
- `2`: Critical (major issues)

## Automated Scheduling

### Cron Job Setup

Use the provided cron script for automated cleanup:

```bash
# Make executable
chmod +x scripts/cleanup-cron.sh

# Add to crontab for daily cleanup at 2 AM
crontab -e

# Add this line:
0 2 * * * /home/wwwdiala/apps/diala/scripts/cleanup-cron.sh
```

**Cron Schedule Examples:**
```bash
# Daily at 2 AM
0 2 * * * /path/to/cleanup-cron.sh

# Weekly on Sunday at 3 AM  
0 3 * * 0 /path/to/cleanup-cron.sh

# Monthly on 1st day at 4 AM
0 4 1 * * /path/to/cleanup-cron.sh
```

### Systemd Timer (Alternative)

Create a systemd service for modern Linux systems:

```bash
# Create service file
sudo nano /etc/systemd/system/mongodb-cleanup.service

# Add content:
[Unit]
Description=MongoDB Cleanup Service
After=network.target

[Service]
Type=oneshot
User=www-data  
WorkingDirectory=/home/wwwdiala/apps/diala
ExecStart=/home/wwwdiala/apps/diala/scripts/cleanup-cron.sh

# Create timer file
sudo nano /etc/systemd/system/mongodb-cleanup.timer

# Add content:
[Unit]
Description=Run MongoDB Cleanup Daily
Requires=mongodb-cleanup.service

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=timers.target

# Enable and start
sudo systemctl enable mongodb-cleanup.timer
sudo systemctl start mongodb-cleanup.timer
```

## Monitoring & Alerts

### Log Files

The cron script creates logs in `/var/log/diala-cleanup/`:
- `mongodb-cleanup-YYYYMMDD.log` - Daily cleanup logs
- Automatic rotation (keeps 30 days)

### Notifications (Optional)

Uncomment notification sections in `cleanup-cron.sh` to enable:

**Telegram Notifications:**
```bash
export TELEGRAM_BOT_TOKEN="your_bot_token"
export TELEGRAM_CHAT_ID="your_chat_id"
```

**Email Notifications:**
```bash
# Add to cron script
echo "Cleanup completed" | mail -s "DB Cleanup Success" admin@yoursite.com
```

### Health Check Integration

Integrate health checks with monitoring systems:

**Nagios/Icinga:**
```bash
# Check command
/home/wwwdiala/apps/diala/scripts/mongodb-health-check.js
```

**Uptime Robot/StatusCake:**
```bash
# Create HTTP endpoint that runs health check
# Return HTTP 200 for healthy, 500 for issues
```

## Performance Tips

### Query Optimization

1. **Use Indexes**: The optimization script creates common indexes
2. **Limit Results**: Always use `.limit()` on large collections
3. **Project Fields**: Use `.select()` to fetch only needed fields
4. **Compound Indexes**: Created for common query patterns

### Memory Usage

1. **Regular Cleanup**: Run cleanup script daily/weekly
2. **Monitor Growth**: Check collection sizes regularly
3. **Archive Old Data**: Move old orders to separate collections

### Connection Pooling

```javascript
// In your app configuration
mongoose.connect(uri, {
    maxPoolSize: 10,        // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferMaxEntries: 0     // Disable mongoose buffering
});
```

## Troubleshooting

### Common Issues

**"Cannot delete from collection":**
- Check database permissions
- Ensure no active connections during cleanup
- Try smaller batch sizes

**"Index creation failed":**
- Check for existing conflicting indexes
- Ensure sufficient disk space
- Run during low-traffic periods

**"Health check timeouts":**
- Increase query timeout values
- Check database server resources
- Consider adding more indexes

### Debug Mode

Enable debug logging:
```bash
DEBUG=* node scripts/cleanup-mongodb.js
```

### Performance Analysis

Use MongoDB's built-in profiler:
```javascript
// Enable profiling for slow queries (>100ms)
db.setProfilingLevel(1, { slowms: 100 });

// Check profile data
db.system.profile.find().limit(5).sort({ ts: -1 });
```

## Security Considerations

1. **Backup Before Cleanup**: Always backup before running cleanup
2. **Test on Staging**: Test scripts on non-production environment first
3. **Access Control**: Ensure scripts run with appropriate database permissions
4. **Log Rotation**: Configure log rotation to prevent disk space issues

## Backup Integration

Before running cleanup, consider automated backups:

```bash
#!/bin/bash
# Pre-cleanup backup
mongodump --uri="$MONGO_URI" --out="/backup/pre-cleanup-$(date +%Y%m%d)"

# Run cleanup
npm run cleanup

# Post-cleanup backup (optional)
mongodump --uri="$MONGO_URI" --out="/backup/post-cleanup-$(date +%Y%m%d)"
```

## Maintenance Schedule

**Recommended Schedule:**
- **Daily**: Health check monitoring
- **Daily**: Session cleanup (automated via TTL indexes)
- **Weekly**: Full cleanup script (cart items, etc.)
- **Monthly**: Index optimization and statistics review
- **Quarterly**: Full database maintenance and archival

---

For questions or issues, check the logs in `/var/log/diala-cleanup/` or run scripts with `--dry-run` flag first.