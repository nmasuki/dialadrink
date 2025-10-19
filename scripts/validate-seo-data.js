/**
 * SEO Structured Data Validator
 * Tests the product structured data implementation
 */

const keystone = require('../app-init');
const Product = keystone.list('Product');

async function validateProductStructuredData() {
    console.log('🔍 Validating Product Structured Data');
    console.log('=====================================\n');

    try {
        // Get a sample product
        const sampleProduct = await Product.findOnePublished({})
            .populate('category brand')
            .exec();

        if (!sampleProduct) {
            console.log('❌ No published products found for testing');
            return;
        }

        console.log(`📦 Testing product: ${sampleProduct.name}`);
        console.log(`🔗 Product href: ${sampleProduct.href}\n`);

        // Test seoPrice virtual
        console.log('💰 SEO Price Testing:');
        console.log('---------------------');
        
        const seoPrice = sampleProduct.seoPrice;
        console.log('SEO Price Object:', JSON.stringify(seoPrice, null, 2));
        
        if (seoPrice.price) {
            console.log('✅ SEO price calculated successfully');
        } else {
            console.log('❌ SEO price calculation failed');
        }

        // Test structured data generation
        console.log('\n📋 Structured Data Testing:');
        console.log('----------------------------');
        
        const structuredData = generateProductSchema(sampleProduct);
        console.log('Product Schema:', JSON.stringify(structuredData, null, 2));

        // Validate required fields
        const requiredFields = ['@context', '@type', 'name', 'offers'];
        let validationPassed = true;

        for (const field of requiredFields) {
            if (structuredData[field]) {
                console.log(`✅ ${field}: Present`);
            } else {
                console.log(`❌ ${field}: Missing`);
                validationPassed = false;
            }
        }

        // Validate offers structure
        if (structuredData.offers) {
            const offers = structuredData.offers;
            console.log(`✅ Offer price: ${offers.price} ${offers.priceCurrency}`);
            console.log(`✅ Availability: ${offers.availability}`);
            console.log(`✅ Seller: ${offers.seller?.name}`);
        }

        console.log(`\n🎯 Validation Result: ${validationPassed ? '✅ PASSED' : '❌ FAILED'}`);
        
        // Test price consistency
        console.log('\n🔄 Price Consistency Check:');
        console.log('---------------------------');
        
        const originalPrice = sampleProduct.price;
        const seoCalculatedPrice = seoPrice.price;
        const apiObject = sampleProduct.toAppObject();
        
        console.log(`Original price method: ${originalPrice}`);
        console.log(`SEO price method: ${seoCalculatedPrice}`);
        console.log(`API object price: ${apiObject.price}`);
        
        if (seoCalculatedPrice === apiObject.price) {
            console.log('✅ Price consistency maintained across methods');
        } else {
            console.log('⚠️  Price inconsistency detected - needs review');
        }

    } catch (error) {
        console.error('❌ Validation error:', error);
    }
}

function generateProductSchema(product) {
    const seoPrice = product.seoPrice || {};
    
    return {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": product.name,
        "description": product.description ? product.description.replace(/<[^>]*>/g, '') : product.name,
        "url": `${keystone.get('url')}/${product.href}`,
        "image": product.image ? product.image.secure_url : null,
        "brand": {
            "@type": "Brand",
            "name": product.brand ? product.brand.name : "Dial A Drink Kenya"
        },
        "category": product.category ? product.category.name : null,
        "offers": {
            "@type": "Offer",
            "price": seoPrice.price || 0,
            "priceCurrency": seoPrice.currency || "KES",
            "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            "seller": {
                "@type": "Organization",
                "name": "Dial A Drink Kenya",
                "url": keystone.get('url')
            }
        },
        "aggregateRating": product.averageRatings ? {
            "@type": "AggregateRating",
            "ratingValue": product.averageRatings,
            "reviewCount": product.ratingCount
        } : undefined
    };
}

// Run validation if called directly
if (require.main === module) {
    keystone.start({
        onReady: () => {
            validateProductStructuredData().then(() => {
                process.exit(0);
            }).catch(error => {
                console.error('Validation failed:', error);
                process.exit(1);
            });
        }
    });
}

module.exports = {
    validateProductStructuredData,
    generateProductSchema
};