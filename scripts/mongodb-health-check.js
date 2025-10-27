#!/usr/bin/env node

/**
 * MongoDB Health Monitor
 * Monitors database performance and generates alerts
 */

var keystone = require('../app-init');
var mongoose = keystone.get('mongoose');

const THRESHOLDS = {
    MAX_COLLECTION_SIZE_MB: 500,      // Alert if collection > 500MB
    MAX_DOCUMENT_COUNT: 100000,       // Alert if collection > 100k docs
    MAX_OLD_SESSIONS_COUNT: 1000,     // Alert if > 1000 expired sessions
    MAX_OLD_CARTITEMS_COUNT: 5000,    // Alert if > 5000 old cart items
    MAX_RESPONSE_TIME_MS: 1000        // Alert if queries > 1s
};

async function checkDatabaseHealth() {
    console.log('🏥 Checking MongoDB health...');
    
    const issues = [];
    const stats = {};
    
    try {
        const db = mongoose.connection;
        
        // Check server status
        const serverStatus = await db.admin().serverStatus();
        console.log(`📊 MongoDB Version: ${serverStatus.version}`);
        console.log(`📊 Uptime: ${Math.round(serverStatus.uptime / 3600)} hours`);
        
        // Check connection count
        if (serverStatus.connections) {
            console.log(`🔗 Connections: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
            if (serverStatus.connections.current / serverStatus.connections.available > 0.8) {
                issues.push(`High connection usage: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
            }
        }
        
        // Check memory usage
        if (serverStatus.mem) {
            console.log(`💾 Memory: ${Math.round(serverStatus.mem.resident)} MB resident, ${Math.round(serverStatus.mem.virtual)} MB virtual`);
        }
        
        // Check collection sizes
        const collections = ['cartitems', 'app_sessions', 'products', 'orders'];
        
        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                const collStats = await collection.stats();
                
                stats[collectionName] = {
                    count: collStats.count,
                    size: Math.round(collStats.size / 1024 / 1024),
                    avgObjSize: Math.round(collStats.avgObjSize)
                };
                
                console.log(`📦 ${collectionName}: ${collStats.count.toLocaleString()} docs, ${Math.round(collStats.size / 1024 / 1024)} MB`);
                
                // Check thresholds
                if (collStats.size / 1024 / 1024 > THRESHOLDS.MAX_COLLECTION_SIZE_MB) {
                    issues.push(`${collectionName} collection too large: ${Math.round(collStats.size / 1024 / 1024)} MB`);
                }
                
                if (collStats.count > THRESHOLDS.MAX_DOCUMENT_COUNT) {
                    issues.push(`${collectionName} has too many documents: ${collStats.count.toLocaleString()}`);
                }
                
            } catch (error) {
                issues.push(`Could not check ${collectionName}: ${error.message}`);
            }
        }
        
        return { issues, stats, serverStatus };
        
    } catch (error) {
        issues.push(`Database health check failed: ${error.message}`);
        return { issues, stats: {}, serverStatus: null };
    }
}

async function checkOldData() {
    console.log('\n🗑️ Checking for old data that needs cleanup...');
    
    const issues = [];
    
    try {
        const db = mongoose.connection;
        const CartItem = keystone.list('CartItem').model;
        
        // Check for old cart items
        const oldCartItemsDate = new Date();
        oldCartItemsDate.setDate(oldCartItemsDate.getDate() - 30);
        
        const oldCartItemsCount = await CartItem.count({
            date: { $lt: oldCartItemsDate },
            state: { $in: ['placed', 'dispatched'] }
        });
        
        console.log(`📦 Old cart items (>30 days): ${oldCartItemsCount}`);
        
        if (oldCartItemsCount > THRESHOLDS.MAX_OLD_CARTITEMS_COUNT) {
            issues.push(`Too many old cart items: ${oldCartItemsCount} (threshold: ${THRESHOLDS.MAX_OLD_CARTITEMS_COUNT})`);
        }
        
        // Check for expired sessions
        const sessionsCollection = db.collection('app_sessions');
        const expiredSessionsCount = await sessionsCollection.count({
            expires: { $lt: new Date() }
        });
        
        console.log(`🔐 Expired sessions: ${expiredSessionsCount}`);
        
        if (expiredSessionsCount > THRESHOLDS.MAX_OLD_SESSIONS_COUNT) {
            issues.push(`Too many expired sessions: ${expiredSessionsCount} (threshold: ${THRESHOLDS.MAX_OLD_SESSIONS_COUNT})`);
        }
        
        return issues;
        
    } catch (error) {
        issues.push(`Old data check failed: ${error.message}`);
        return issues;
    }
}

