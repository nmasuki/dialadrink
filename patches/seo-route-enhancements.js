/**
 * SEO Route Enhancements
 * Integration file to apply SEO fixes to existing routes
 */

const { enhancedSitemap } = require('../helpers/EnhancedSitemapGenerator');
const { SEOMetadataEnhancer, enhanceSEOMiddleware } = require('../helpers/SEOMetadataEnhancer');

// Apply SEO middleware to routes in routes/index.js
function applySEOEnhancements(app) {
    
    // Global SEO middleware for all routes
    app.use(enhanceSEOMiddleware);
    app.use(SEOMetadataEnhancer.addRobotsMetaTags);
    app.use(SEOMetadataEnhancer.addCanonicalURL);

    // Enhanced sitemap route (replace existing)
    app.get('/sitemap', enhancedSitemap);
    app.get('/sitemap.xml', enhancedSitemap);
    
    // Product page SEO enhancement
    app.use('/product*', SEOMetadataEnhancer.enhanceProductSEO);
    
    // Category page SEO enhancement  
    app.use('/category*', SEOMetadataEnhancer.enhanceCategorySEO);
    
    // Enhanced robots.txt with proper sitemap reference
    app.get('/robots.txt', (req, res) => {
        const robotsTxt = `User-agent: *
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/success/
Disallow: /checkout/cancel/
Allow: /

Sitemap: ${process.env.SITE_URL || 'https://dialadrinkkenya.com'}/sitemap.xml

# Crawl-delay for better server performance
Crawl-delay: 1`;
        
        res.setHeader('Content-Type', 'text/plain');
        res.send(robotsTxt);
    });

    // SEO-friendly 404 page
    app.use((req, res, next) => {
        if (res.statusCode === 404) {
            res.locals.page = {
                title: '404 - Page Not Found | Dial A Drink Kenya',
                description: 'The page you requested could not be found. Browse our products or return to homepage.',
                canonical: `${process.env.SITE_URL || 'https://dialadrinkkenya.com'}${req.path}`
            };
            res.locals.robotsMeta = 'noindex, nofollow';
        }
        next();
    });
}

// Product model enhancements for consistent pricing
function enhanceProductModel() {
    const keystone = require('keystone');
    const Product = keystone.list('Product');
    
    // Add SEO price virtual to existing Product schema
    if (Product && Product.schema) {
        Product.schema.virtual('seoPrice').get(function () {
            const defaultOption = this.defaultOption || this.priceOptions?.first() || {};
            return {
                price: defaultOption.offerPrice > 0 && defaultOption.offerPrice < defaultOption.price 
                    ? defaultOption.offerPrice 
                    : defaultOption.price,
                currency: (defaultOption.currency || "KES").replace('Ksh', "KES"),
                originalPrice: defaultOption.price,
                discount: defaultOption.offerPrice > 0 && defaultOption.offerPrice < defaultOption.price 
                    ? Math.round(100 * (defaultOption.price - defaultOption.offerPrice) / defaultOption.price)
                    : null
            };
        });

        // Enhanced toAppObject for SEO consistency
        const originalToAppObject = Product.schema.methods.toAppObject;
        Product.schema.methods.toAppObject = function() {
            const obj = originalToAppObject ? originalToAppObject.call(this) : this.toObject();
            const seoPrice = this.seoPrice;
            
            // Ensure consistent pricing in API responses
            obj.price = seoPrice.price;
            obj.currency = seoPrice.currency;
            obj.offerPrice = seoPrice.originalPrice !== seoPrice.price ? seoPrice.originalPrice : null;
            obj.discount = seoPrice.discount;
            
            return obj;
        };
    }
}

module.exports = {
    applySEOEnhancements,
    enhanceProductModel
};