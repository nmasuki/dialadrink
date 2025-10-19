/**
 * Database Query Optimization Helpers
 * Improves performance for product and category queries
 */

const keystone = require('keystone');
const Product = keystone.list('Product');
const ProductCategory = keystone.list('ProductCategory');

class QueryOptimizer {    

    static getPopularProducts(limit = 20, callback) {
        try {
            return Product.findPublished().limit(limit).exec(callback);
        } catch (error) {
            console.error('Error in getPopularProducts:', error);
            callback(error, null);
        }
    }

    static getCategoryWithProducts(categorySlug, productLimit = 20, callback) {
        try {
            // First get the category
            Product.findOnePublished({ slug: categorySlug })
                .exec((err, category) => {
                    if (err || !category) {
                        return callback(err || new Error('Category not found'), null);
                    }
                    
                    // Then get products in this category
                    Product.findPublished({ category: category._id })
                        .sort({ onOffer: -1, popularity: -1, createdAt: -1 })
                        .limit(productLimit)
                        .exec((err, products) => {
                            if (err) {
                                return callback(err, null);
                            }
                            
                            callback(null, {
                                category: category,
                                products: products
                            });
                        });
                });
        } catch (error) {
            console.error('Error in getCategoryWithProducts:', error);
            callback(error, null);
        }
    }

    static getCategoriesWithProducts(callback) {
        try {
            Product.findPublished({})
                .select('name slug image description')
                .sort({ name: 1 })
                .exec(callback);
        } catch (error) {
            console.error('Error in getCategoriesWithProducts:', error);
            callback(error, null);
        }
    }

    static getFeaturedProducts(limit = 6) {
        return Product.findPublished({ 
            inStock: true, 
            featured: true 
        }).limit(limit);
    }

    static searchProducts(query, filters = {}, limit = 20, callback) {
        try {
            let searchQuery = {};
            
            // Text search
            if (query) {
                searchQuery.$or = [
                    { name: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }
            
            // Category filter
            if (filters.category) {
                searchQuery.category = filters.category;
            }
            
            // Brand filter
            if (filters.brand) {
                searchQuery.brand = filters.brand;
            }
            
            // Price range filter
            if (filters.minPrice || filters.maxPrice) {
                searchQuery.salePrice = {};
                if (filters.minPrice) searchQuery.salePrice.$gte = filters.minPrice;
                if (filters.maxPrice) searchQuery.salePrice.$lte = filters.maxPrice;
            }
            
            Product.findPublished(searchQuery)
                .sort({ onOffer: -1, popularity: -1, createdAt: -1 })
                .limit(limit)
                .exec(callback);
        } catch (error) {
            console.error('Error in searchProducts:', error);
            callback(error, null);
        }
    }

    // Add indexes for better performance
    static addDatabaseIndexes() {
        const Product = keystone.list('Product').model;
        
        // Add compound indexes for common queries
        Product.collection.createIndex({ 'category.key': 1, popularity: -1 });
        Product.collection.createIndex({ inStock: 1, popularity: -1 });
        Product.collection.createIndex({ featured: 1, popularity: -1 });
        Product.collection.createIndex({ name: 'text', description: 'text', tags: 'text' });
        
        console.log('✅ Database indexes created for performance optimization');
    }
}

module.exports = QueryOptimizer;