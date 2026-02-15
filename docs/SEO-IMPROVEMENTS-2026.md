# SEO Improvement Plan - Dial A Drink Kenya

**Priority levels:** P0 = Critical (do first), P1 = High, P2 = Medium, P3 = Nice-to-have

---

## P0 - Critical (Week 1-2)

### 1. Add Product JSON-LD Schema to Product Detail Pages
**File:** `client/src/app/products/[slug]/page.tsx`
**Impact:** Enables rich results in Google (price, availability, rating stars, images)

Add `Product` schema with:
- `@type: "Product"`
- `name`, `description`, `image`, `brand`, `sku`
- `offers` with `price`, `priceCurrency: "KES"`, `availability` (InStock/OutOfStock), `url`
- `aggregateRating` (if product has ratings)
- `category`

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Johnnie Walker Black Label",
  "image": "https://res.cloudinary.com/...",
  "description": "...",
  "brand": { "@type": "Brand", "name": "Johnnie Walker" },
  "category": "Whisky",
  "offers": {
    "@type": "Offer",
    "price": "4500",
    "priceCurrency": "KES",
    "availability": "https://schema.org/InStock",
    "seller": { "@type": "Organization", "name": "Dial A Drink Kenya" },
    "url": "https://www.dialadrinkkenya.com/products/johnnie-walker-black-label"
  }
}
```

### 2. Add FAQPage Schema
**File:** `client/src/app/faq/page.tsx`
**Impact:** FAQ rich results in Google (expandable answers directly in search results)

The FAQ data is already well-structured as an array. Just add the JSON-LD:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How do I place an order?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Simply browse our products..."
      }
    }
  ]
}
```

### 3. Fix Contact Page SSR
**File:** `client/src/app/contact/page.tsx`
**Impact:** Contact page currently invisible to crawlers

- Extract the static content (address, phone, hours) into a server component
- Keep only the form as a `"use client"` child component
- Add metadata export with title + description
- Add `ContactPoint` schema

### 4. Add Google Analytics (GA4) + Search Console Verification
**File:** `client/src/app/layout.tsx`
**Impact:** Cannot measure anything without analytics

- Add GA4 script tag or use `@next/third-parties` package
- Add Google Search Console verification meta tag
- Submit sitemap to Search Console

### 5. Fix Sitemap
**File:** `client/src/app/sitemap.ts`
**Impact:** Better crawl budget allocation, more pages indexed

Changes needed:
- **Remove** cart and checkout pages (no SEO value)
- **Add** brand pages (e.g., `/johnnie-walker`, `/absolut`)
- **Add** subcategory pages (e.g., `/single-malt-whiskies`, `/red-wine`)
- Use clean category URLs (`/whisky`) instead of query-param URLs (`/products?category=whisky`)
- Use actual `modifiedDate` from DB for products, not `new Date()`

---

## P1 - High Priority (Week 3-4)

### 6. Add BreadcrumbList Schema
**Files:** Product detail page, category pages
**Impact:** Breadcrumb rich results in Google (shows path like Home > Whisky > Single Malt)

Add alongside existing HTML breadcrumbs:
```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.dialadrinkkenya.com" },
    { "@type": "ListItem", "position": 2, "name": "Whisky", "item": "https://www.dialadrinkkenya.com/whisky" },
    { "@type": "ListItem", "position": 3, "name": "Johnnie Walker Black Label" }
  ]
}
```

### 7. Add WebSite Schema with SearchAction
**File:** `client/src/app/layout.tsx`
**Impact:** Enables sitelinks search box in Google results

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Dial A Drink Kenya",
  "url": "https://www.dialadrinkkenya.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://www.dialadrinkkenya.com/products?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
