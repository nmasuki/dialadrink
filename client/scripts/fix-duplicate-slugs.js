#!/usr/bin/env node
/**
 * Fix duplicate slug/href/key values across collections.
 * Run on the server: node scripts/fix-duplicate-slugs.js [--dry-run]
 *
 * When two entities share the same slug (e.g. a brand and a subcategory both
 * have "bourbon"), the lower-priority one gets "-2" appended.
 *
 * Priority (highest keeps its slug):
 *   1. Categories (productcategories.key)
 *   2. Subcategories (productsubcategories.key)
 *   3. Brands (productbrands.href)
 *   4. Products (products.href)
 *   5. Pages (pages.href, pages.key)
 *   6. Locations (locations.href)
 *   7. Menu Items (menuitems.href)
 *   8. Promos (promos.key)
 */

const { MongoClient } = require("mongodb");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dial-a-drink-kenya";

const DRY_RUN = process.argv.includes("--dry-run");

/** Normalize a slug for comparison (lowercase, strip leading slash) */
function normalize(val) {
  if (!val || typeof val !== "string") return null;
  return val.toLowerCase().replace(/^\//, "").trim() || null;
}

/**
 * Collections in priority order.
 * Each entry: [collectionName, field, label]
 * Higher in the list = higher priority (keeps its slug on collision).
 */
const SOURCES = [
  ["productcategories", "key", "Category"],
  ["productsubcategories", "key", "Subcategory"],
  ["productbrands", "href", "Brand"],
  ["products", "href", "Product"],
  ["pages", "href", "Page (href)"],
  ["pages", "key", "Page (key)"],
  ["locations", "href", "Location"],
  ["menuitems", "href", "MenuItem"],
  ["promos", "key", "Promo"],
];

async function main() {
  if (DRY_RUN) console.log("=== DRY RUN (no changes will be written) ===\n");

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB\n");
  const db = client.db();

  // Phase 1: Collect all slugs from all sources in priority order
  // The first occurrence of a slug "wins"
  const claimed = new Map(); // normalized slug -> { collection, field, docId, label }
  const fixes = []; // { collection, field, docId, label, oldSlug, newSlug }

  for (const [collName, field, typeLabel] of SOURCES) {
    const collection = db.collection(collName);
    const docs = await collection
      .find({ [field]: { $exists: true, $ne: null } })
      .project({ [field]: 1, name: 1, title: 1, label: 1 })
      .toArray();

    // Also detect intra-collection duplicates
    const seenInCollection = new Map(); // normalized -> first doc id

    for (const doc of docs) {
      const rawSlug = doc[field];
      if (!rawSlug || typeof rawSlug !== "string") continue;

      const norm = normalize(rawSlug);
      if (!norm) continue;

      const docLabel = doc.name || doc.title || doc.label || String(doc._id);

      // Check intra-collection duplicate
      if (seenInCollection.has(norm)) {
        // This is a duplicate within the same collection
        const winner = seenInCollection.get(norm);
        let newSlug = rawSlug;
        let counter = 2;
        const hasSlash = rawSlug.startsWith("/");
        const base = hasSlash ? rawSlug.slice(1) : rawSlug;
        while (
          claimed.has(normalize(hasSlash ? `/${base}-${counter}` : `${base}-${counter}`)) ||
          seenInCollection.has(normalize(`${base}-${counter}`))
        ) {
          counter++;
        }
        newSlug = hasSlash ? `/${base}-${counter}` : `${base}-${counter}`;

        fixes.push({
          collection: collName,
          field,
          docId: doc._id,
          label: `${typeLabel}: ${docLabel}`,
          oldSlug: rawSlug,
          newSlug,
        });

        const newNorm = normalize(newSlug);
        claimed.set(newNorm, { collection: collName, field, docId: doc._id });
        seenInCollection.set(newNorm, doc._id);
        continue;
      }

      seenInCollection.set(norm, doc._id);

      // Check cross-collection collision
      if (claimed.has(norm)) {
        const owner = claimed.get(norm);
        // This doc loses — higher priority already claimed this slug
        let newSlug = rawSlug;
        let counter = 2;
        const hasSlash = rawSlug.startsWith("/");
        const base = hasSlash ? rawSlug.slice(1) : rawSlug;
        while (claimed.has(normalize(hasSlash ? `/${base}-${counter}` : `${base}-${counter}`))) {
          counter++;
        }
        newSlug = hasSlash ? `/${base}-${counter}` : `${base}-${counter}`;

        fixes.push({
          collection: collName,
          field,
          docId: doc._id,
          label: `${typeLabel}: ${docLabel}`,
          oldSlug: rawSlug,
          newSlug,
          collidedWith: `${owner.collection}.${owner.field}`,
        });

        const newNorm = normalize(newSlug);
        claimed.set(newNorm, { collection: collName, field, docId: doc._id });
      } else {
        // No collision — claim this slug
        claimed.set(norm, { collection: collName, field, docId: doc._id });
      }
    }
  }

  // Phase 2: Report and apply fixes
  if (fixes.length === 0) {
    console.log("No duplicate slugs found across any collections.");
  } else {
    console.log(`Found ${fixes.length} duplicate slug(s):\n`);
    for (const fix of fixes) {
      const reason = fix.collidedWith
        ? `collides with ${fix.collidedWith}`
        : `intra-collection duplicate`;
      console.log(
        `  [${fix.collection}.${fix.field}] ${fix.label}: "${fix.oldSlug}" -> "${fix.newSlug}" (${reason})`
      );

      if (!DRY_RUN) {
        await db
          .collection(fix.collection)
          .updateOne({ _id: fix.docId }, { $set: { [fix.field]: fix.newSlug } });
      }
    }
  }

  console.log(
    `\nDone. ${fixes.length} fix(es) ${DRY_RUN ? "would be applied (dry run)" : "applied"}.`
  );
  await client.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
