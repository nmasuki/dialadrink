#!/usr/bin/env node

/**
 * MongoDB Health Check Script
 *
 * Monitors database health by checking:
 * - Collection sizes and document counts
 * - Stale data (old sessions and cart items)
 * - Query performance
 * - Database statistics
 *
 * Exit codes:
 * - 0: All checks passed (HEALTHY)
 * - 1: Warnings detected (WARNING)
 * - 2: Critical issues found (CRITICAL)
 */

const { MongoClient } = require("mongodb");

const THRESHOLDS = {
  MAX_COLLECTION_SIZE_MB: 500,
  MAX_DOCUMENT_COUNT: 100000,
  MAX_OLD_SESSIONS_COUNT: 1000,
  MAX_OLD_CARTITEMS_COUNT: 5000,
  MAX_RESPONSE_TIME_MS: 1000,
};

const COLLECTIONS_TO_CHECK = [
  "products",
  "orders",
  "cartitems",
  "appusers",
  "pages",
  "productcategories",
  "productbrands",
  "productsubcategories",
  "locations",
  "menuitems",
  "promos",
];

let hasWarnings = false;
let hasCritical = false;

function logStatus(status, message) {
  const prefix = status === "OK" ? "✓" : status === "WARNING" ? "⚠" : "✗";
  console.log(`  ${prefix} [${status}] ${message}`);

  if (status === "WARNING") hasWarnings = true;
  if (status === "CRITICAL") hasCritical = true;
}

async function checkCollectionStats(db) {
  console.log("\n========================================");
  console.log("COLLECTION STATISTICS");
  console.log("========================================\n");

  for (const collectionName of COLLECTIONS_TO_CHECK) {
    try {
      const collection = db.collection(collectionName);

      // Get document count
      const count = await collection.countDocuments();

      // Get collection stats
      let sizeInMB = 0;
      try {
        const stats = await db.command({ collStats: collectionName });
        sizeInMB = stats.size / (1024 * 1024);
      } catch (error) {
        // Collection might not exist or stats not available
        if (count === 0) {
          console.log(`  Collection: ${collectionName} (empty)`);
          continue;
        }
      }

      console.log(`  Collection: ${collectionName}`);
      console.log(`    Documents: ${count.toLocaleString()}`);
      console.log(`    Size: ${sizeInMB.toFixed(2)} MB`);

      // Check thresholds
      if (count > THRESHOLDS.MAX_DOCUMENT_COUNT) {
        logStatus("WARNING", `Document count (${count.toLocaleString()}) exceeds threshold (${THRESHOLDS.MAX_DOCUMENT_COUNT.toLocaleString()})`);
      } else if (sizeInMB > THRESHOLDS.MAX_COLLECTION_SIZE_MB) {
        logStatus("WARNING", `Collection size (${sizeInMB.toFixed(2)} MB) exceeds threshold (${THRESHOLDS.MAX_COLLECTION_SIZE_MB} MB)`);
      } else {
        logStatus("OK", "Within thresholds");
      }
      console.log();

    } catch (error) {
      console.log(`  Collection: ${collectionName}`);
      logStatus("WARNING", `Error checking collection: ${error.message}`);
      console.log();
    }
  }
}

async function checkStaleData(db) {
  console.log("\n========================================");
  console.log("STALE DATA CHECK");
  console.log("========================================\n");

  // Check old cart items (older than 30 days)
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldCartItems = await db.collection("cartitems").countDocuments({
      date: { $lt: thirtyDaysAgo }
    });

    console.log(`  Old Cart Items (>30 days): ${oldCartItems.toLocaleString()}`);
    if (oldCartItems > THRESHOLDS.MAX_OLD_CARTITEMS_COUNT) {
      logStatus("WARNING", `Old cart items (${oldCartItems.toLocaleString()}) exceeds threshold (${THRESHOLDS.MAX_OLD_CARTITEMS_COUNT.toLocaleString()})`);
    } else {
      logStatus("OK", "Within threshold");
    }
  } catch (error) {
    logStatus("WARNING", `Error checking old cart items: ${error.message}`);
  }
  console.log();

  // Check expired sessions
  try {
    const now = new Date();
    const expiredSessions = await db.collection("sessions").countDocuments({
      expires: { $lt: now }
    });

    console.log(`  Expired Sessions: ${expiredSessions.toLocaleString()}`);
    if (expiredSessions > THRESHOLDS.MAX_OLD_SESSIONS_COUNT) {
      logStatus("WARNING", `Expired sessions (${expiredSessions.toLocaleString()}) exceeds threshold (${THRESHOLDS.MAX_OLD_SESSIONS_COUNT.toLocaleString()})`);
    } else {
      logStatus("OK", "Within threshold");
    }
  } catch (error) {
    logStatus("WARNING", `Error checking expired sessions: ${error.message}`);
  }
  console.log();
}

