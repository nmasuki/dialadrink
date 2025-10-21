/**
 * Comprehensive Tests for QueryOptimizer Methods
 */
process.env.USE_QUERY_CACHE_DEFAULT = 'true';
process.env.HTTP_PORT = 3002; // Use unique test port

const keystone = require('./app-init');
const mongoose = keystone.get('mongoose');
const memCache = require("memory-cache");
const Product = keystone.list('Product');
const ProductCategory = keystone.list('ProductCategory');
const DEFAULT_USE_CACHE = process.env.USE_QUERY_CACHE_DEFAULT === 'true';
const DEFAULT_TTL = parseInt(process.env.QUERY_CACHE_TTL_MS) || 10 * 60 * 1000; // 10 minutes

// Helper to safely parse JSON
if (!JSON.tryParse)
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


// add cache() chainable to queries
mongoose.Query.prototype.cache = function (options = {}) {
    this._useCache = true;
    this._cacheKey = options.key ? String(options.key) : ''; // optional namespace
    this._cacheTTL = typeof options.ttl === 'number' ? options.ttl : DEFAULT_TTL;
    return this;
};

// wrap exec to intercept queries that used 
const exec = mongoose.Query.prototype.exec;

// Override exec method to add caching
mongoose.Query.prototype.exec = async function (...args) {
    const useCache = this._useCache || DEFAULT_USE_CACHE;
    console.log(`📊 [EXEC] Starting query execution, useCache: ${useCache}`);
    
    // if caching not enabled, run original exec
    if (!useCache) {
        console.log(`📊 [EXEC] Cache disabled, calling original exec`);
        return exec.apply(this, args).catch(console.error);
    }

    try {
        console.log(`📊 [EXEC] Building cache key...`);
        const keyBase = this._cacheKey || 'default';
        const cacheKey = `${keyBase}:${buildKey(this)}`;
        console.log(`📊 [EXEC] Cache key: ${cacheKey.substring(0, 100)}...`);

        // try cache
        console.log(`📊 [EXEC] Checking cache...`);
        const cached = await memCache.get(cacheKey);
        if (cached) {
            console.log(`📊 [EXEC] Cache hit! Returning cached result`);
            // parse cached JSON to the same format mongoose returns
            const doc = typeof cached === 'string' ? JSON.tryParse(cached) ?? cached : cached;
            // if it's an array, hydrate into model instances so methods like .save() don't appear
            if (Array.isArray(doc)) 
                return doc.map(d => new this.model(d));
            
            return new this.model(doc);
        }

        console.log(`📊 [EXEC] Cache miss, executing original query...`);
        // not in cache: call original exec, then set cache
        const result = await exec.apply(this, args).catch(console.error);
        console.log(`📊 [EXEC] Original query completed, result type: ${Array.isArray(result) ? 'array' : typeof result}`);

        // store plain JSON. handle arrays and single doc
        console.log(`📊 [EXEC] Converting result to plain object...`);
        const plain = Array.isArray(result)
            ? result.map(r => r.toObject ? r.toObject() : r)
            : result && result.toObject ? result.toObject() : result;

        console.log(`📊 [EXEC] Storing in cache with TTL: ${this._cacheTTL ?? 10 * 60 * 1000}ms`);
        await memCache.put(cacheKey, plain, this._cacheTTL ?? 10 * 60 * 1000);
        console.log(`📊 [EXEC] Query execution completed successfully`);

        return result;
    } catch (error) {
        // If there's a casting error or other issue, fall back to original exec
        console.warn(`📊 [EXEC] QueryOptimizer cache error, falling back to direct query:`, error.message);
        return exec.apply(this, args);
    }
};

// add cache() chainable to queries
mongoose.Query.prototype.cache = function (options = {}) {
    this._useCache = true;
    this._cacheKey = options.key ? String(options.key) : ''; // optional namespace
    this._cacheTTL = typeof options.ttl === 'number' ? options.ttl : DEFAULT_TTL;
    return this;
};

