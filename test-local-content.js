/**
 * Test Local Content Optimization
 * Run this to see enhanced product descriptions with Nairobi context
 */

const LocalContentOptimizer = require('./helpers/LocalContentOptimizer');

function testLocalOptimization() {
    console.log('🚀 Testing Local Content Optimization for Nairobi Market...\n');
    
    const optimizer = new LocalContentOptimizer();
    
    try {
        // Get sample products to test enhancement
        const results = optimizer.generateSampleEnhancements();
        
        console.log(`📊 Enhanced ${results.length} sample products with local Nairobi content\n`);
        
        // Show all examples
        results.forEach((result, index) => {
            console.log(`\n🍺 PRODUCT ${index + 1}: ${result.originalTitle}`);
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            console.log('\n📝 ENHANCED TITLE:');
            console.log(result.enhancedTitle);
            
            console.log('\n📄 ENHANCED DESCRIPTION:');
            console.log(result.enhancedDescription.substring(0, 400) + '...');
            
            console.log('\n🔍 LOCAL SEO KEYWORDS:');
            console.log(result.localKeywords.split(', ').slice(0, 10).join(', '));
            
            console.log('\n📱 LOCAL META DESCRIPTION:');
            console.log(result.localMetaDescription);
            
            console.log('\n' + '═'.repeat(80));
        });
        
        // Test area-specific content
        console.log('\n\n🏘️ NEIGHBORHOOD-SPECIFIC CONTENT EXAMPLES:\n');
        
        const areas = ['westlands', 'karen', 'kilimani', 'kileleshwa'];
        areas.forEach(area => {
            const content = optimizer.generateNeighborhoodContent(area);
            console.log(`📍 ${area.toUpperCase()}:`);
            console.log(`   Context: ${content.context}`);
            console.log(`   Landmarks: ${content.landmarks}`);
            console.log(`   Specialty: ${content.specialty}\n`);
        });
        
        console.log('\n✅ Local content optimization test completed successfully!');
        console.log('\n🎯 BENEFITS FOR NAIROBI MARKET:');
        console.log('   • Improved local search rankings');
        console.log('   • Better mobile user experience');
        console.log('   • M-Pesa payment prominence');
        console.log('   • Neighborhood-specific targeting');
        console.log('   • Cultural context inclusion');
        console.log('   • Licensed retailer credibility');
        
    } catch (error) {
        console.error('❌ Error testing local optimization:', error);
    }
}

testLocalOptimization();