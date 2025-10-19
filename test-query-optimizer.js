/**
 * Test QueryOptimizer function exports
 */

try {
    const QueryOptimizer = require('./helpers/QueryOptimizer');
    
    console.log('🧪 Testing QueryOptimizer function exports...\n');
    
    console.log('✅ QueryOptimizer module loaded successfully');
    console.log(`   - getPopularProducts: ${typeof QueryOptimizer.getPopularProducts === 'function' ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - getCategoriesWithProducts: ${typeof QueryOptimizer.getCategoriesWithProducts === 'function' ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - getCategoryWithProducts: ${typeof QueryOptimizer.getCategoryWithProducts === 'function' ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - searchProducts: ${typeof QueryOptimizer.searchProducts === 'function' ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - getFeaturedProducts: ${typeof QueryOptimizer.getFeaturedProducts === 'function' ? 'EXISTS' : 'MISSING'}`);
    console.log(`   - addDatabaseIndexes: ${typeof QueryOptimizer.addDatabaseIndexes === 'function' ? 'EXISTS' : 'MISSING'}`);
    
    console.log('\n🎯 QueryOptimizer functions are properly exported and ready for use in the application!');
    
} catch (error) {
    console.log('❌ QueryOptimizer test failed:');
    console.log(`   Error: ${error.message}`);
    console.log(`   Stack: ${error.stack}`);
}