async function checkQueryPerformance() {
    console.log('\n⚡ Checking query performance...');
    
    const issues = [];
    
    try {
        const CartItem = keystone.list('CartItem').model;
        
        // Test common queries and measure performance
        const queries = [
            {
                name: 'Recent cart items',
                query: () => CartItem.find({ state: 'placed' }).limit(10)
            },
            {
                name: 'Cart items by date',
                query: () => CartItem.find({ 
                    date: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } 
                }).limit(10)
            }
        ];
        
        for (const testQuery of queries) {
            const startTime = Date.now();
            
            try {
                await testQuery.query().exec();
                const duration = Date.now() - startTime;
                
                console.log(`🔍 ${testQuery.name}: ${duration}ms`);
                
                if (duration > THRESHOLDS.MAX_RESPONSE_TIME_MS) {
                    issues.push(`Slow query - ${testQuery.name}: ${duration}ms (threshold: ${THRESHOLDS.MAX_RESPONSE_TIME_MS}ms)`);
                }
                
            } catch (error) {
                issues.push(`Query failed - ${testQuery.name}: ${error.message}`);
            }
        }
        
        return issues;
        
    } catch (error) {
        issues.push(`Performance check failed: ${error.message}`);
        return issues;
    }
}

async function generateHealthReport(healthCheck, oldDataIssues, performanceIssues) {
    console.log('\n📋 MONGODB HEALTH REPORT');
    console.log('========================');
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('');
    
    // Overall status
    const totalIssues = healthCheck.issues.length + oldDataIssues.length + performanceIssues.length;
    const status = totalIssues === 0 ? '✅ HEALTHY' : totalIssues < 5 ? '⚠️ WARNING' : '❌ CRITICAL';
    
    console.log(`Overall Status: ${status}`);
    console.log(`Total Issues: ${totalIssues}`);
    console.log('');
    
    // Database stats summary
    if (healthCheck.stats && Object.keys(healthCheck.stats).length > 0) {
        console.log('📊 Collection Summary:');
        for (const [collection, stats] of Object.entries(healthCheck.stats)) {
            console.log(`  ${collection}: ${stats.count.toLocaleString()} docs, ${stats.size} MB`);
        }
        console.log('');
    }
    
    // List all issues
    if (totalIssues > 0) {
        console.log('🚨 Issues Found:');
        
        if (healthCheck.issues.length > 0) {
            console.log('  Database Health:');
            healthCheck.issues.forEach(issue => console.log(`    - ${issue}`));
        }
        
        if (oldDataIssues.length > 0) {
            console.log('  Old Data:');
            oldDataIssues.forEach(issue => console.log(`    - ${issue}`));
        }
        
        if (performanceIssues.length > 0) {
            console.log('  Performance:');
            performanceIssues.forEach(issue => console.log(`    - ${issue}`));
        }
        
        console.log('');
        console.log('💡 Recommendations:');
        console.log('  - Run cleanup script: node scripts/cleanup-mongodb.js');
        console.log('  - Run index optimization: node scripts/optimize-indexes.js');
        console.log('  - Consider archiving old completed orders');
        console.log('  - Monitor query performance and add indexes as needed');
    } else {
        console.log('🎉 No issues found! Database is healthy.');
    }
    
    return {
        status: totalIssues === 0 ? 'healthy' : totalIssues < 5 ? 'warning' : 'critical',
        totalIssues,
        timestamp: new Date().toISOString()
    };
}

async function main() {
    console.log('🔍 MongoDB Health Monitor Starting...');
    console.log('====================================');
    
    try {
        // Connect to database
        await keystone.openDatabaseConnection(console.error);
        console.log('✅ Connected to MongoDB');
        
        // Run health checks
        const healthCheck = await checkDatabaseHealth();
        const oldDataIssues = await checkOldData();
        const performanceIssues = await checkQueryPerformance();
        
        // Generate report
        const report = await generateHealthReport(healthCheck, oldDataIssues, performanceIssues);
        
        // Exit with appropriate code
        if (report.status === 'critical') {
            process.exit(2);
        } else if (report.status === 'warning') {
            process.exit(1);
        } else {
            process.exit(0);
        }
        
    } catch (error) {
        console.error('\n💥 Health check failed:', error.message);
        process.exit(2);
    } finally {
        // Close database connection
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the health check
main();