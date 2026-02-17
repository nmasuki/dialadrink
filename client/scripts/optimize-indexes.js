#!/usr/bin/env node

/**
 * MongoDB Index Optimization Script
 *
 * This script creates optimized indexes for all collections in the Dial-a-Drink database.
 * It helps improve query performance by ensuring proper indexes are in place.
 *
 * Usage: node optimize-indexes.js
 * Environment: Set MONGODB_URI to override default connection string
 */

const { MongoClient } = require("mongodb");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dial-a-drink-kenya";

async function optimizeIndexes() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected successfully to MongoDB\n");

    const db = client.db();

    // Products Collection
    console.log("=".repeat(60));
    console.log("PRODUCTS COLLECTION");
    console.log("=".repeat(60));
    const products = db.collection("products");

    const productIndexes = [
      { key: { state: 1 }, options: { background: true }, name: "state_1" },
      { key: { category: 1 }, options: { background: true }, name: "category_1" },
      { key: { brand: 1 }, options: { background: true }, name: "brand_1" },
      { key: { href: 1 }, options: { background: true, unique: true }, name: "href_1_unique" },
      { key: { inStock: 1 }, options: { background: true }, name: "inStock_1" },
      { key: { popularity: -1 }, options: { background: true }, name: "popularity_-1" },
      { key: { price: 1 }, options: { background: true }, name: "price_1" },
      { key: { state: 1, inStock: 1, category: 1 }, options: { background: true }, name: "state_1_inStock_1_category_1" },
      { key: { state: 1, inStock: 1, brand: 1 }, options: { background: true }, name: "state_1_inStock_1_brand_1" },
      { key: { state: 1, onOffer: 1 }, options: { background: true }, name: "state_1_onOffer_1" },
      { key: { name: "text", tags: "text", description: "text" }, options: { background: true }, name: "text_search" }
    ];

    for (const indexDef of productIndexes) {
      try {
        console.log(`Creating index: ${indexDef.name}`);
        await products.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Index created successfully`);
      } catch (error) {
        if (error.code === 85 || error.codeName === "IndexOptionsConflict" || error.message.includes("already exists")) {
          console.log(`  → Index already exists, skipping`);
        } else {
          console.error(`  ✗ Error creating index: ${error.message}`);
        }
      }
    }

    console.log("\nCurrent indexes on products collection:");
    const productIndexList = await products.indexes();
    productIndexList.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // Orders Collection
    console.log("\n" + "=".repeat(60));
    console.log("ORDERS COLLECTION");
    console.log("=".repeat(60));
    const orders = db.collection("orders");

    const orderIndexes = [
      { key: { date: -1 }, options: { background: true }, name: "date_-1" },
      { key: { state: 1 }, options: { background: true }, name: "state_1" },
      { key: { key: 1 }, options: { background: true, unique: true }, name: "key_1_unique" },
      { key: { date: -1, state: 1 }, options: { background: true }, name: "date_-1_state_1" }
    ];

    for (const indexDef of orderIndexes) {
      try {
        console.log(`Creating index: ${indexDef.name}`);
        await orders.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Index created successfully`);
      } catch (error) {
        if (error.code === 85 || error.codeName === "IndexOptionsConflict" || error.message.includes("already exists")) {
          console.log(`  → Index already exists, skipping`);
        } else {
          console.error(`  ✗ Error creating index: ${error.message}`);
        }
      }
    }

    console.log("\nCurrent indexes on orders collection:");
    const orderIndexList = await orders.indexes();
    orderIndexList.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // CartItems Collection
    console.log("\n" + "=".repeat(60));
    console.log("CARTITEMS COLLECTION");
    console.log("=".repeat(60));
    const cartitems = db.collection("cartitems");

    const cartItemIndexes = [
      { key: { date: -1 }, options: { background: true }, name: "date_-1" },
      { key: { state: 1 }, options: { background: true }, name: "state_1" },
      { key: { product: 1 }, options: { background: true }, name: "product_1" }
    ];

    for (const indexDef of cartItemIndexes) {
      try {
        console.log(`Creating index: ${indexDef.name}`);
        await cartitems.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Index created successfully`);
      } catch (error) {
        if (error.code === 85 || error.codeName === "IndexOptionsConflict" || error.message.includes("already exists")) {
          console.log(`  → Index already exists, skipping`);
        } else {
          console.error(`  ✗ Error creating index: ${error.message}`);
        }
      }
    }

    console.log("\nCurrent indexes on cartitems collection:");
    const cartItemIndexList = await cartitems.indexes();
    cartItemIndexList.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // AppUsers Collection
    console.log("\n" + "=".repeat(60));
    console.log("APPUSERS COLLECTION");
    console.log("=".repeat(60));
    const appusers = db.collection("appusers");

    const appUserIndexes = [
      { key: { phoneNumber: 1 }, options: { background: true }, name: "phoneNumber_1" },
      { key: { email: 1 }, options: { background: true, sparse: true }, name: "email_1_sparse" }
    ];

    for (const indexDef of appUserIndexes) {
      try {
        console.log(`Creating index: ${indexDef.name}`);
        await appusers.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Index created successfully`);
      } catch (error) {
        if (error.code === 85 || error.codeName === "IndexOptionsConflict" || error.message.includes("already exists")) {
          console.log(`  → Index already exists, skipping`);
        } else {
          console.error(`  ✗ Error creating index: ${error.message}`);
        }
      }
    }

    console.log("\nCurrent indexes on appusers collection:");
    const appUserIndexList = await appusers.indexes();
    appUserIndexList.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // ProductCategories Collection
    console.log("\n" + "=".repeat(60));
    console.log("PRODUCTCATEGORIES COLLECTION");
    console.log("=".repeat(60));
    const productcategories = db.collection("productcategories");

    const categoryIndexes = [
      { key: { key: 1 }, options: { background: true, unique: true }, name: "key_1_unique" }
    ];

    for (const indexDef of categoryIndexes) {
      try {
        console.log(`Creating index: ${indexDef.name}`);
        await productcategories.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Index created successfully`);
      } catch (error) {
        if (error.code === 85 || error.codeName === "IndexOptionsConflict" || error.message.includes("already exists")) {
          console.log(`  → Index already exists, skipping`);
        } else {
          console.error(`  ✗ Error creating index: ${error.message}`);
        }
      }
    }

    console.log("\nCurrent indexes on productcategories collection:");
    const categoryIndexList = await productcategories.indexes();
    categoryIndexList.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // ProductBrands Collection
    console.log("\n" + "=".repeat(60));
    console.log("PRODUCTBRANDS COLLECTION");
    console.log("=".repeat(60));
    const productbrands = db.collection("productbrands");

    const brandIndexes = [
      { key: { href: 1 }, options: { background: true }, name: "href_1" }
    ];

    for (const indexDef of brandIndexes) {
      try {
        console.log(`Creating index: ${indexDef.name}`);
        await productbrands.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Index created successfully`);
      } catch (error) {
        if (error.code === 85 || error.codeName === "IndexOptionsConflict" || error.message.includes("already exists")) {
          console.log(`  → Index already exists, skipping`);
        } else {
          console.error(`  ✗ Error creating index: ${error.message}`);
        }
      }
    }

    console.log("\nCurrent indexes on productbrands collection:");
    const brandIndexList = await productbrands.indexes();
    brandIndexList.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // ProductSubcategories Collection
    console.log("\n" + "=".repeat(60));
    console.log("PRODUCTSUBCATEGORIES COLLECTION");
    console.log("=".repeat(60));
    const productsubcategories = db.collection("productsubcategories");

    const subcategoryIndexes = [
      { key: { key: 1 }, options: { background: true }, name: "key_1" },
      { key: { category: 1 }, options: { background: true }, name: "category_1" }
    ];

    for (const indexDef of subcategoryIndexes) {
      try {
        console.log(`Creating index: ${indexDef.name}`);
        await productsubcategories.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Index created successfully`);
      } catch (error) {
        if (error.code === 85 || error.codeName === "IndexOptionsConflict" || error.message.includes("already exists")) {
          console.log(`  → Index already exists, skipping`);
        } else {
          console.error(`  ✗ Error creating index: ${error.message}`);
        }
      }
    }

    console.log("\nCurrent indexes on productsubcategories collection:");
    const subcategoryIndexList = await productsubcategories.indexes();
    subcategoryIndexList.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // Pages Collection
    console.log("\n" + "=".repeat(60));
    console.log("PAGES COLLECTION");
    console.log("=".repeat(60));
    const pages = db.collection("pages");

    const pageIndexes = [
      { key: { href: 1 }, options: { background: true }, name: "href_1" },
      { key: { key: 1 }, options: { background: true }, name: "key_1" },
      { key: { state: 1 }, options: { background: true }, name: "state_1" }
    ];

    for (const indexDef of pageIndexes) {
      try {
        console.log(`Creating index: ${indexDef.name}`);
        await pages.createIndex(indexDef.key, indexDef.options);
        console.log(`  ✓ Index created successfully`);
      } catch (error) {
        if (error.code === 85 || error.codeName === "IndexOptionsConflict" || error.message.includes("already exists")) {
          console.log(`  → Index already exists, skipping`);
        } else {
          console.error(`  ✗ Error creating index: ${error.message}`);
        }
      }
    }

    console.log("\nCurrent indexes on pages collection:");
    const pageIndexList = await pages.indexes();
    pageIndexList.forEach(idx => console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`));

    // Collection Statistics
    console.log("\n" + "=".repeat(60));
    console.log("COLLECTION STATISTICS");
    console.log("=".repeat(60));

    const collections = [
      { name: "products", collection: products },
      { name: "orders", collection: orders },
      { name: "cartitems", collection: cartitems },
      { name: "appusers", collection: appusers },
      { name: "productcategories", collection: productcategories },
      { name: "productbrands", collection: productbrands },
      { name: "productsubcategories", collection: productsubcategories },
      { name: "pages", collection: pages }
    ];

    for (const { name, collection } of collections) {
      try {
        const stats = await collection.stats();
        console.log(`\n${name.toUpperCase()}:`);
        console.log(`  Document Count: ${stats.count.toLocaleString()}`);
        console.log(`  Total Index Size: ${(stats.totalIndexSize / 1024).toFixed(2)} KB`);
        console.log(`  Storage Size: ${(stats.size / 1024).toFixed(2)} KB`);
        console.log(`  Average Document Size: ${stats.avgObjSize ? stats.avgObjSize.toFixed(2) : 0} bytes`);
        console.log(`  Number of Indexes: ${stats.nindexes}`);
      } catch (error) {
        console.log(`\n${name.toUpperCase()}:`);
        console.log(`  Collection may not exist or is empty`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Index optimization completed successfully!");
    console.log("=".repeat(60));

  } catch (error) {
    console.error("Error during index optimization:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nMongoDB connection closed.");
  }
}

// Run the optimization
optimizeIndexes().catch(console.error);
