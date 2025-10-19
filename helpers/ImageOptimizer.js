/**
 * Image Optimization Middleware
 * Automatically serves optimized images and improves image loading
 */

const fs = require('fs');
const path = require('path');

class ImageOptimizer {
    static optimizeCloudinaryUrls(req, res, next) {
        const originalRender = res.render;
        
        res.render = function(view, locals = {}) {
            // Optimize cloudinary URLs based on device type
            const isMobile = req.headers['user-agent'] && 
                           /Mobile|Android|iPhone|iPad/.test(req.headers['user-agent']);
            
            // Add cloudinary optimization helpers to locals
            locals.optimizedCloudinary = function(imageUrl, options = {}) {
                if (!imageUrl) return imageUrl;
                
                const baseOptions = isMobile ? 
                    { width: 400, quality: 75, format: 'webp' } : 
                    { width: 800, quality: 85, format: 'webp' };
                
                const finalOptions = { ...baseOptions, ...options };
                
                // Convert existing cloudinary URL to optimized version
                if (imageUrl.includes('cloudinary.com')) {
                    const parts = imageUrl.split('/upload/');
                    if (parts.length === 2) {
                        const transformations = [
                            `w_${finalOptions.width}`,
                            `q_${finalOptions.quality}`,
                            `f_${finalOptions.format}`,
                            'c_fill'
                        ].join(',');
                        
                        return `${parts[0]}/upload/${transformations}/${parts[1]}`;
                    }
                }
                
                return imageUrl;
            };
            
            // Optimize product images in locals
            if (locals.products && Array.isArray(locals.products)) {
                locals.products = locals.products.map(product => {
                    if (product.image && product.image.secure_url) {
                        product.optimizedImage = locals.optimizedCloudinary(product.image.secure_url);
                        product.optimizedThumbnail = locals.optimizedCloudinary(product.image.secure_url, { width: 200, quality: 70 });
                    }
                    return product;
                });
            }
            
            if (locals.product && locals.product.image) {
                locals.product.optimizedImage = locals.optimizedCloudinary(locals.product.image.secure_url);
                if (locals.product.altImages) {
                    locals.product.optimizedAltImages = locals.product.altImages.map(img => 
                        locals.optimizedCloudinary(img.secure_url)
                    );
                }
            }
            
            originalRender.call(this, view, locals);
        };
        
        next();
    }

    static addLazyLoadingSupport(req, res, next) {
        res.locals.lazyLoadImage = function(imageUrl, alt = '', className = '') {
            const optimizedUrl = res.locals.optimizedCloudinary ? 
                                res.locals.optimizedCloudinary(imageUrl) : imageUrl;
            
            return `<img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3C/svg%3E" 
                         data-src="${optimizedUrl}" 
                         alt="${alt}" 
                         class="lazy-load ${className}" 
                         loading="lazy" />`;
        };
        
        next();
    }
}

module.exports = ImageOptimizer;