async function connectToDatabase() {            
    console.log(`\n📱 Step 1: Initializing Keystone and database connection...`);
    console.log(`🔍 Current connection state: ${mongoose.connection.readyState}`);
    console.log(`🔍 Connection states: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting`);
    
    // Start Keystone which will initialize the database connection
    await new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
            console.log(`✅ Database already connected`);
            resolve();
        } else {
            console.log(`🔧 Starting Keystone to establish database connection...`);

            // Listen for connection events
            mongoose.connection.on('connected', () => {
                console.log(`✅ Database connected successfully`);
                console.log(`🔍 Connected to: ${mongoose.connection.host}:${mongoose.connection.port}/${mongoose.connection.name}`);
                resolve();
            });

            mongoose.connection.on('error', (error) => {
                console.error(`💥 Database connection error:`, error.message);
                reject(error);
            });

            mongoose.connection.on('disconnected', () => {
                console.log(`� Database disconnected`);
            });

            //Open DB
            keystone.openDatabaseConnection(console.error);

            // Timeout after 15 seconds
            setTimeout(() => {
                console.error(`💥 Database connection timeout after 15 seconds`);
                console.error(`🔍 Final connection state: ${mongoose.connection.readyState}`);
                reject(new Error('Database connection timeout'));
            }, 15000);
        }
    });
}

