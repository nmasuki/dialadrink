#!/usr/bin/env node

/**
 * MongoDB Database Cleanup Script
 *
 * This script cleans up old and expired data from the MongoDB database.
 * It removes:
 * - Old cart items
 * - Expired and old sessions
 * - Reports on old completed orders (archival placeholder)
 *
 * Usage:
 *   node cleanup-mongodb.js          # Performs actual cleanup
 *   node cleanup-mongodb.js --dry-run # Shows what would be cleaned without making changes
 *
 * Environment Variables:
 *   MONGODB_URI - MongoDB connection string (default: mongodb://127.0.0.1:27017/dial-a-drink-kenya)
 */

const { MongoClient } = require("mongodb");

const CONFIG = {
  CART_ITEMS_RETENTION_DAYS: 30,
  SESSIONS_RETENTION_DAYS: 7,
  COMPLETED_ORDERS_RETENTION_DAYS: 180,
  BATCH_SIZE: 1000,
};

const isDryRun = process.argv.includes("--dry-run");
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dial-a-drink-kenya";

async function cleanupDatabase() {
  let client;
  let totalCleaned = 0;

  try {
    console.log("=".repeat(60));
    console.log("MongoDB Database Cleanup Script");
    console.log("=".repeat(60));
    console.log(`Mode: ${isDryRun ? "DRY RUN (no changes will be made)" : "LIVE"}`);
    console.log(`Connected to: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}`);
    console.log("=".repeat(60));
    console.log();

    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log("✓ Successfully connected to MongoDB\n");

    const db = client.db();
    const now = new Date();

    // 1. Cleanup old cart items
    console.log("1. Cleaning up old cart items...");
    console.log("-".repeat(60));
    const cartRetentionDate = new Date(now.getTime() - CONFIG.CART_ITEMS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    console.log(`   Removing cart items older than: ${cartRetentionDate.toISOString()}`);

    const cartItemsCollection = db.collection("cartitems");
    const cartItemsQuery = { date: { $lt: cartRetentionDate } };
    const cartItemsCount = await cartItemsCollection.countDocuments(cartItemsQuery);

    console.log(`   Found ${cartItemsCount} cart items to clean up`);

    if (!isDryRun && cartItemsCount > 0) {
      const cartDeleteResult = await cartItemsCollection.deleteMany(cartItemsQuery);
      console.log(`   ✓ Deleted ${cartDeleteResult.deletedCount} cart items`);
      totalCleaned += cartDeleteResult.deletedCount;
    } else if (isDryRun && cartItemsCount > 0) {
      console.log(`   [DRY RUN] Would delete ${cartItemsCount} cart items`);
    }
    console.log();

    // 2. Cleanup expired and old sessions
    console.log("2. Cleaning up expired and old sessions...");
    console.log("-".repeat(60));
    const sessionRetentionDate = new Date(now.getTime() - CONFIG.SESSIONS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    console.log(`   Removing sessions expired before now or updated before: ${sessionRetentionDate.toISOString()}`);

    // Try both possible collection names
    const sessionCollectionNames = ["app_sessions", "sessions"];
    let sessionsCleaned = 0;

    for (const collectionName of sessionCollectionNames) {
      const collections = await db.listCollections({ name: collectionName }).toArray();

      if (collections.length > 0) {
        const sessionsCollection = db.collection(collectionName);
        const sessionsQuery = {
          $or: [
            { expires: { $lt: now } },
            { updatedAt: { $lt: sessionRetentionDate } }
          ]
        };

        const sessionsCount = await sessionsCollection.countDocuments(sessionsQuery);
        console.log(`   Found ${sessionsCount} sessions in "${collectionName}" to clean up`);

        if (!isDryRun && sessionsCount > 0) {
          const sessionDeleteResult = await sessionsCollection.deleteMany(sessionsQuery);
          console.log(`   ✓ Deleted ${sessionDeleteResult.deletedCount} sessions from "${collectionName}"`);
          totalCleaned += sessionDeleteResult.deletedCount;
          sessionsCleaned += sessionDeleteResult.deletedCount;
        } else if (isDryRun && sessionsCount > 0) {
          console.log(`   [DRY RUN] Would delete ${sessionsCount} sessions from "${collectionName}"`);
        }
      }
    }
    console.log();

    // 3. Report on old completed orders (archival placeholder)
    console.log("3. Analyzing old completed orders...");
    console.log("-".repeat(60));
    const orderRetentionDate = new Date(now.getTime() - CONFIG.COMPLETED_ORDERS_RETENTION_DAYS * 24 * 60 * 60 * 1000);
    console.log(`   Checking for completed orders older than: ${orderRetentionDate.toISOString()}`);

    const ordersCollection = db.collection("orders");
    const oldOrdersQuery = {
      status: "completed",
      completedAt: { $lt: orderRetentionDate }
    };

    // Try alternative query if completedAt doesn't exist
    let oldOrdersCount = await ordersCollection.countDocuments(oldOrdersQuery);

    if (oldOrdersCount === 0) {
      // Try with createdAt or updatedAt as fallback
      const alternativeQuery = {
        status: "completed",
        $or: [
          { createdAt: { $lt: orderRetentionDate } },
          { updatedAt: { $lt: orderRetentionDate } }
        ]
      };
      oldOrdersCount = await ordersCollection.countDocuments(alternativeQuery);
    }

    console.log(`   Found ${oldOrdersCount} completed orders older than ${CONFIG.COMPLETED_ORDERS_RETENTION_DAYS} days`);
    console.log(`   [INFO] Order archival not yet implemented - these orders are being reported only`);
    console.log();

    // Summary
    console.log("=".repeat(60));
    console.log("Cleanup Summary");
    console.log("=".repeat(60));
    if (isDryRun) {
      console.log("Mode: DRY RUN - No changes were made");
      console.log(`Total documents that would be cleaned: ${cartItemsCount + (sessionsCleaned || 0)}`);
    } else {
      console.log("Mode: LIVE - Changes have been applied");
      console.log(`Total documents cleaned: ${totalCleaned}`);
    }
    console.log(`Old completed orders to consider archiving: ${oldOrdersCount}`);
    console.log("=".repeat(60));
    console.log("\n✓ Cleanup completed successfully");

  } catch (error) {
    console.error("\n✗ Error during cleanup:");
    console.error(error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("\n✓ Database connection closed");
    }
  }

  process.exit(0);
}

// Run the cleanup
cleanupDatabase();
