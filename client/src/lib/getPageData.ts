import { connectDB } from "./db";
import { Page } from "@/models";
import type { IPage } from "@/models/Page";

/**
 * Fetch a page document from the `pages` collection by matching href or key.
 * Returns null if no published page matches — callers should fall back to defaults.
 */
export async function getPageData(href: string): Promise<IPage | null> {
  try {
    await connectDB();

    // Normalize: ensure leading slash and also try without
    const withSlash = href.startsWith("/") ? href : `/${href}`;
    const withoutSlash = href.startsWith("/") ? href.slice(1) : href;

    const page = await Page.findOne({
      state: "published",
      $or: [
        { href: withSlash },
        { href: withoutSlash },
        { key: withoutSlash },
        { key: withSlash },
      ],
    }).lean();

    if (!page) return null;

    return JSON.parse(JSON.stringify(page)) as IPage;
  } catch (error) {
    console.error("[getPageData] Error fetching page for", href, error);
    return null;
  }
}