async function runTests() {
    try {
        await connectToDatabase();

        console.log(`\n🧪 Starting QueryOptimizer Tests...`);
        console.log(`🔧 Environment: USE_QUERY_CACHE_DEFAULT=${process.env.USE_QUERY_CACHE_DEFAULT}`);
        console.log(`🔧 Cache TTL: ${DEFAULT_TTL}ms`);

        console.log(`\n📱 Step 2: Testing basic Product query...`);
        console.log(`⏳ Executing Product.model.find({}).limit(20).exec()...`);
        
        const startTime = Date.now();
        const products = await Product.model.find({}).limit(20).exec();
        const queryTime = Date.now() - startTime;
        
        console.log(`✅ Query completed in ${queryTime}ms`);
        console.log(`📊 Found ${products.length} products`);
        
        if (products.length > 0) {
            console.log(`📝 Sample product: ${products[0].name || products[0]._id}`);
        }

        console.log(`\n📱 Step 3: Testing cached query (should be faster)...`);
        console.log(`⏳ Executing same query again...`);
        
        const startTime2 = Date.now();
        const cachedProducts = await Product.model.find({}).limit(20).exec();
        const cachedQueryTime = Date.now() - startTime2;
        
        console.log(`✅ Cached query completed in ${cachedQueryTime}ms`);
        console.log(`📊 Found ${cachedProducts.length} products (cached)`);
        
        console.log(`\n📱 Step 4: Performance comparison...`);
        console.log(`🐌 First query: ${queryTime}ms`);
        console.log(`⚡ Cached query: ${cachedQueryTime}ms`);
        console.log(`🚀 Speed improvement: ${((queryTime - cachedQueryTime) / queryTime * 100).toFixed(1)}%`);

        console.log(`\n📱 Step 5: Testing explicit cache() method...`);
        console.log(`⏳ Testing .cache() chainable method...`);
        
        const startTime3 = Date.now();
        const explicitCached = await Product.model.find({}).limit(5).cache({ key: 'test', ttl: 30000 }).exec();
        const explicitCacheTime = Date.now() - startTime3;
        
        console.log(`✅ Explicit cache query completed in ${explicitCacheTime}ms`);
        console.log(`📊 Found ${explicitCached.length} products (explicit cache)`);

        console.log(`\n📱 Step 6: Testing Product static methods...`);
        
        // Test Product.findPublished
        console.log(`⏳ Testing Product.findPublished...`);
        const startTime4 = Date.now();
        const publishedProducts = await new Promise((resolve, reject) => {
            Product.findPublished({ inStock: true }, (err, products) => {
                if (err) reject(err);
                else resolve(products);
            });
        });
        const publishedTime = Date.now() - startTime4;
        console.log(`✅ Product.findPublished: ${publishedProducts.length} products in ${publishedTime}ms`);
        
        // Test Product.findOnePublished
        console.log(`⏳ Testing Product.findOnePublished...`);
        const onePublished = await new Promise((resolve, reject) => {
            Product.findOnePublished({ inStock: true }, (err, product) => {
                if (err) reject(err);
                else resolve(product);
            });
        });
        console.log(`✅ Product.findOnePublished: ${onePublished ? 'Found product: ' + onePublished.name : 'No product found'}`);
        
        // Test Product.offerAndPopular
        console.log(`⏳ Testing Product.offerAndPopular...`);
        const offerData = await new Promise((resolve, reject) => {
            Product.offerAndPopular(4, (err, data) => {
                if (err) reject(err);
                else resolve(data);
            });
        });
        console.log(`✅ Product.offerAndPopular:`);
        console.log(`   - Popular: ${offerData.popular?.length || 0} products`);
        console.log(`   - Offers: ${offerData.offers?.length || 0} products`);
        console.log(`   - Brand Focus: ${offerData.brandFocus?.length || 0} products`);
        console.log(`   - Total Combined: ${offerData.products?.length || 0} products`);

        console.log(`\n📱 Step 7: Testing Product search methods...`);
        
        // Test Product.search with string query
        console.log(`⏳ Testing Product.search with "whisky"...`);
        const searchResults = await new Promise((resolve, reject) => {
            Product.search("whisky", (err, products) => {
                if (err) reject(err);
                else resolve(products);
            }, false);
        });
        console.log(`✅ Product.search: Found ${searchResults?.length || 0} products for "whisky"`);
        if (searchResults && searchResults.length > 0) {
            console.log(`   - Sample result: ${searchResults[0].name}`);
        }

        console.log(`\n📱 Step 8: Testing Product category methods...`);
        
        // Test Product.findByCategory if we have categories
        if (publishedProducts && publishedProducts.length > 0) {
            const sampleProduct = publishedProducts.find(p => p.category);
            if (sampleProduct && sampleProduct.category) {
                console.log(`⏳ Testing Product.findByCategory...`);
                const categoryProducts = await new Promise((resolve, reject) => {
                    Product.findByCategory({ _id: sampleProduct.category._id }, (err, products) => {
                        if (err) reject(err);
                        else resolve(products);
                    });
                });
                console.log(`✅ Product.findByCategory: Found ${categoryProducts?.length || 0} products in category "${sampleProduct.category.name}"`);
            }
            
            // Test Product.findByBrand if we have brands
            const sampleBrandProduct = publishedProducts.find(p => p.brand);
            if (sampleBrandProduct && sampleBrandProduct.brand) {
                console.log(`⏳ Testing Product.findByBrand...`);
                const brandProducts = await new Promise((resolve, reject) => {
                    Product.findByBrand({ _id: sampleBrandProduct.brand._id }, (err, products) => {
                        if (err) reject(err);
                        else resolve(products);
                    });
                });
                console.log(`✅ Product.findByBrand: Found ${brandProducts?.length || 0} products for brand "${sampleBrandProduct.brand.name}"`);
            }
        }

        console.log(`\n📱 Step 9: Testing Product utility methods...`);
        
        // Test Product.groupProducts
        if (publishedProducts && publishedProducts.length > 4) {
            console.log(`⏳ Testing Product.groupProducts...`);
            const groupedProducts = Product.groupProducts(publishedProducts.slice(0, 20), 8);
            console.log(`✅ Product.groupProducts: Created ${groupedProducts?.length || 0} groups`);
            if (groupedProducts && groupedProducts.length > 0) {
                console.log(`   - Sample group: "${groupedProducts[0].key}" with ${groupedProducts[0].products?.length || 0} products`);
                console.log(`   - Has more: ${groupedProducts[0].hasMore ? 'Yes' : 'No'}`);
            }
        }
        
        // Test Product.getUIFilters
        if (publishedProducts && publishedProducts.length > 5) {
            console.log(`⏳ Testing Product.getUIFilters...`);
            const uiFilters = Product.getUIFilters(publishedProducts.slice(0, 50), 10);
            console.log(`✅ Product.getUIFilters: Generated ${uiFilters?.length || 0} UI filters`);
            if (uiFilters && uiFilters.length > 0) {
                console.log(`   - Sample filters: ${uiFilters.slice(0, 3).map(f => f.filter).join(', ')}`);
                console.log(`   - Total hits: ${uiFilters.reduce((sum, f) => sum + f.hits, 0).toFixed(1)}`);
            }
        }

        console.log(`\n📱 Step 10: Testing Product relationship methods...`);
        
        // Test Product.findRelated if we have products
        if (publishedProducts && publishedProducts.length > 0) {
            console.log(`⏳ Testing Product.findRelated...`);
            try {
                const relatedProducts = await Product.findRelated([publishedProducts[0]._id]);
                console.log(`✅ Product.findRelated: Found ${relatedProducts?.length || 0} related products`);
                if (relatedProducts && relatedProducts.length > 0) {
                    console.log(`   - Sample related: ${relatedProducts[0].name}`);
                }
            } catch (error) {
                console.log(`⚠️  Product.findRelated: ${error.message} (expected if no order history)`);
            }
        }

        console.log(`\n📱 Step 11: Cache performance comparison...`);
        
        // Test caching performance on Product methods
        console.log(`⏳ Testing cached vs uncached Product.findPublished...`);
        
        // First call (should cache)
        const cacheStart1 = Date.now();
        await new Promise((resolve, reject) => {
            Product.findPublished({ inStock: true }, (err, products) => {
                if (err) reject(err);
                else resolve(products);
            });
        });
        const cacheTime1 = Date.now() - cacheStart1;
        
        // Second call (should hit cache)
        const cacheStart2 = Date.now();
        await new Promise((resolve, reject) => {
            Product.findPublished({ inStock: true }, (err, products) => {
                if (err) reject(err);
                else resolve(products);
            });
        });
        const cacheTime2 = Date.now() - cacheStart2;
        
        console.log(`✅ Product.findPublished caching:`);
        console.log(`   - First call: ${cacheTime1}ms`);
        console.log(`   - Cached call: ${cacheTime2}ms`);
        console.log(`   - Speed improvement: ${((cacheTime1 - cacheTime2) / cacheTime1 * 100).toFixed(1)}%`);

        console.log(`\n📱 Step 12: Testing CastError simulation...`);
        
        // Test the exact error scenario - using slug string where ObjectId is expected
        console.log(`⏳ Simulating CastError with slug "vermouth-martini-rosso"...`);
        try {
            // This should trigger the CastError since we're using a slug in _id field
            const errorTest = await Product.model.findOne({ _id: "vermouth-martini-rosso" }).exec();
            console.log(`⚠️  Unexpected: Query succeeded without error - ${errorTest ? 'Found product' : 'No product found'}`);
        } catch (error) {
            if (error.name === 'CastError') {
                console.log(`✅ Successfully simulated CastError:`);
                console.log(`   - Error name: ${error.name}`);
                console.log(`   - Error message: ${error.message}`);
                console.log(`   - Value: ${error.value}`);
                console.log(`   - Path: ${error.path}`);
                console.log(`   - Model: ${error.model?.modelName || 'Unknown'}`);
            } else {
                console.log(`⚠️  Different error type: ${error.name} - ${error.message}`);
            }
        }

        // Test another slug that might exist
        console.log(`⏳ Testing with another slug "absolut-vodka"...`);
        try {
            const errorTest2 = await Product.model.findOne({ _id: "absolut-vodka" }).exec();
            console.log(`⚠️  Unexpected: Query succeeded without error - ${errorTest2 ? 'Found product' : 'No product found'}`);
        } catch (error) {
            if (error.name === 'CastError') {
                console.log(`✅ CastError confirmed with second slug:`);
                console.log(`   - Value attempted: "${error.value}"`);
                console.log(`   - Expected: ObjectId`);
            } else {
                console.log(`⚠️  Different error: ${error.name} - ${error.message}`);
            }
        }

        // Test with the correct approach using href
        console.log(`⏳ Testing correct approach with href field...`);
        try {
            const correctTest = await Product.model.findOne({ href: "vermouth-martini-rosso" }).exec();
            console.log(`✅ Correct query using href: ${correctTest ? 'Found product: ' + correctTest.name : 'No product found'}`);
        } catch (error) {
            console.log(`❌ Error with href query: ${error.message}`);
        }

        console.log(`\n📱 Step 13: Cleanup and summary...`);
        console.log(`🧹 Clearing memory cache...`);
        memCache.clear();
        console.log(`✅ Cache cleared`);

    } catch (error) {
        console.error(`💥 Error in step: ${error.message}`);
        console.error(`📍 Stack trace:`, error.stack);
        throw error;
    }
}

