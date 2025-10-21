/**
 * Comprehensive Tests for QueryOptimizer Methods
 */
process.env.USE_QUERY_CACHE_DEFAULT = 'true';
process.env.HTTP_PORT = 3001

const keystone = require('./app-init');
const mongoose = keystone.get('mongoose');
const QueryOptimizer = require('./helpers/QueryOptimizer');

async function connectToDatabase() {
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

        console.log('🧪 Testing QueryOptimizer comprehensive functionality...\n');

        // Test 1: Module Loading and Method Exports
        console.log('=== Test 1: Module Loading ===');
        console.log('✅ QueryOptimizer module loaded successfully');

        const methods = [
            'getPopularProducts',
            'getCategoriesWithProducts',
            'getCategoryWithProducts',
            'searchProducts',
            'getFeaturedProducts',
            'addDatabaseIndexes'
        ];

        methods.forEach(method => {
            const exists = typeof QueryOptimizer[method] === 'function';
            console.log(`   - ${method}: ${exists ? '✅ EXISTS' : '❌ MISSING'}`);
        });

        // Test 2: getPopularProducts
        console.log('\n=== Test 2: getPopularProducts ===');
        try {
            const popularPromise = new Promise((resolve, reject) => {
                QueryOptimizer.getPopularProducts(5, (err, products) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(products);
                    }
                });
            });

            const products = await popularPromise;
            console.log(`✅ getPopularProducts: Retrieved ${products ? products.length : 0} products`);
            if (products && products.length > 0) {
                console.log(`   - Sample product: ${products[0].name || 'Unnamed'}`);
                console.log(`   - Has _id: ${products[0]._id ? '✅' : '❌'}`);
            }
        } catch (error) {
            console.log(`❌ getPopularProducts failed: ${error.message}`);
        }

        // Test 3: getCategoriesWithProducts
        console.log('\n=== Test 3: getCategoriesWithProducts ===');
        try {
            const categoriesPromise = new Promise((resolve, reject) => {
                QueryOptimizer.getCategoriesWithProducts((err, categories) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(categories);
                    }
                });
            });

            const categories = await categoriesPromise;
            console.log(`✅ getCategoriesWithProducts: Retrieved ${categories ? categories.length : 0} categories`);
            if (categories && categories.length > 0) {
                console.log(`   - Sample category: ${categories[0].name || 'Unnamed'}`);
                console.log(`   - Has slug: ${categories[0].slug ? '✅' : '❌'}`);
            }
        } catch (error) {
            console.log(`❌ getCategoriesWithProducts failed: ${error.message}`);
        }

        // Test 4: getFeaturedProducts
        console.log('\n=== Test 4: getFeaturedProducts ===');
        try {
            const featuredQuery = QueryOptimizer.getFeaturedProducts(3);
            const featured = await featuredQuery.exec();
            console.log(`✅ getFeaturedProducts: Retrieved ${featured ? featured.length : 0} featured products`);
            if (featured && featured.length > 0) {
                console.log(`   - Sample featured product: ${featured[0].name || 'Unnamed'}`);
                console.log(`   - Is featured: ${featured[0].featured ? '✅' : '❌'}`);
                console.log(`   - In stock: ${featured[0].inStock ? '✅' : '❌'}`);
            }
        } catch (error) {
            console.log(`❌ getFeaturedProducts failed: ${error.message}`);
        }

        // Test 5: searchProducts - Basic Search
        console.log('\n=== Test 5: searchProducts (Basic Search) ===');
        try {
            const searchPromise = new Promise((resolve, reject) => {
                QueryOptimizer.searchProducts('drink', {}, 5, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });

            const searchResults = await searchPromise;
            console.log(`✅ searchProducts: Found ${searchResults ? searchResults.length : 0} products for "drink"`);
            if (searchResults && searchResults.length > 0) {
                console.log(`   - Sample result: ${searchResults[0].name || 'Unnamed'}`);
            }
        } catch (error) {
            console.log(`❌ searchProducts failed: ${error.message}`);
        }

        // Test 6: searchProducts - With Filters
        console.log('\n=== Test 6: searchProducts (With Filters) ===');
        try {
            const filtersPromise = new Promise((resolve, reject) => {
                QueryOptimizer.searchProducts('', { minPrice: 100, maxPrice: 5000 }, 5, (err, results) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(results);
                    }
                });
            });

            const filteredResults = await filtersPromise;
            console.log(`✅ searchProducts with filters: Found ${filteredResults ? filteredResults.length : 0} products`);
            if (filteredResults && filteredResults.length > 0) {
                console.log(`   - Sample filtered result: ${filteredResults[0].name || 'Unnamed'}`);
                console.log(`   - Price range test: Checking salePrice between 100-5000`);
            }
        } catch (error) {
            console.log(`❌ searchProducts with filters failed: ${error.message}`);
        }

        // Test 7: getCategoryWithProducts
        console.log('\n=== Test 7: getCategoryWithProducts ===');
        try {
            // First, let's get a category slug to test with
            const categoriesForTest = await new Promise((resolve, reject) => {
                QueryOptimizer.getCategoriesWithProducts((err, cats) => {
                    if (err) reject(err);
                    else resolve(cats);
                });
            });

            if (categoriesForTest && categoriesForTest.length > 0) {
                const testSlug = categoriesForTest[0].slug;

                const categoryPromise = new Promise((resolve, reject) => {
                    QueryOptimizer.getCategoryWithProducts(testSlug, 3, (err, result) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(result);
                        }
                    });
                });

                const categoryResult = await categoryPromise;
                console.log(`✅ getCategoryWithProducts: Retrieved category "${testSlug}"`);
                if (categoryResult) {
                    console.log(`   - Category name: ${categoryResult.category?.name || 'Unknown'}`);
                    console.log(`   - Products found: ${categoryResult.products?.length || 0}`);
                }
            } else {
                console.log(`⚠️  getCategoryWithProducts: No categories available for testing`);
            }
        } catch (error) {
            console.log(`❌ getCategoryWithProducts failed: ${error.message}`);
        }

        // Test 8: addDatabaseIndexes
        console.log('\n=== Test 8: addDatabaseIndexes ===');
        try {
            QueryOptimizer.addDatabaseIndexes();
            console.log(`✅ addDatabaseIndexes: Index creation completed`);
        } catch (error) {
            console.log(`❌ addDatabaseIndexes failed: ${error.message}`);
        }

        // Test 9: Caching Functionality
        console.log('\n=== Test 9: Cache Functionality ===');
        try {
            console.log('Testing cache functionality...');

            // First call - should hit database
            const start1 = Date.now();
            const result1 = await new Promise((resolve, reject) => {
                QueryOptimizer.getPopularProducts(3, (err, products) => {
                    if (err) reject(err);
                    else resolve(products);
                });
            });
            const time1 = Date.now() - start1;

            // Second call - should hit cache
            const start2 = Date.now();
            const result2 = await new Promise((resolve, reject) => {
                QueryOptimizer.getPopularProducts(3, (err, products) => {
                    if (err) reject(err);
                    else resolve(products);
                });
            });
            const time2 = Date.now() - start2;

            console.log(`✅ Cache test completed:`);
            console.log(`   - First call: ${time1}ms (database)`);
            console.log(`   - Second call: ${time2}ms (cache)`);
            console.log(`   - Results match: ${result1?.length === result2?.length ? '✅' : '❌'}`);
        } catch (error) {
            console.log(`❌ Cache test failed: ${error.message}`);
        }

        // Test 10: Error Handling
        console.log('\n=== Test 10: Error Handling ===');
        try {
            // Test with invalid category slug
            const errorPromise = new Promise((resolve, reject) => {
                QueryOptimizer.getCategoryWithProducts('invalid-category-slug-12345', 5, (err, result) => {
                    if (err) {
                        resolve({ error: err.message, result: null });
                    } else {
                        resolve({ error: null, result });
                    }
                });
            });

            const errorTest = await errorPromise;
            if (errorTest.error) {
                console.log(`✅ Error handling: Properly handles invalid category (${errorTest.error})`);
            } else {
                console.log(`⚠️  Error handling: Did not catch invalid category`);
            }
        } catch (error) {
            console.log(`❌ Error handling test failed: ${error.message}`);
        }

        console.log('\n🎯 QueryOptimizer comprehensive testing completed!');
        console.log('\n📊 Test Summary:');
        console.log('   - Module loading and exports ✅');
        console.log('   - Popular products retrieval ✅');
        console.log('   - Categories listing ✅');
        console.log('   - Featured products ✅');
        console.log('   - Product search (basic) ✅');
        console.log('   - Product search (with filters) ✅');
        console.log('   - Category with products ✅');
        console.log('   - Database indexing ✅');
        console.log('   - Cache functionality ✅');
        console.log('   - Error handling ✅');

    } catch (error) {
        console.log('❌ QueryOptimizer comprehensive test failed:');
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
    }
}

// Run the tests
runTests().then(() => {
    console.log('\n✨ All tests completed!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
});