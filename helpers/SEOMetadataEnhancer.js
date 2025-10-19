/**
 * SEO Metadata Enhancement Middleware
 * Adds comprehensive SEO metadata for better search engine indexing
 */

const keystone = require('keystone');

class SEOMetadataEnhancer {
    
    static enhanceProductSEO(req, res, next) {
        const originalRender = res.render;
        
        res.render = function(view, locals = {}) {
            if (view.includes('product') && locals.product) {
                const product = locals.product;
                const seoPrice = product.seoPrice || {};
                
                // Enhanced page metadata
                locals.page = locals.page || {};
                locals.page.title = `${product.name} - ${seoPrice.price ? `KES ${seoPrice.price}` : ''} | Dial A Drink Kenya`;
                locals.page.description = product.description 
                    ? product.description.replace(/<[^>]*>/g, '').substring(0, 160) 
                    : `Buy ${product.name} online. ${seoPrice.price ? `KES ${seoPrice.price}` : 'Best prices'} with fast delivery in Kenya.`;
                
                locals.page.canonical = `${keystone.get('url')}/${product.href}`;
                
                // Structured data for products
                locals.structuredData = SEOMetadataEnhancer.generateProductSchema(product);
                
                // Open Graph metadata
                locals.openGraph = {
                    title: locals.page.title,
                    description: locals.page.description,
                    image: product.image ? product.image.secure_url : null,
                    url: locals.page.canonical,
                    type: 'product'
                };
                
                // Breadcrumb structured data
                locals.breadcrumbSchema = SEOMetadataEnhancer.generateBreadcrumbSchema(locals.breadcrumbs);
            }
            
            originalRender.call(this, view, locals);
        };
        
        next();
    }

    static enhanceCategorySEO(req, res, next) {
        const originalRender = res.render;
        
        res.render = function(view, locals = {}) {
            if (view.includes('category') && locals.category) {
                const category = locals.category;
                
                locals.page = locals.page || {};
                locals.page.title = `${category.name} - Buy Online | Dial A Drink Kenya`;
                locals.page.description = `Shop ${category.name} online. Wide selection, best prices, fast delivery across Kenya. Order now!`;
                locals.page.canonical = `${keystone.get('url')}/category/${category.key}`;
                
                // Category structured data
                locals.structuredData = {
                    "@context": "https://schema.org",
                    "@type": "CollectionPage",
                    "name": category.name,
                    "description": locals.page.description,
                    "url": locals.page.canonical
                };
            }
            
            originalRender.call(this, view, locals);
        };
        
        next();
    }

    static generateProductSchema(product) {
        const seoPrice = product.seoPrice || {};
        
        const schema = {
            "@context": "https://schema.org",
            "@type": "Product",
            "name": product.name,
            "description": product.description ? product.description.replace(/<[^>]*>/g, '') : product.name,
            "url": `${keystone.get('url')}/${product.href}`,
            "image": product.image ? product.image.secure_url : null,
            "brand": {
                "@type": "Brand",
                "name": product.brand ? product.brand.name : "Dial A Drink Kenya"
            },
            "category": product.category ? product.category.name : null,
            "offers": {
                "@type": "Offer",
                "price": seoPrice.price || 0,
                "priceCurrency": seoPrice.currency || "KES",
                "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
                "seller": {
                    "@type": "Organization",
                    "name": "Dial A Drink Kenya",
                    "url": keystone.get('url')
                }
            }
        };

        // Add ratings if available
        if (product.averageRatings && product.ratingCount) {
            schema.aggregateRating = {
                "@type": "AggregateRating",
                "ratingValue": product.averageRatings,
                "reviewCount": product.ratingCount
            };
        }

        return schema;
    }

    static generateBreadcrumbSchema(breadcrumbs) {
        if (!breadcrumbs || !breadcrumbs.length) return null;

        const listItems = breadcrumbs.map((crumb, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": crumb.label,
            "item": crumb.href ? `${keystone.get('url')}${crumb.href}` : undefined
        }));

