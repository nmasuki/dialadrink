# SEO Audit - Dial A Drink Kenya (Next.js Migration)

**Date:** February 2026
**Site:** https://www.dialadrinkkenya.com
**Stack:** Next.js 16, React 19, MongoDB, Cloudinary

---

## Current SEO Status: What's In Place

### Metadata (Root Layout)
- Global title template: `%s | Dial A Drink Kenya`
- Default title: `Dial A Drink Kenya - Alcohol Delivery Nairobi`
- Keywords array, author/publisher meta
- Open Graph (type, locale, siteName, image)
- Twitter card (`summary_large_image`)
- Robots: index/follow with googleBot directives
- `metadataBase` set correctly

### Structured Data (JSON-LD)
- **Organization** schema (name, logo, sameAs, contactPoint, address)
- **LiquorStore** (LocalBusiness subtype) with geo, hours, areaServed, priceRange

### Dynamic Metadata (per-page `generateMetadata`)
- **Product detail** (`/products/[slug]`): title, description, OG image
- **Category/brand pages** (`/[...slug]`): dynamic titles with category/brand names
- **Offers page**: static title + description

### Sitemap (`/sitemap.xml`)
- Static pages (home, products, cart, checkout, contact, FAQ, delivery, terms, privacy)
- Dynamic product pages (priority 0.8)
- Dynamic category pages (priority 0.7)

### Robots (`/robots.txt`)
- Allows `/`, disallows `/api/`, `/checkout/success`, `/checkout/processing`
- Sitemap reference included

### Performance & Images
- Cloudinary CDN with AVIF/WebP
- Next.js `<Image>` with lazy loading
- Preconnect to Cloudinary and Google Fonts
- 60-day image cache TTL

---

## Gap Analysis: What's Missing vs Old Site

| Feature | Old Site (KeystoneJS) | New Site (Next.js) | Status |
|---------|----------------------|-------------------|--------|
| Organization schema | Partial | Yes | Improved |
| LocalBusiness schema | No | Yes (LiquorStore) | Improved |
| **Product schema** | Partial (via SEOMetadataEnhancer) | **Missing** | Regression |
| **BreadcrumbList schema** | No | **Missing** | Gap |
| **FAQPage schema** | No | **Missing** | Gap |
| **AggregateRating schema** | No | **Missing** | Gap |
| **WebSite search schema** | No | **Missing** | Gap |
| **Offer schema** | Partial | **Missing** | Regression |
| Sitemap | Enhanced generator | Basic dynamic | Similar |
| Canonical URLs | Explicit | Implicit via Next.js | Similar |
| Service area pages | Yes (`/alcohol-delivery-westlands`) | **Missing** | Regression |
| Image sitemap | No | No | Same gap |
| Blog/content pages | Yes (blog routes) | **Missing** | Regression |
| Meta per category | SEOMetadataEnhancer | generateMetadata | Similar |
| ISR/static generation | N/A (Express SSR) | **Not used** (force-dynamic) | Opportunity |
| Google Analytics/GSC | Configured | **Not configured** | Regression |

---

## Page-by-Page SEO Analysis

### Home Page (`/`)
- **Title:** "Dial A Drink Kenya - Alcohol Delivery Nairobi" -- Good
- **Missing:** No `WebSite` schema (sitelinks search box), no `ItemList` schema for featured products
- **Issue:** `force-dynamic` means no caching; consider ISR with revalidation

### Product Detail (`/products/[slug]`)
- **Title:** `{name} | Buy Online | Dial A Drink Kenya` -- Good
- **Missing:** No `Product` JSON-LD schema with price, availability, brand, rating
- **Missing:** No `BreadcrumbList` schema (HTML breadcrumbs exist but no structured data)
- **Missing:** No canonical URL explicit in metadata (relying on defaults)
- **Missing:** OG price/availability tags (`product:price:amount`, `product:price:currency`)

### Category Pages (`/[...slug]`)
- **Title:** Dynamic with category name -- Good
- **Missing:** No `CollectionPage` or `ItemList` schema
- **Missing:** Description is generic ("Order online with fast delivery...") not category-specific
- **Missing:** No `BreadcrumbList` schema

### Products Listing (`/products`)
- **Title:** "Shop Drinks Online | Dial A Drink Kenya" -- Good
- **Missing:** No `ItemList` or `OfferCatalog` schema
- **Missing:** Search/filter parameters not reflected in canonical or metadata

### FAQ Page (`/faq`)
- **Title:** "Frequently Asked Questions" -- Good
- **Missing:** No `FAQPage` JSON-LD schema (huge missed opportunity for rich results)
- FAQ data is hardcoded and well-structured -- easy to add schema

### Delivery Page (`/delivery`)
- **Title:** "Delivery Information" -- OK but could be "Delivery Areas Nairobi"
- **Missing:** No `Service` or `DeliveryChargeSpecification` schema

### Contact Page (`/contact`)
- **Issue:** `"use client"` -- entire page is client-rendered, zero SEO value
- **Missing:** No metadata export at all
- **Missing:** No `ContactPage` schema

### Static Pages (Terms, Privacy)
- Basic metadata present
- Low SEO priority, acceptable as-is

---

## Technical Issues

### 1. Contact Page is Client-Only
The contact page uses `"use client"` at the top level, meaning the entire page content is invisible to crawlers. This is the most critical technical issue.

### 2. No Analytics/Tracking Setup
No Google Analytics (GA4) or Google Search Console verification tag found in the codebase. Cannot measure SEO performance without these.

### 3. Sitemap Issues
- Cart and checkout pages shouldn't be in the sitemap (low-value, user-specific)
- Category URLs use query params (`/products?category=whisky`) instead of clean paths (`/whisky`)
- No `lastModified` from actual data for static pages (uses `new Date()`)
- Missing brand pages from sitemap
- Missing subcategory pages from sitemap

### 4. No Image Alt Text Strategy
Product images rely on whatever alt text is passed; no systematic SEO-optimized alt text generation (e.g., "{Product Name} - Buy {Category} Online Nairobi").

### 5. No 301 Redirects from Old URLs
Old site had different URL patterns. No redirect mapping exists for incoming links from the old site structure.

### 6. Missing `hreflang` (Low Priority)
If ever targeting other East African countries, `hreflang` would be needed. Not urgent.

### 7. Font Loading
Google Fonts loaded via `<link>` in head. Consider using `next/font` for better performance (no layout shift, self-hosted).

---

## Competitive Context

From the old SEO report:
- **Domain Rating:** ~24 (competitors: Jays Wines, Drinks Vine have stronger authority)
- **Monthly visits:** ~31K (competitor Jays Wines ~30.8K)
- **Bounce rate concern:** ~32s avg session, ~1.47 pages/visit
- **Keywords:** ~3.9K (room to grow significantly)

The migration to Next.js gives a structural advantage (faster, better Core Web Vitals) but only if the SEO gaps are filled.
