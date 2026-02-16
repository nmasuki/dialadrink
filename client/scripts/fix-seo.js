#!/usr/bin/env node
/**
 * SEO Fixes Script
 * Run on the server: node scripts/fix-seo.js
 *
 * Fixes:
 * 1. Shortens the homepage page title to under 60 chars (~580px)
 * 2. Updates the H1 heading to be longer and keyword-rich
 * 3. Updates meta description to include target keywords
 */

const { MongoClient } = require("mongodb");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dial-a-drink-kenya";

async function main() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB");

  const db = client.db();
  const pages = db.collection("pages");

  // Fix homepage page title (was ~700px, needs to be <580px / ~60 chars)
  const homepage = await pages.findOne({ slug: "/" });
  if (homepage) {
    console.log("\n--- Homepage (slug: /) ---");
    console.log("Current title:", homepage.title);
    console.log("Current h1:", homepage.h1);
    console.log("Current meta:", homepage.meta);

    const updates = {};

    // Fix title if too long (>60 chars)
    if (homepage.title && homepage.title.length > 60) {
      updates.title = "Alcohol Delivery Nairobi | Dial A Drink Kenya";
      console.log("\n=> Updating title to:", updates.title, `(${updates.title.length} chars)`);
    }

    // Fix H1 if too short (<20 chars)
    if (!homepage.h1 || homepage.h1.length < 20) {
      updates.h1 = "Alcohol Delivery in Nairobi — Order Drinks Online";
      console.log("=> Updating h1 to:", updates.h1, `(${updates.h1.length} chars)`);
    }

    // Update meta description to include keywords
    if (homepage.meta && homepage.meta.includes("free")) {
      updates.meta = "Order alcohol online in Nairobi. Whisky, beer, wine and spirits delivered fast. Call 0723688108. Dial A Drink Kenya.";
      console.log("=> Updating meta to:", updates.meta);
    }

    if (Object.keys(updates).length > 0) {
      await pages.updateOne({ slug: "/" }, { $set: updates });
      console.log("\n✓ Homepage updated successfully");
    } else {
      console.log("\n✓ Homepage already looks good, no changes needed");
    }
  } else {
    console.log("No homepage found with slug '/'");
  }

  // Also fix "Dial a Drink" -> "Dial A Drink" in any page titles
  const pagesWithLowerA = await pages.find({
    $or: [
      { title: /Dial a Drink/i },
      { h1: /Dial a Drink/i },
    ]
  }).toArray();

  for (const page of pagesWithLowerA) {
    const updates = {};
    if (page.title && page.title.includes("Dial a Drink")) {
      updates.title = page.title.replace(/Dial a Drink/g, "Dial A Drink");
    }
    if (page.h1 && page.h1.includes("Dial a Drink")) {
      updates.h1 = page.h1.replace(/Dial a Drink/g, "Dial A Drink");
    }
    if (Object.keys(updates).length > 0) {
      await pages.updateOne({ _id: page._id }, { $set: updates });
      console.log(`\n✓ Fixed branding on page "${page.slug}":`, updates);
    }
  }

  await client.close();
  console.log("\nDone. MongoDB connection closed.");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
