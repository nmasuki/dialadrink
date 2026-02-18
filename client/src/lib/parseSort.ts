const ALLOWED_FIELDS = new Set([
  "price",
  "name",
  "popularity",
  "popularityRatio",
  "publishedDate",
  "createdAt",
]);

const ALIASES: Record<string, Record<string, 1 | -1>> = {
  newest: { publishedDate: -1 },
  popularity: { popularity: -1, popularityRatio: -1 },
  popularity_desc: { popularity: -1, popularityRatio: -1 },
  popularity_asc: { popularity: 1, popularityRatio: 1 },
};

/**
 * Parse a sort string like "price_desc", "name_asc", or aliases like "newest".
 * Returns a Mongoose-compatible sort object.
 */
export function parseSort(
  sort: string | undefined | null,
  fallback: Record<string, 1 | -1> = { popularity: -1 }
): Record<string, 1 | -1> {
  if (!sort) return fallback;

  // Check named aliases first
  if (ALIASES[sort]) return ALIASES[sort];

  // Parse field_asc / field_desc
  const match = sort.match(/^(.+)_(asc|desc)$/);
  if (match) {
    const [, field, dir] = match;
    if (ALLOWED_FIELDS.has(field)) {
      return { [field]: dir === "asc" ? 1 : -1 };
    }
  }

  // Plain field name (ascending)
  if (ALLOWED_FIELDS.has(sort)) {
    return { [sort]: 1 };
  }

  return fallback;
}

/**
 * Extract the active field and direction from a sort query param.
 */
export function parseSortParam(sort: string | undefined | null): { field: string; dir: "asc" | "desc" } {
  if (!sort || sort === "popularity") return { field: "popularity", dir: "desc" };
  if (sort === "newest") return { field: "publishedDate", dir: "desc" };
  const match = sort.match(/^(.+)_(asc|desc)$/);
  if (match) return { field: match[1], dir: match[2] as "asc" | "desc" };
  return { field: sort, dir: "asc" };
}

export const SORT_OPTIONS = [
  { field: "popularity", label: "Popular", defaultDir: "desc" as const },
  { field: "price", label: "Price", defaultDir: "asc" as const },
  { field: "publishedDate", label: "Newest", defaultDir: "desc" as const },
];