```

### 8. Improve Category Page Metadata
**File:** `client/src/app/[...slug]/page.tsx`
**Impact:** Better CTR from search results

Current description is generic for all categories: *"Order online with fast delivery across Nairobi."*

Improve to be category-specific:
- Whisky: "Buy whisky online in Nairobi. Single malts, blended scotch, bourbon & more. Fast delivery from Dial A Drink Kenya."
- Wine: "Order wine online in Nairobi. Red, white, rose & sparkling wines. Fast delivery from Dial A Drink Kenya."
- etc.

Add `ItemList` schema listing the first N products on the page.

### 9. Enhance Product Detail Page OG Tags
**File:** `client/src/app/products/[slug]/page.tsx`
**Impact:** Better social sharing, potential rich pins on Pinterest

Add to metadata:
- `openGraph.type: "product"` (not "website")
- Twitter product card data
- Explicit canonical URL

### 10. Switch to `next/font` for Google Fonts
**File:** `client/src/app/layout.tsx`
**Impact:** Eliminates render-blocking CSS, no layout shift, better CLS score

Replace the `<link>` font loading with:
```tsx
import { Montserrat, Open_Sans } from "next/font/google";
const montserrat = Montserrat({ subsets: ["latin"], variable: "--font-montserrat" });
const openSans = Open_Sans({ subsets: ["latin"], variable: "--font-opensans" });
```

---

## P2 - Medium Priority (Week 5-8)

### 11. Add Old URL Redirects
**File:** `client/next.config.mjs` (or middleware)
**Impact:** Preserve backlink equity from old site

Map old KeystoneJS URLs to new Next.js URLs. Common patterns:
- Old product URLs → new `/products/{slug}` URLs
- Old category URLs → new `/{category}` URLs
- Old blog URLs → appropriate redirect or 410

### 12. Implement ISR for Key Pages
**Files:** Home page, category pages, product pages
**Impact:** Faster TTFB, better Core Web Vitals, reduced server load

Replace `force-dynamic` with ISR:
```tsx
export const revalidate = 300; // 5 minutes for home page
export const revalidate = 600; // 10 minutes for category pages
export const revalidate = 3600; // 1 hour for product pages
```

### 13. Generate SEO-Optimized Image Alt Text
**Impact:** Image search traffic, accessibility

Create a helper that generates alt text:
```ts
function productAltText(product: IProduct): string {
  const brand = typeof product.brand === "object" ? product.brand.name : "";
  const category = typeof product.category === "object" ? product.category.name : "";
  return `${product.name}${brand ? ` by ${brand}` : ""}${category ? ` - ${category}` : ""} | Buy Online Nairobi`;
}
```

### 14. Add Delivery/Service Schema to Delivery Page
**File:** `client/src/app/delivery/page.tsx`
**Impact:** Rich results for delivery-related searches

Add `Service` schema with delivery areas, price specifications, and operating hours.

### 15. Enhance Robots.txt
**File:** `client/src/app/robots.ts`
**Impact:** Better crawl budget management

Add:
- Disallow `/admin/`
- Disallow `/cart` (user-specific, no SEO value)
- Add crawl-delay for aggressive bots
- Separate rules for Googlebot vs others

### 16. Add `rel="nofollow"` to External Links
**Impact:** Preserve link equity

Audit outgoing links (payment providers, social media) and add `rel="nofollow"` where appropriate.

---

## P3 - Nice to Have (Month 2-3)

### 17. Create Service Area Landing Pages
**Impact:** Dominate neighborhood-specific searches like "alcohol delivery Westlands"

Create pages like:
- `/delivery/westlands` - "Alcohol Delivery in Westlands, Nairobi"
- `/delivery/kilimani` - "Alcohol Delivery in Kilimani, Nairobi"
- `/delivery/karen` - "Alcohol Delivery in Karen, Nairobi"

Each with unique content about delivery times, coverage, and local context.

### 18. Add Blog/Content Section
**Impact:** Capture informational search intent, build authority

Topics:
- "Best Whiskies Under KES 5,000"
- "Wine Pairing Guide for Kenyan Cuisine"
- "How to Host a Party in Nairobi"
- "Difference Between Scotch, Bourbon, and Irish Whiskey"

### 19. Implement Review/Rating Collection
**Impact:** User-generated content, AggregateRating schema, trust signals

Add product review functionality and surface `AggregateRating` in Product schema.

### 20. Add Structured Data for Offers/Promotions
**Impact:** Special offer rich results

When products are on sale, add `Offer` schema with `priceValidUntil`, `discount`, etc.

---

## Quick Wins Summary (Can Be Done in 1-2 Days)

| # | Task | File | Impact |
|---|------|------|--------|
| 1 | FAQPage schema | `faq/page.tsx` | Rich FAQ results in Google |
| 2 | WebSite + SearchAction schema | `layout.tsx` | Sitelinks search box |
| 3 | Remove cart/checkout from sitemap | `sitemap.ts` | Better crawl budget |
| 4 | Add brands/subcategories to sitemap | `sitemap.ts` | More pages indexed |
| 5 | Fix contact page metadata | `contact/page.tsx` | Page becomes crawlable |
| 6 | Robots.txt: disallow /admin, /cart | `robots.ts` | Crawl budget |
| 7 | Category-specific descriptions | `[...slug]/page.tsx` | Better CTR |

---

## Measurement Plan

After implementing changes, track:

1. **Google Search Console:**
   - Indexing coverage (target: 90%+ of product pages indexed)
   - Rich results report (Product, FAQ, Breadcrumb appearances)
   - Core Web Vitals pass rate
   - Click-through rate by page type

2. **Google Analytics (GA4):**
   - Organic traffic growth (target: +30% in 3 months)
   - Pages per session (target: 2.5+ from current 1.47)
   - Average session duration (target: 60s+ from current 32s)
   - Conversion rate by traffic source

3. **Third-Party Tools:**
   - Domain Rating growth (Ahrefs)
   - Keyword ranking positions for target terms
   - Core Web Vitals scores (PageSpeed Insights)
