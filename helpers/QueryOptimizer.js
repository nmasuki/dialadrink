/**
 * Database Query Optimization Helpers
 * Improves performance for product and category queries
 */

const keystone = require('keystone');

class QueryOptimizer {
    
    static getOptimizedProductQuery() {
        return keystone.list('Product').model.find()
            .populate('category', 'name key href')
            .populate('brand', 'name key')
            .populate('defaultOption', 'price offerPrice currency')
            .select('name slug href image category brand defaultOption inStock popularity tags modifiedDate')
            .lean() // Use lean for better performance
            .cache(300); // Cache for 5 minutes
    }

    static getProductWithRelated(productId) {
        return Promise.all([
            // Main product
            keystone.list('Product').model.findById(productId)
                .populate('category', 'name key href')
                .populate('brand', 'name key href')
                .populate('priceOptions')
                .populate('defaultOption')
                .lean(),
            
            // Related products (optimized)
            keystone.list('Product').model.find()
                .populate('category', 'name key')
                .populate('defaultOption', 'price offerPrice currency')
                .select('name href image defaultOption category')
                .limit(8)
                .lean()
        ]);
    }

    static getCategoryWithProducts(categoryKey, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        
        return Promise.all([
            // Category info
            keystone.list('ProductCategory').model.findOne({ key: categoryKey })
                .select('name key description image href')
                .lean(),
            
            // Products in category (paginated)
            keystone.list('Product').model.find({ 'category.key': categoryKey })
                .populate('defaultOption', 'price offerPrice currency')
                .populate('brand', 'name')
                .select('name href image defaultOption brand inStock popularity')
                .sort({ popularity: -1, modifiedDate: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
                
            // Total count for pagination
            keystone.list('Product').model.countDocuments({ 'category.key': categoryKey })
        ]);
    }

    static getPopularProducts(limit = 10) {
        return keystone.list('Product').model.find({ inStock: true })
            .populate('defaultOption', 'price offerPrice currency')
            .populate('brand', 'name')
            .select('name href image defaultOption brand popularity')
            .sort({ popularity: -1 })
            .limit(limit)
            .lean()
            .cache(600); // Cache for 10 minutes
    }

    static getFeaturedProducts(limit = 6) {
        return keystone.list('Product').model.find({ 
            inStock: true, 
            featured: true 
        })
            .populate('defaultOption', 'price offerPrice currency')
            .select('name href image defaultOption')
            .limit(limit)
            .lean()
            .cache(300);
    }

    static searchProducts(query, limit = 20) {
        const searchRegex = new RegExp(query, 'i');
        
        return keystone.list('Product').model.find({
            $or: [
                { name: searchRegex },
                { description: searchRegex },
                { tags: { $in: [searchRegex] } }
            ],
            inStock: true
        })
            .populate('defaultOption', 'price offerPrice currency')
            .populate('brand', 'name')
            .select('name href image defaultOption brand')
            .sort({ popularity: -1 })
            .limit(limit)
            .lean();
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