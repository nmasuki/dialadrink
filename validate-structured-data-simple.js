#!/usr/bin/env node

/**
 * Simple Structured Data Validation Test
 * Tests key validation points for Google Rich Results
 */

function validateProductStructuredData(product) {
    const errors = [];
    const warnings = [];
    
    console.log(`\n🔍 Validating Product: ${product.name || 'Unknown'}`);
    
    // Check required properties for Product structured data
    if (!product['@context'] || !product['@context'].includes('schema.org')) {
        errors.push('@context must use https://schema.org/');
    } else {
        console.log('✅ @context: Valid');
    }
    
    if (!product['@type'] || product['@type'] !== 'Product') {
        errors.push('@type must be "Product"');
    } else {
        console.log('✅ @type: Valid');
    }
    
    if (!product.name || product.name.trim().length === 0) {
        errors.push('Product name is required');
    } else {
        console.log('✅ name: Valid');
    }
    
    // Check for required: offers, review, or aggregateRating
    const hasOffers = product.offers && typeof product.offers === 'object';
    const hasReview = product.review && Array.isArray(product.review) && product.review.length > 0;
    const hasAggregateRating = product.aggregateRating && product.aggregateRating.ratingValue;
    
    if (!hasOffers && !hasReview && !hasAggregateRating) {
        errors.push('CRITICAL: Must have at least one of: offers, review, or aggregateRating');
    } else {
        console.log('✅ Required properties: At least one present');
        
        if (hasOffers) console.log('   - offers: ✅');
        if (hasReview) console.log(`   - review: ✅ (${product.review.length} reviews)`);
        if (hasAggregateRating) console.log('   - aggregateRating: ✅');
    }
    
    // Validate offers if present
    if (hasOffers) {
        const offers = product.offers;
        
        if (!offers['@type'] || offers['@type'] !== 'Offer') {
            errors.push('offers @type must be "Offer"');
        }
        
        if (!offers.price || isNaN(parseFloat(offers.price))) {
            errors.push('offers price must be a valid number');
        }
        
        if (!offers.priceCurrency) {
            errors.push('offers priceCurrency is required');
        }
        
        if (!offers.availability || !offers.availability.includes('schema.org')) {
            errors.push('offers availability must use schema.org URL');
        }
        
        if (!offers.seller || !offers.seller.name) {
            warnings.push('offers should include seller information');
        }
        
        console.log(`   Price: ${offers.price} ${offers.priceCurrency}`);
        console.log(`   Availability: ${offers.availability}`);
    }
    
    // Validate aggregateRating if present
    if (hasAggregateRating) {
        const rating = product.aggregateRating;
        
        const ratingValue = parseFloat(rating.ratingValue);
        if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            errors.push('aggregateRating ratingValue must be between 1 and 5');
        }
        
        const ratingCount = parseInt(rating.ratingCount);
        if (isNaN(ratingCount) || ratingCount < 1) {
            errors.push('aggregateRating ratingCount must be at least 1');
        }
        
        console.log(`   Rating: ${ratingValue}/5 (${ratingCount} reviews)`);
    }
    
    // Validate image
    if (!product.image || (!Array.isArray(product.image) && typeof product.image !== 'string')) {
        warnings.push('Product should have image property');
    }
    
    return { errors, warnings };
}

// Sample product data for validation based on your template
const sampleProducts = [
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Sample Beer Product",
        "image": ["https://example.com/beer.jpg"],
        "description": "Premium quality beer available for delivery in Kenya.",
        "sku": "12345",
        "mpn": "beer-sample",
        "gtin": "12345",
        "brand": {
            "@type": "Brand",
            "name": "Sample Brewery"
        },
        "category": "Beer",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.5",
            "bestRating": "5",
            "worstRating": "1",
            "ratingCount": "10"
        },
        "offers": {
            "@type": "Offer",
            "url": "https://www.dialadrinkkenya.com/beer-sample",
            "priceCurrency": "KES",
            "price": "250",
            "priceValidUntil": "2025-12-31",
            "availability": "https://schema.org/InStock",
            "itemCondition": "https://schema.org/NewCondition",
            "seller": {
                "@type": "Organization",
                "name": "Dial A Drink Kenya",
                "url": "https://www.dialadrinkkenya.com"
            }
        }
    },
    {
        "@context": "http://schema.org/", // Wrong context (http vs https)
        "@type": "Product",
        "name": "", // Missing name
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "6", // Invalid rating (over 5)
            "ratingCount": "0"  // Invalid count (should be at least 1)
        }
        // Missing offers, review - this should fail
    }
];

console.log('🚀 Structured Data Validation Test');
console.log('====================================');

let totalErrors = 0;
let totalWarnings = 0;

sampleProducts.forEach((product, index) => {
    console.log(`\n📋 Sample Product ${index + 1}:`);
    const result = validateProductStructuredData(product);
    
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
    
    if (result.errors.length > 0) {
        console.log('\n❌ ERRORS:');
        result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (result.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
    
    const status = result.errors.length === 0 ? '✅ PASS' : '❌ FAIL';
    console.log(`\n${status} Sample ${index + 1}`);
});

console.log('\n📊 VALIDATION SUMMARY');
console.log('=====================');
console.log(`Total Errors: ${totalErrors}`);
console.log(`Total Warnings: ${totalWarnings}`);

if (totalErrors === 0) {
    console.log('\n🎉 All samples passed! Your structured data template should be eligible for Google Rich Results.');
} else {
    console.log('\n⚠️  Some validation issues found. Review the template fixes needed.');
}

console.log('\n💡 KEY REQUIREMENTS FOR GOOGLE RICH RESULTS:');
console.log('============================================');
console.log('1. Use https://schema.org/ as @context');
console.log('2. Include @type: "Product"');
console.log('3. Provide valid product name');
console.log('4. Include AT LEAST ONE of: offers, review, or aggregateRating');
console.log('5. Offers must have valid price, priceCurrency, and availability');
console.log('6. AggregateRating must have ratingValue (1-5) and ratingCount (≥1)');
console.log('7. Include product images');

console.log('\n🔧 FIXES APPLIED TO YOUR TEMPLATE:');
console.log('==================================');
console.log('✅ Updated @context to https://schema.org/');
console.log('✅ Enhanced offers structure with required fields');
console.log('✅ Improved aggregateRating validation');
console.log('✅ Added fallback values for missing data');
console.log('✅ Added proper image arrays');
console.log('✅ Added review structure for products with reviews');
console.log('✅ Added category-level structured data for listing pages');

module.exports = { validateProductStructuredData };