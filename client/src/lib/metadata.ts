import { Metadata } from "next";

const SITE_NAME = "Dial A Drink Kenya";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dialadrinkkenya.com";
const DEFAULT_OG_IMAGE = "https://res.cloudinary.com/nmasuki/image/upload/c_fill/icons/apple-icon-152x152.png";
const TWITTER_SITE = "@liqourdelivery";

interface BuildMetadataOptions {
  title: string;
  description: string;
  url?: string;
  images?: string[];
  canonical?: string;
  noindex?: boolean;
}

/**
 * Build a complete Metadata object with consistent OpenGraph and Twitter card fields.
 * Ensures every public page has siteName, url, and twitter site defined.
 */
export function buildMetadata({
  title,
  description,
  url,
  images,
  canonical,
  noindex,
}: BuildMetadataOptions): Metadata {
  const ogImages = images?.length
    ? images.map((img) => ({ url: img }))
    : [{ url: DEFAULT_OG_IMAGE, width: 152, height: 152, alt: SITE_NAME }];

  return {
    title,
    description,
    ...(canonical && { alternates: { canonical } }),
    ...(noindex && { robots: { index: false, follow: false } }),
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      url: url ? `${SITE_URL}${url}` : SITE_URL,
      title,
      description,
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_SITE,
      title,
      description,
      images: images?.length ? images : [DEFAULT_OG_IMAGE],
    },
  };
}