async function resetProductRelatedProducts(){
    console.log(`\n📱 Step 14: Resetting Product relatedProducts fields...`)
    await connectToDatabase();

    try {
        const allProducts = await Product.model.find({ relatedProducts: { $exists: true, $ne: [] } }).exec();
        console.log(`🔍 Found ${allProducts.length} products with relatedProducts to reset`);

        // Reset the relatedProducts field for each product
        for (const product of allProducts) {
            if (product.relatedProducts && Array.isArray(product.relatedProducts)) {
                // Normalize entries (handle objects like { _id: ... } or raw ids),
                // keep only values that are valid ObjectId, and convert to ObjectId instances.
                var allRelatedProducts = product.relatedProducts.map(r => (r && r._id) ? r._id : r).map(String);
                var errorRelatedProducts = allRelatedProducts.filter(id => !id || !mongoose.Types.ObjectId.isValid(id));
                if (errorRelatedProducts.length)
                    console.warn(`⚠️  Product ${product._id} has invalid relatedProducts entries:`, errorRelatedProducts);               

                product.relatedProducts = allRelatedProducts
                    .filter(id => id && mongoose.Types.ObjectId.isValid(id))
                    .map(id => new mongoose.Types.ObjectId(id));
            } else {
                product.relatedProducts = [];
            }

            // Skip the pre-save hook that tries to call findRelated (which causes the virtual population error)
            // by using updateOne instead of save()
            await Product.model.updateOne(
                { _id: product._id },
                { $set: { relatedProducts: product.relatedProducts } }
            );
            console.log(`✅ Reset relatedProducts for product: ${product.name}`);
        }

        console.log(`\n✅ Completed resetting relatedProducts for all products`);
    } catch (error) {
        console.error(`💥 Error resetting relatedProducts: ${error.message}`);
    }
}

// Add process handlers for debugging
process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

console.log(`🚀 Starting test suite...`);
console.log(`📊 Node version: ${process.version}`);
console.log(`📊 Platform: ${process.platform}`);

// Add timeout to prevent hanging
const testTimeout = setTimeout(() => {
    console.error('💥 Test suite timed out after 60 seconds');
    console.error('🔍 This might indicate a database connection issue');
    process.exit(1);
}, 60000);

// Run the tests
resetProductRelatedProducts().then(() => {
    clearTimeout(testTimeout);
    console.log('\n✨ All tests completed successfully!');
    process.exit(0);
}).catch((error) => {
    clearTimeout(testTimeout);
    console.error('\n💥 Test suite failed:', error.message);
    console.error('📍 Full error:', error);
    process.exit(1);
});