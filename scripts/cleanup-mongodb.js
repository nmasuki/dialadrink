#!/usr/bin/env node

/**
 * MongoDB Cleanup Script
 * Cleans up old cart items and expired sessions to optimize database performance
 */

var keystone = require('../app-init');
var mongoose = keystone.get('mongoose');

const CLEANUP_CONFIG = {
    // Days to keep data
    CART_ITEMS_RETENTION_DAYS: 30,        // Keep cart items for 30 days
    SESSIONS_RETENTION_DAYS: 7,           // Keep sessions for 7 days
    COMPLETED_ORDERS_RETENTION_DAYS: 180, // Keep completed orders for 6 months
    
    // Batch sizes for processing
    BATCH_SIZE: 1000,
    
    // Dry run mode (set to true to see what would be deleted without actually deleting)
    DRY_RUN: process.argv.includes('--dry-run') || process.argv.includes('-d')
};

async function cleanupCartItems() {
    console.log('\n🛒 Cleaning up CartItems...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.CART_ITEMS_RETENTION_DAYS);
    
    const CartItem = keystone.list('CartItem').model;
    
    try {
        // Find old cart items (not in completed orders)
        const query = {
            date: { $lt: cutoffDate },
            state: { $in: ['placed', 'dispatched'] } // Don't delete completed/paid items
        };
        
        const countResult = await CartItem.count(query);
        console.log(`📊 Found ${countResult} old cart items to clean up`);
        
        if (countResult === 0) {
            console.log('✅ No old cart items to clean up');
            return { deleted: 0, skipped: 0 };
        }
        
        if (CLEANUP_CONFIG.DRY_RUN) {
            console.log('🔍 DRY RUN: Would delete', countResult, 'cart items');
            return { deleted: 0, skipped: countResult };
        }
        
        // Delete in batches
        let totalDeleted = 0;
        let batch = 0;
        
        while (true) {
            const items = await CartItem.find(query)
                .limit(CLEANUP_CONFIG.BATCH_SIZE)
                .select('_id date state product');
                
            if (items.length === 0) break;
            
            const ids = items.map(item => item._id);
            const result = await CartItem.deleteMany({ _id: { $in: ids } });
            
            totalDeleted += result.deletedCount;
            batch++;
            
            console.log(`📦 Batch ${batch}: Deleted ${result.deletedCount} cart items`);
            
            // Small delay between batches to avoid overwhelming DB
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ Successfully deleted ${totalDeleted} old cart items`);
        return { deleted: totalDeleted, skipped: 0 };
        
    } catch (error) {
        console.error('❌ Error cleaning up cart items:', error.message);
        throw error;
    }
}

async function cleanupSessions() {
    console.log('\n🔐 Cleaning up Sessions...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.SESSIONS_RETENTION_DAYS);
    
    try {
        const db = mongoose.connection;
        const sessionsCollection = db.collection('app_sessions');
        
        // Find expired sessions
        const query = {
            $or: [
                { expires: { $lt: new Date() } },  // Already expired
                { expires: { $exists: false }, _id: { $lt: cutoffDate.toISOString() } } // Old sessions without expires
            ]
        };
        
        const countResult = await sessionsCollection.count(query);
        console.log(`📊 Found ${countResult} expired sessions to clean up`);
        
        if (countResult === 0) {
            console.log('✅ No expired sessions to clean up');
            return { deleted: 0, skipped: 0 };
        }
        
        if (CLEANUP_CONFIG.DRY_RUN) {
            console.log('🔍 DRY RUN: Would delete', countResult, 'sessions');
            return { deleted: 0, skipped: countResult };
        }
        
        // Delete expired sessions
        const result = await sessionsCollection.deleteMany(query);
        
        console.log(`✅ Successfully deleted ${result.deletedCount} expired sessions`);
        return { deleted: result.deletedCount, skipped: 0 };
        
    } catch (error) {
        console.error('❌ Error cleaning up sessions:', error.message);
        throw error;
    }
}

async function cleanupCompletedOrders() {
    console.log('\n📦 Cleaning up old completed orders...');
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - CLEANUP_CONFIG.COMPLETED_ORDERS_RETENTION_DAYS);
    
    const CartItem = keystone.list('CartItem').model;
    
    try {
        // Find very old completed orders
        const query = {
            date: { $lt: cutoffDate },
            state: { $in: ['delivered', 'completed'] }
        };
        
        const countResult = await CartItem.count(query);
        console.log(`📊 Found ${countResult} old completed orders to archive/clean up`);
        
        if (countResult === 0) {
            console.log('✅ No old completed orders to clean up');
            return { deleted: 0, skipped: 0 };
        }
        
        if (CLEANUP_CONFIG.DRY_RUN) {
            console.log('🔍 DRY RUN: Would delete', countResult, 'completed orders');
            return { deleted: 0, skipped: countResult };
        }
        
        // For completed orders, you might want to archive instead of delete
        // Uncomment the following lines if you want to delete them:
        
        // const result = await CartItem.deleteMany(query);
        // console.log(`✅ Successfully deleted ${result.deletedCount} old completed orders`);
        // return { deleted: result.deletedCount, skipped: 0 };
        
        console.log('⚠️ Skipping deletion of completed orders (consider archiving instead)');
        return { deleted: 0, skipped: countResult };
        
    } catch (error) {
        console.error('❌ Error cleaning up completed orders:', error.message);
        throw error;
    }
}

async function optimizeDatabase() {
    console.log('\n⚡ Optimizing database indexes and collections...');
    
    try {
        const db = mongoose.connection;
        
        // Get collection stats before optimization
        const cartItemsStats = await db.collection('cartitems').stats().catch(() => ({ size: 0, count: 0 }));
        const sessionsStats = await db.collection('app_sessions').stats().catch(() => ({ size: 0, count: 0 }));
        
        console.log(`📊 CartItems collection: ${cartItemsStats.count} documents, ${Math.round(cartItemsStats.size / 1024 / 1024)} MB`);
        console.log(`📊 Sessions collection: ${sessionsStats.count} documents, ${Math.round(sessionsStats.size / 1024 / 1024)} MB`);
        
        if (!CLEANUP_CONFIG.DRY_RUN) {
            // Rebuild indexes for better performance
            console.log('🔨 Rebuilding indexes...');
            
            await db.collection('cartitems').reIndex();
            await db.collection('app_sessions').reIndex();
            
            console.log('✅ Database indexes rebuilt successfully');
        }
        
    } catch (error) {
        console.error('❌ Error optimizing database:', error.message);
    }
}

async function generateCleanupReport(results) {
    console.log('\n📋 CLEANUP REPORT');
    console.log('================');
    console.log(`Mode: ${CLEANUP_CONFIG.DRY_RUN ? 'DRY RUN' : 'LIVE CLEANUP'}`);
    console.log(`Date: ${new Date().toISOString()}`);
    console.log('');
    
    let totalDeleted = 0;
    let totalSkipped = 0;
    
    for (const [operation, result] of Object.entries(results)) {
        console.log(`${operation}:`);
        console.log(`  - Deleted: ${result.deleted}`);
        console.log(`  - Skipped: ${result.skipped}`);
        totalDeleted += result.deleted;
        totalSkipped += result.skipped;
    }
    
    console.log('');
    console.log(`Total deleted: ${totalDeleted}`);
    console.log(`Total skipped: ${totalSkipped}`);
    
    if (CLEANUP_CONFIG.DRY_RUN) {
        console.log('');
        console.log('💡 To perform actual cleanup, run without --dry-run flag');
    }
}

async function main() {
    console.log('🧹 MongoDB Cleanup Script Starting...');
    console.log('====================================');
    
    if (CLEANUP_CONFIG.DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No data will be deleted');
    }
    
    console.log(`Configuration:`);
    console.log(`- Cart Items Retention: ${CLEANUP_CONFIG.CART_ITEMS_RETENTION_DAYS} days`);
    console.log(`- Sessions Retention: ${CLEANUP_CONFIG.SESSIONS_RETENTION_DAYS} days`);
    console.log(`- Completed Orders Retention: ${CLEANUP_CONFIG.COMPLETED_ORDERS_RETENTION_DAYS} days`);
    
    try {
        // Connect to database
        await keystone.openDatabaseConnection(console.error);
        console.log('✅ Connected to MongoDB');
        
        const results = {};
        
        // Perform cleanup operations
        results['Cart Items'] = await cleanupCartItems();
        results['Sessions'] = await cleanupSessions();
        results['Completed Orders'] = await cleanupCompletedOrders();
        
        // Optimize database
        await optimizeDatabase();
        
        // Generate report
        await generateCleanupReport(results);
        
        console.log('\n🎉 Cleanup completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Cleanup failed:', error.message);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the cleanup
main();