async function checkQueryPerformance(db) {
  console.log("\n========================================");
  console.log("QUERY PERFORMANCE");
  console.log("========================================\n");

  // Test simple findOne query
  try {
    const startTime = Date.now();
    await db.collection("products").findOne({ state: "published" });
    const duration = Date.now() - startTime;

    console.log(`  Simple findOne query: ${duration}ms`);
    if (duration > THRESHOLDS.MAX_RESPONSE_TIME_MS) {
      logStatus("WARNING", `Query time (${duration}ms) exceeds threshold (${THRESHOLDS.MAX_RESPONSE_TIME_MS}ms)`);
    } else {
      logStatus("OK", "Within threshold");
    }
  } catch (error) {
    logStatus("WARNING", `Error testing findOne query: ${error.message}`);
  }
  console.log();

  // Test find with limit query
  try {
    const startTime = Date.now();
    await db.collection("products")
      .find({ state: "published", inStock: true })
      .limit(10)
      .toArray();
    const duration = Date.now() - startTime;

    console.log(`  Find with filter query: ${duration}ms`);
    if (duration > THRESHOLDS.MAX_RESPONSE_TIME_MS) {
      logStatus("WARNING", `Query time (${duration}ms) exceeds threshold (${THRESHOLDS.MAX_RESPONSE_TIME_MS}ms)`);
    } else {
      logStatus("OK", "Within threshold");
    }
  } catch (error) {
    logStatus("WARNING", `Error testing find query: ${error.message}`);
  }
  console.log();
}

async function checkDatabaseInfo(db) {
  console.log("\n========================================");
  console.log("DATABASE INFORMATION");
  console.log("========================================\n");

  try {
    const stats = await db.stats();

    console.log(`  Database: ${stats.db}`);
    console.log(`  Collections: ${stats.collections}`);
    console.log(`  Data Size: ${(stats.dataSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Storage Size: ${(stats.storageSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Indexes: ${stats.indexes}`);
    console.log(`  Index Size: ${(stats.indexSize / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`  Average Object Size: ${stats.avgObjSize ? stats.avgObjSize.toFixed(2) : 'N/A'} bytes`);

    logStatus("OK", "Database stats retrieved successfully");
  } catch (error) {
    logStatus("WARNING", `Error retrieving database stats: ${error.message}`);
  }
  console.log();
}

async function runHealthCheck() {
  const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dial-a-drink-kenya";
  const client = new MongoClient(uri);

  try {
    console.log("========================================");
    console.log("MongoDB Health Check");
    console.log("========================================");
    console.log(`Connection URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Connect to MongoDB
    await client.connect();
    console.log("\n✓ Successfully connected to MongoDB");

    const db = client.db();

    // Run all health checks
    await checkCollectionStats(db);
    await checkStaleData(db);
    await checkQueryPerformance(db);
    await checkDatabaseInfo(db);

    // Summary
    console.log("\n========================================");
    console.log("SUMMARY");
    console.log("========================================\n");

    let healthStatus = "HEALTHY";
    let exitCode = 0;

    if (hasCritical) {
      healthStatus = "CRITICAL";
      exitCode = 2;
      console.log("  Health Status: CRITICAL");
      console.log("  Action Required: Critical issues detected that require immediate attention");
    } else if (hasWarnings) {
      healthStatus = "WARNING";
      exitCode = 1;
      console.log("  Health Status: WARNING");
      console.log("  Action Required: Some issues detected that should be reviewed");
    } else {
      console.log("  Health Status: HEALTHY");
      console.log("  All checks passed successfully");
    }

    console.log("\n========================================\n");

    process.exit(exitCode);

  } catch (error) {
    console.error("\n✗ ERROR: Failed to perform health check");
    console.error(`  ${error.message}`);
    console.error("\n========================================\n");
    process.exit(2);
  } finally {
    await client.close();
  }
}

// Run the health check
runHealthCheck();
