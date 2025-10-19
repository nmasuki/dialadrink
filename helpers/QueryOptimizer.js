/**
 * Database Query Optimization Helpers
 * Improves performance for product and category queries
 */

const keystone = require('keystone');
const mongoose = keystone.get('mongoose');
const memCache = require("memory-cache");
const Product = keystone.list('Product');
const ProductCategory = keystone.list('ProductCategory');
const DEFAULT_USE_CACHE = process.env.USE_QUERY_CACHE_DEFAULT === 'true';
const DEFAULT_TTL = parseInt(process.env.QUERY_CACHE_TTL_MS) || 10 * 60 * 1000; // 10 minutes

// Helper to safely parse JSON
if(!JSON.tryParse)
    JSON.tryParse = function (str) {
        try {
            return JSON.parse(str);
        } catch {
            return null;
        }
    }

// helper to build a stable cache key for the query
function buildKey(query) {
  const collection = query.model.collection.name;
  const q = Object.assign({}, query.getQuery()); // filters
  const opts = {
    collection,
    query: q,
    op: query.op, // find, findOne, count, etc.
    options: query.getOptions ? query.getOptions() : {}
  };
  return `${collection}:${query.model.modelName}:${JSON.stringify(opts)}`;
}

// wrap exec to intercept queries that used .cache()
const exec = mongoose.Query.prototype.exec;

// add cache() chainable to queries
mongoose.Query.prototype.cache = function (options = {}) {
  this._useCache = false;
  this._cacheKey = options.key ? String(options.key) : ''; // optional namespace
  this._cacheTTL = typeof options.ttl === 'number' ? options.ttl : DEFAULT_TTL;
  return this;
};

mongoose.Query.prototype._exec = async function (...args) {
  // if caching not enabled, run original exec
  if (!this._useCache && DEFAULT_USE_CACHE === false) {
    return exec.apply(this, args);
  }

  const keyBase = this._cacheKey || 'default';
  const cacheKey = `${keyBase}:${buildKey(this)}`;

  // try cache
  const cached = await memCache.get(cacheKey);
  if (cached) {
    // parse cached JSON to the same format mongoose returns
    const doc = typeof cached === 'string' ? JSON.tryParse(cached) ?? cached : cached;
    // if it's an array, hydrate into model instances so methods like .save() don't appear
    if (Array.isArray(doc)) {
      return doc.map(d => new this.model(d));
    }
    return new this.model(doc);
  }

  // not in cache: call original exec, then set cache
  const result = await exec.apply(this, args);

  // store plain JSON. handle arrays and single doc
  const plain = Array.isArray(result)
    ? result.map(r => r.toObject ? r.toObject() : r)
    : result && result.toObject ? result.toObject() : result;

  await memCache.put(cacheKey, plain, this._cacheTTL ?? 10 * 60 * 1000);

  return result;
};

class QueryOptimizer {    

    static getPopularProducts(limit = 20, callback) {
        try {
            return Product.findPublished().limit(limit).cache().exec(callback);
        } catch (error) {
            console.error('Error in getPopularProducts:', error);
            callback(error, null);
        }
    }

    static getCategoryWithProducts(categorySlug, productLimit = 20, callback) {
        try {
            // First get the category
            Product.findOnePublished({ slug: categorySlug }).cache()
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
                .sort({ name: 1 }).cache()
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
        }).limit(limit).cache();
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
                .limit(limit).cache()
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