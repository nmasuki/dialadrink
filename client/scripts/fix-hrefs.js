#!/usr/bin/env node
/**
 * Fix slug-like fields (href, key, slug) across all collections.
 * Run on the server: node scripts/fix-hrefs.js [--dry-run]
 *
 * Normalizes values to URL-friendly slugs:
 *  - lowercase
 *  - no special characters (only alphanumeric and hyphens)
 *  - spaces / underscores / multiple hyphens collapsed to single hyphen
 *  - no leading or trailing hyphens
 *
 * Deduplication:
 *  - Tracks slugs globally across ALL collections (since they share the
 *    [...slug] catch-all route). If two entities normalize to the same
 *    slug, the lower-priority one gets -2, -3, etc. appended.
 *  - Priority order matches fix-duplicate-slugs.js (highest keeps its slug):
 *    categories > subcategories > brands > products > pages > locations > menuitems > promos
 */

const { MongoClient } = require("mongodb");

const MONGO_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dial-a-drink-kenya";

const DRY_RUN = process.argv.includes("--dry-run");

/** Convert a single path segment to a clean URL slug */
function toSlugSegment(str) {
  return str
    .toLowerCase()
    .trim()
    .replace(/&/g, "-and-")           // & → -and-
    .replace(/[''"]/g, "")            // remove quotes/apostrophes
    .replace(/[^a-z0-9\-]/g, "-")    // non-alphanumeric → hyphen
    .replace(/-{2,}/g, "-")           // collapse multiple hyphens
    .replace(/^-|-$/g, "");           // trim leading/trailing hyphens
}

/** Convert a string to a clean URL slug, preserving path separators */
function toSlug(str) {
  // If the value contains slashes (it's a path), slugify each segment
  if (str.includes("/")) {
    return str
      .split("/")
      .map((seg) => (seg ? toSlugSegment(seg) : ""))
      .join("/")
      .replace(/\/{2,}/g, "/");       // collapse double slashes
  }
  return toSlugSegment(str);
}

/** Normalize for comparison (strip leading slash, lowercase) */
function normalize(val) {
  if (!val || typeof val !== "string") return null;
  return val.toLowerCase().replace(/^\//, "").trim() || null;
}

/**
 * Collections + fields in PRIORITY order (highest first keeps its slug).
 * Each entry: [collectionName, field, label]
 */
const TARGETS = [
  ["productcategories",     "key",  "Category"],
  ["productcategories",     "href", "Category (href)"],
  ["productcategories",     "slug", "Category (slug)"],
  ["productsubcategories",  "key",  "Subcategory"],
  ["productsubcategories",  "href", "Subcategory (href)"],
  ["productsubcategories",  "slug", "Subcategory (slug)"],
  ["productbrands",         "href", "Brand"],
  ["productbrands",         "key",  "Brand (key)"],
  ["productbrands",         "slug", "Brand (slug)"],
  ["products",              "href", "Product"],
  ["products",              "key",  "Product (key)"],
  ["products",              "slug", "Product (slug)"],
  ["pages",                 "href", "Page (href)"],
  ["pages",                 "key",  "Page (key)"],
  ["pages",                 "slug", "Page (slug)"],
  ["locations",             "href", "Location"],
  ["locations",             "key",  "Location (key)"],
  ["locations",             "slug", "Location (slug)"],
  ["menuitems",             "href", "MenuItem"],
  ["menuitems",             "key",  "MenuItem (key)"],
  ["menuitems",             "slug", "MenuItem (slug)"],
  ["promos",                "key",  "Promo"],
  ["promos",                "href", "Promo (href)"],
  ["promos",                "slug", "Promo (slug)"],
  ["categories",            "key",  "Legacy Category"],
  ["categories",            "href", "Legacy Category (href)"],
  ["categories",            "slug", "Legacy Category (slug)"],
];

async function main() {
  if (DRY_RUN) console.log("=== DRY RUN (no changes will be written) ===\n");

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  console.log("Connected to MongoDB\n");

  const db = client.db();

  // Global set of normalized slugs claimed across all collections.
  // Higher-priority collections are processed first, so they "win" a slug.
  const globalSlugs = new Set();
  let totalFixed = 0;
  let totalDupes = 0;
  const fixesByCollection = {};

  for (const [collName, field, typeLabel] of TARGETS) {
    const collection = db.collection(collName);
    const docs = await collection
      .find({ [field]: { $exists: true, $ne: null } })
      .project({ [field]: 1, name: 1, title: 1, label: 1 })
      .toArray();

    if (docs.length === 0) continue;

    const collKey = `${collName}.${field}`;
    if (!fixesByCollection[collKey]) fixesByCollection[collKey] = 0;

    // Compute new slug for every doc and separate into clean vs dirty.
    // "Clean" = value is already a valid slug and doesn't need changing.
    // "Dirty" = value needs normalizing (different case, spaces, etc.).
    const entries = [];
    for (const doc of docs) {
      const original = doc[field];
      if (!original || typeof original !== "string") continue;

      if (original === "/") {
        globalSlugs.add("/");
        continue;
      }

      const hasLeadingSlash = original.startsWith("/");
      const raw = hasLeadingSlash ? original.slice(1) : original;
      const slug = toSlug(raw);
      if (!slug) continue;

      const newValue = hasLeadingSlash ? `/${slug}` : slug;
      const label = doc.name || doc.title || doc.label || String(doc._id);
      entries.push({ doc, original, slug, hasLeadingSlash, newValue, label, needsFix: newValue !== original });
    }

    // Pass 1: Claim all already-clean slugs first.
    // This prevents a dirty doc from stealing a slug that belongs to
    // an existing clean doc (which would cause a unique-index violation).
    for (const entry of entries) {
      if (!entry.needsFix) {
        globalSlugs.add(normalize(entry.original));
      }
    }

    // Pass 2: Process dirty entries — normalize + dedup against globalSlugs.
    for (const entry of entries) {
      if (!entry.needsFix) continue;

      let finalSlug = entry.slug;
      let counter = 2;
      let isDupe = false;

      if (globalSlugs.has(normalize(finalSlug))) {
        isDupe = true;
        while (globalSlugs.has(normalize(`${entry.slug}-${counter}`))) {
          counter++;
        }
        finalSlug = `${entry.slug}-${counter}`;
      }

      const newValue = entry.hasLeadingSlash ? `/${finalSlug}` : finalSlug;
      globalSlugs.add(normalize(finalSlug));

      const reason = isDupe ? " (duplicate resolved)" : "";
      console.log(`  [${collName}.${field}] ${typeLabel}: "${entry.label}": "${entry.original}" → "${newValue}"${reason}`);

      if (!DRY_RUN) {
        await collection.updateOne({ _id: entry.doc._id }, { $set: { [field]: newValue } });
      }
      fixesByCollection[collKey]++;
      totalFixed++;
      if (isDupe) totalDupes++;
    }
  }

  // Summary
  console.log("\n--- Summary ---");
  for (const [key, count] of Object.entries(fixesByCollection)) {
    if (count > 0) console.log(`  ${key}: ${count} fixed`);
  }
  if (totalFixed === 0) {
    console.log("  All slugs already clean. No changes needed.");
  }
  console.log(`\nTotal: ${totalFixed} slug(s) fixed, ${totalDupes} duplicate(s) resolved${DRY_RUN ? " (dry run)" : ""}.`);
  await client.close();
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
