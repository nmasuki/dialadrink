/**
 * Test getPopularProducts method
 * This will test the QueryOptimizer.getPopularProducts function
 */

// Set a different port for testing to avoid conflicts
process.env.HTTP_PORT = 3001;

var keystone = require('./app-init');

// Test function
async function testGetPopularProducts() {
    console.log('🧪 Testing QueryOptimizer.getPopularProducts...\n');
    
    try {
        // Import QueryOptimizer after Keystone is set up
        const QueryOptimizer = require('./helpers/QueryOptimizer');
        
        console.log('✅ QueryOptimizer imported successfully');
        console.log(`✅ getPopularProducts method exists: ${typeof QueryOptimizer.getPopularProducts === 'function'}`);
        
        // Test the function with a callback
        console.log('\n🔍 Testing getPopularProducts(10, callback)...');
        
        QueryOptimizer.getPopularProducts(10, (err, products) => {
            if (err) {
                console.log('❌ Error in getPopularProducts:');
                console.log(`   ${err.message}`);
                console.log(`   Stack: ${err.stack}`);
            } else {
                console.log('✅ getPopularProducts executed successfully!');
                console.log(`   Returned ${products ? products.length : 0} products`);
                
                if (products && products.length > 0) {
                    console.log('\n📦 Sample product data:');
                    const sample = products[0];
                    console.log(`   Name: ${sample.name || 'N/A'}`);
                    console.log(`   Href: ${sample.href || 'N/A'}`);
                    console.log(`   Sale Price: ${sample.salePrice || 'N/A'}`);
                    console.log(`   Category: ${sample.category ? sample.category.name : 'N/A'}`);
                    console.log(`   Brand: ${sample.brand ? sample.brand.name : 'N/A'}`);
                    console.log(`   Popularity: ${sample.popularity || 'N/A'}`);
                }
            }
            
            console.log('\n🎯 Test completed!');
            process.exit(0);
        });
        
    } catch (error) {
        console.log('❌ Test failed:');
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack: ${error.stack}`);
        process.exit(1);
    }
}

console.log("Initializing keystone for test environment...");

// Start Keystone and run test
keystone.start(() => {
    console.log('🚀 Keystone started, running test...\n');
    testGetPopularProducts();
});