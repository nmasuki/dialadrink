/**
 * Mobile UX Enhancement Middleware
 * Improves mobile user experience and reduces bounce rate
 */

class MobileUXEnhancer {
    
    static detectMobileAndEnhance(req, res, next) {
        const userAgent = req.headers['user-agent'] || '';
        const isMobile = /Mobile|Android|iPhone|iPad|Windows Phone/.test(userAgent);
        const isTablet = /iPad|Android(?!.*Mobile)/.test(userAgent);
        
        // Add device detection to locals
        res.locals.deviceType = {
            isMobile: isMobile && !isTablet,
            isTablet: isTablet,
            isDesktop: !isMobile && !isTablet
        };
        
        // Mobile-specific optimizations
        if (isMobile) {
            res.locals.mobileOptimizations = {
                imageQuality: 70,
                thumbnailSize: 200,
                productsPerPage: 12,
                enableLazyLoading: true,
                simplifiedLayout: true
            };
        }
        
        next();
    }

    static addMobileHelpers(req, res, next) {
        // Helper for mobile-optimized buttons
        res.locals.mobileButton = function(text, href, type = 'primary') {
            const classes = {
                primary: 'btn btn-mobile-primary',
                secondary: 'btn btn-mobile-secondary',
                cart: 'btn btn-mobile-cart'
            };
            
            return `<a href="${href}" class="${classes[type]}" role="button">
                        <span class="btn-text">${text}</span>
                    </a>`;
        };

        // Helper for mobile-optimized product cards
        res.locals.mobileProductCard = function(product) {
            const price = product.seoPrice || product.defaultOption || {};
            const imageUrl = res.locals.optimizedCloudinary ? 
                           res.locals.optimizedCloudinary(product.image?.secure_url, { width: 200, quality: 70 }) :
                           product.image?.secure_url;

            return `<div class="mobile-product-card" data-product-id="${product._id}">
                        <div class="product-image-container">
                            <img src="${imageUrl}" alt="${product.name}" loading="lazy" class="product-image">
                            ${!product.inStock ? '<div class="out-of-stock-badge">Out of Stock</div>' : ''}
                        </div>
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <div class="product-price">
                                ${price.currency || 'KES'} ${price.price || 0}
                                ${price.offerPrice && price.offerPrice < price.price ? 
                                  `<span class="original-price">${price.currency} ${price.originalPrice}</span>` : ''}
                            </div>
                            <button class="mobile-add-to-cart" data-product-id="${product._id}">
                                Add to Cart
                            </button>
                        </div>
                    </div>`;
        };

        // Helper for mobile-optimized breadcrumbs
        res.locals.mobileBreadcrumbs = function(breadcrumbs) {
            if (!breadcrumbs || breadcrumbs.length === 0) return '';
            
            // Show only last 2 breadcrumb items on mobile
            const visibleCrumbs = breadcrumbs.slice(-2);
            
            return `<nav class="mobile-breadcrumbs" aria-label="Breadcrumb">
                        ${breadcrumbs.length > 2 ? '<span class="breadcrumb-ellipsis">...</span>' : ''}
                        ${visibleCrumbs.map((crumb, index) => 
                            index === visibleCrumbs.length - 1 ? 
                                `<span class="current-page">${crumb.label}</span>` :
                                `<a href="${crumb.href}">${crumb.label}</a>`
                        ).join(' > ')}
                    </nav>`;
        };

        next();
    }

    static optimizeForSlowConnections(req, res, next) {
        const originalRender = res.render;
        
        res.render = function(view, locals = {}) {
            // Add connection-aware optimizations
            locals.connectionOptimized = {
                // Reduce image quality for slow connections
                imageQuality: 60,
                // Limit initial products shown
                initialProductLimit: 8,
                // Enable progressive loading
                enableProgressiveLoad: true,
                // Minimize JavaScript
                minimalJS: true
            };

            // Add performance monitoring script
            locals.performanceMonitoring = `
                <script>
                    // Monitor page load performance
                    window.addEventListener('load', function() {
                        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
                        if (loadTime > 3000) {
                            // Log slow page load
                            console.warn('Slow page load detected:', loadTime + 'ms');
                            
                            // Send analytics (optional)
                            if (typeof gtag !== 'undefined') {
                                gtag('event', 'slow_page_load', {
                                    'page_load_time': loadTime,
                                    'page_path': window.location.pathname
                                });
                            }
                        }
                    });

                    // Lazy load images when they come into view
                    if ('IntersectionObserver' in window) {
                        const imageObserver = new IntersectionObserver((entries, observer) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    const img = entry.target;
                                    img.src = img.dataset.src;
                                    img.classList.remove('lazy-load');
                                    img.classList.add('loaded');
                                    observer.unobserve(img);
                                }
                            });
                        });

                        document.querySelectorAll('.lazy-load').forEach(img => {
                            imageObserver.observe(img);
                        });
                    }
                </script>
            `;

            originalRender.call(this, view, locals);
        };
        
        next();
    }
}

module.exports = MobileUXEnhancer;