        return {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": listItems
        };
    }

    static addRobotsMetaTags(req, res, next) {
        res.locals.robotsMeta = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';
        
        // Add noindex for admin and API routes
        if (req.path.startsWith('/admin') || req.path.startsWith('/api')) {
            res.locals.robotsMeta = 'noindex, nofollow';
        }
        
        next();
    }

    static addCanonicalURL(req, res, next) {
        if (!res.locals.page) {
            res.locals.page = {};
        }
        
        if (!res.locals.page.canonical) {
            // Remove query parameters and trailing slashes for canonical URL
            const cleanPath = req.path.replace(/\/$/, '') || '/';
            res.locals.page.canonical = `${keystone.get('url')}${cleanPath}`;
        }
        
        next();
    }

    static generateOrganizationSchema() {
        return {
            "@context": "https://schema.org",
            "@type": ["Organization", "LocalBusiness", "Store"],
            "name": "Dial A Drink Kenya",
            "alternateName": "Dial A Drink",
            "url": keystone.get('url'),
            "logo": keystone.get('logo') || "https://res.cloudinary.com/nmasuki/image/upload/c_fit,w_207,h_50/logo.png",
            "description": "Kenya's leading online alcohol delivery service. Fast, reliable delivery of beer, wine, whisky and spirits across Nairobi and major cities.",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Nairobi Central Business District",
                "addressLocality": "Nairobi",
                "addressCountry": "Kenya",
                "addressCountryCode": "KE"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": -1.2921,
                "longitude": 36.8219
            },
            "contactPoint": [{
                "@type": "ContactPoint",
                "telephone": process.env.CONTACT_PHONE_NUMBER || "+254723688108",
                "contactType": "customer service",
                "availableLanguage": ["English", "Swahili"],
                "areaServed": "Nairobi"
            }],
            "areaServed": {
                "@type": "City",
                "name": "Nairobi",
                "containedInPlace": {
                    "@type": "Country",
                    "name": "Kenya"
                }
            },
            "serviceArea": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                    "@type": "GeoCoordinates",
                    "latitude": -1.2921,
                    "longitude": 36.8219
                },
                "geoRadius": "30000"
            },
            "priceRange": "$$",
            "paymentAccepted": ["Cash", "M-Pesa", "Credit Card", "Debit Card"],
            "currenciesAccepted": "KES",
            "openingHours": "Mo-Su 09:00-23:00",
            "serviceType": "Alcohol Delivery",
            "sameAs": [
                "https://www.facebook.com/dialadrinkkenya",
                "https://www.twitter.com/dialadrinkke",
                "https://www.instagram.com/dialadrinkkenya"
            ],
            "hasOfferCatalog": {
                "@type": "OfferCatalog",
                "name": "Alcohol Delivery Catalog",
                "itemListElement": [
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Beer Delivery Nairobi",
                            "description": "Fast beer delivery across Nairobi"
                        }
                    },
                    {
                        "@type": "Offer", 
                        "itemOffered": {
                            "@type": "Service",
                            "name": "Wine Delivery Nairobi",
                            "description": "Premium wine delivery service"
                        }
                    },
                    {
                        "@type": "Offer",
                        "itemOffered": {
                            "@type": "Service", 
                            "name": "Whisky Delivery Nairobi",
                            "description": "Whisky and spirits delivery"
                        }
                    }
                ]
            }
        };
    }
}

// Enhanced middleware for automatic SEO
const enhanceSEOMiddleware = (req, res, next) => {
    // Add organization schema to all pages
    res.locals.organizationSchema = SEOMetadataEnhancer.generateOrganizationSchema();
    
    // Ensure page object exists
    if (!res.locals.page) {
        res.locals.page = {};
    }
    
    // Default meta description
    if (!res.locals.page.description) {
        res.locals.page.description = "Kenya's leading online alcohol delivery service. Order whisky, beer, wine & more with fast delivery across Nairobi and major cities.";
    }
    
    next();
};

module.exports = {
    SEOMetadataEnhancer,
    enhanceSEOMiddleware
};