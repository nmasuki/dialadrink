#!/usr/bin/env node

/**
 * MongoDB Index Optimization Script
 * Creates and optimizes indexes for better query performance
 */

var keystone = require('../app-init');
var mongoose = keystone.get('mongoose');

async function createOptimalIndexes() {
    console.log('🔨 Creating optimal database indexes...');
    
    try {
        const db = mongoose.connection;
        
        // CartItems collection indexes
        console.log('📦 Optimizing CartItems indexes...');
        const cartItemsCollection = db.collection('cartitems');
        
        await cartItemsCollection.createIndex({ date: 1 }, { background: true });
        await cartItemsCollection.createIndex({ state: 1 }, { background: true });
        await cartItemsCollection.createIndex({ product: 1 }, { background: true });
        await cartItemsCollection.createIndex({ date: 1, state: 1 }, { background: true });
        
        // Sessions collection indexes
        console.log('🔐 Optimizing Sessions indexes...');
        const sessionsCollection = db.collection('app_sessions');
        
        await sessionsCollection.createIndex({ expires: 1 }, { 
            background: true,
            expireAfterSeconds: 0  // TTL index for automatic cleanup
        });
        await sessionsCollection.createIndex({ _id: 1 }, { background: true });
        
        // Products collection indexes (for better performance)
        console.log('🛍️ Optimizing Products indexes...');
        const productsCollection = db.collection('products');
        
        await productsCollection.createIndex({ state: 1 }, { background: true });
        await productsCollection.createIndex({ category: 1 }, { background: true });
        await productsCollection.createIndex({ brand: 1 }, { background: true });
        await productsCollection.createIndex({ inStock: 1 }, { background: true });
        await productsCollection.createIndex({ popularity: -1 }, { background: true });
        await productsCollection.createIndex({ price: 1 }, { background: true });
        await productsCollection.createIndex({ 
            state: 1, 
            inStock: 1, 
            popularity: -1 
        }, { background: true });
        
        // Orders collection indexes
        console.log('📋 Optimizing Orders indexes...');
        const ordersCollection = db.collection('orders');
        
        await ordersCollection.createIndex({ date: 1 }, { background: true });
        await ordersCollection.createIndex({ state: 1 }, { background: true });
        await ordersCollection.createIndex({ client: 1 }, { background: true });
        await ordersCollection.createIndex({ date: -1, state: 1 }, { background: true });
        
        // AppUsers collection indexes
        console.log('👥 Optimizing AppUsers indexes...');
        const appUsersCollection = db.collection('appusers');
        
        await appUsersCollection.createIndex({ phoneNumber: 1 }, { background: true });
        await appUsersCollection.createIndex({ sessions: 1 }, { background: true });
        await appUsersCollection.createIndex({ accountStatus: 1 }, { background: true });
        
        // Clients collection indexes
        console.log('🤝 Optimizing Clients indexes...');
        const clientsCollection = db.collection('clients');
        
        await clientsCollection.createIndex({ phoneNumber: 1 }, { background: true });
        await clientsCollection.createIndex({ sessions: 1 }, { background: true });
        
        console.log('✅ All indexes created successfully');
        
    } catch (error) {
        console.error('❌ Error creating indexes:', error.message);
        throw error;
    }
}

async function analyzeCollectionStats() {
    console.log('\n📊 Analyzing collection statistics...');
    
    try {
        const db = mongoose.connection;
        
        const collections = [
            'cartitems', 
            'app_sessions', 
            'products', 
            'orders', 
            'appusers', 
            'clients'
        ];
        
        for (const collectionName of collections) {
            try {
                const collection = db.collection(collectionName);
                const indexes = await collection.indexes();
                const stats = await collection.stats();
                
                console.log(`\n${collectionName.toUpperCase()}:`);
                console.log(`  Documents: ${stats.count.toLocaleString()}`);
                console.log(`  Size: ${Math.round(stats.size / 1024 / 1024)} MB`);
                console.log(`  Average Document Size: ${Math.round(stats.avgObjSize)} bytes`);
                console.log(`  Indexes: ${indexes.length}`);
                console.log(`  Index Sizes: ${Math.round(stats.totalIndexSize / 1024 / 1024)} MB`);
                
                // Show slow queries if available
                const indexUsage = await collection.aggregate([
                    { $indexStats: {} }
                ]).toArray().catch(() => []);
                
                if (indexUsage.length > 0) {
                    console.log(`  Index Usage:`);
                    indexUsage.forEach(idx => {
                        console.log(`    ${JSON.stringify(idx.key)}: ${idx.accesses.ops} operations`);
                    });
                }
                
            } catch (error) {
                console.log(`  ⚠️ Could not get stats for ${collectionName}: ${error.message}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Error analyzing collections:', error.message);
    }
}

async function optimizePerformance() {
    console.log('\n⚡ Running performance optimizations...');
    
    try {
        const db = mongoose.connection;
        
        // Run compact on collections to reclaim space
        console.log('🗜️ Compacting collections...');
        
        const collections = ['cartitems', 'app_sessions'];
        
        for (const collectionName of collections) {
            try {
                await db.command({ compact: collectionName });
                console.log(`✅ Compacted ${collectionName}`);
            } catch (error) {
                console.log(`⚠️ Could not compact ${collectionName}: ${error.message}`);
            }
        }
        
        console.log('✅ Performance optimization completed');
        
    } catch (error) {
        console.error('❌ Error during performance optimization:', error.message);
    }
}

async function main() {
    console.log('⚡ MongoDB Index Optimization Script Starting...');
    console.log('===============================================');
    
    try {
        // Connect to database
        await keystone.openDatabaseConnection(console.error);
        console.log('✅ Connected to MongoDB');
        
        // Analyze current state
        await analyzeCollectionStats();
        
        // Create optimal indexes
        await createOptimalIndexes();
        
        // Run performance optimizations
        await optimizePerformance();
        
        // Show final stats
        console.log('\n📊 Final collection statistics:');
        await analyzeCollectionStats();
        
        console.log('\n🎉 Index optimization completed successfully!');
        
    } catch (error) {
        console.error('\n💥 Optimization failed:', error.message);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.disconnect();
        console.log('📤 Disconnected from MongoDB');
    }
}

// Run the optimization
main();