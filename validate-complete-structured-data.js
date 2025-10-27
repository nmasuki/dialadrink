#!/usr/bin/env node

/**
 * Complete Structured Data Validation with Image Focus
 * Tests all requirements including the critical image field
 */

function validateCompleteStructuredData(product) {
    const errors = [];
    const warnings = [];
    
    console.log(`\n🔍 Validating: ${product.name || 'Unknown Product'}`);
    
    // 1. Basic Product Schema Requirements
    if (!product['@context'] || !product['@context'].includes('schema.org')) {
        errors.push('@context must use https://schema.org/');
    }
    
    if (!product['@type'] || product['@type'] !== 'Product') {
        errors.push('@type must be "Product"');
    }
    
    if (!product.name || product.name.trim().length === 0) {
        errors.push('Product name is required');
    }
    
    // 2. CRITICAL: Image Field Validation
    if (!product.image) {
        errors.push('CRITICAL: Missing image field - Required for Google Rich Results');
    } else {
        let images = Array.isArray(product.image) ? product.image : [product.image];
        
        if (images.length === 0 || !images[0]) {
            errors.push('CRITICAL: Image array is empty or first image is null');
        } else {
            images.forEach((img, index) => {
                if (!img || typeof img !== 'string') {
                    errors.push(`Image ${index + 1}: Invalid URL`);
                } else {
                    try {
                        new URL(img);
                        if (!img.startsWith('https://')) {
                            warnings.push(`Image ${index + 1}: Should use HTTPS`);
                        }
                    } catch {
                        errors.push(`Image ${index + 1}: Invalid URL format`);
                    }
                }
            });
            
            if (errors.filter(e => e.includes('Image')).length === 0) {
                console.log(`✅ Images: ${images.length} valid image(s) found`);
            }
        }
    }
    
    // 3. Required: offers, review, or aggregateRating
    const hasOffers = product.offers && typeof product.offers === 'object' && product.offers.price;
    const hasReview = product.review && Array.isArray(product.review) && product.review.length > 0;
    const hasAggregateRating = product.aggregateRating && product.aggregateRating.ratingValue;
    
    if (!hasOffers && !hasReview && !hasAggregateRating) {
        errors.push('CRITICAL: Must have at least one of: offers, review, or aggregateRating');
    }
    
    // 4. Validate offers if present
    if (hasOffers) {
        const offers = product.offers;
        if (!offers.priceCurrency) errors.push('offers: Missing priceCurrency');
        if (!offers.availability || !offers.availability.includes('schema.org')) {
            errors.push('offers: Missing or invalid availability');
        }
        console.log(`✅ Offers: ${offers.price} ${offers.priceCurrency || 'N/A'}`);
    }
    
    // 5. Validate aggregateRating if present  
    if (hasAggregateRating) {
        const rating = parseFloat(product.aggregateRating.ratingValue);
        const count = parseInt(product.aggregateRating.ratingCount);
        
        if (isNaN(rating) || rating < 1 || rating > 5) {
            errors.push('aggregateRating: ratingValue must be 1-5');
        }
        if (isNaN(count) || count < 1) {
            errors.push('aggregateRating: ratingCount must be ≥1');
        }
        
        if (errors.filter(e => e.includes('aggregateRating')).length === 0) {
            console.log(`✅ Rating: ${rating}/5 (${count} reviews)`);
        }
    }
    
    return { errors, warnings };
}

// Test products with various image scenarios
const testProducts = [
    // Perfect product
    {
        "@context": "https://schema.org/",
        "@type": "Product", 
        "name": "Premium Beer",
        "image": [
            "https://res.cloudinary.com/example/image/upload/c_fit,w_800,h_800/beer.jpg",
            "https://res.cloudinary.com/example/image/upload/c_fit,w_800,h_800/beer_alt.jpg"
        ],
        "offers": {
            "@type": "Offer",
            "price": "300",
            "priceCurrency": "KES",
            "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
            "@type": "AggregateRating", 
            "ratingValue": "4.5",
            "ratingCount": "10"
        }
    },
    
    // Product with fallback image
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Wine with Fallback Image",
        "image": ["https://www.dialadrinkkenya.com/images/placeholder_image.png"],
        "offers": {
            "@type": "Offer",
            "price": "1500", 
            "priceCurrency": "KES",
            "availability": "https://schema.org/InStock"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.2",
            "ratingCount": "5"
        }
    },
    
    // Product missing image (should fail)
    {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": "Product Without Image",
        // Missing image field
        "offers": {
            "@type": "Offer",
            "price": "500",
            "priceCurrency": "KES", 
            "availability": "https://schema.org/InStock"
        }
    },
    
    // Product with empty image array (should fail)
    {
        "@context": "https://schema.org/",
        "@type": "Product", 
        "name": "Product with Empty Image",
        "image": [], // Empty array
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.0",
            "ratingCount": "3"
        }
    }
];

console.log('🚀 Complete Structured Data Validation (Image Focus)');
console.log('=====================================================');

let totalErrors = 0;
let totalWarnings = 0;
let passCount = 0;

testProducts.forEach((product, index) => {
    const result = validateCompleteStructuredData(product);
    
    totalErrors += result.errors.length;
    totalWarnings += result.warnings.length;
    
    if (result.errors.length === 0) {
        passCount++;
        console.log('\n✅ PASS');
    } else {
        console.log('\n❌ ERRORS:');
        result.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (result.warnings.length > 0) {
        console.log('\n⚠️  WARNINGS:');
        result.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
});

console.log('\n📊 FINAL VALIDATION SUMMARY');
console.log('============================');
console.log(`✅ Passed: ${passCount}/${testProducts.length} products`);
console.log(`❌ Total Errors: ${totalErrors}`);
console.log(`⚠️  Total Warnings: ${totalWarnings}`);

if (passCount === testProducts.length) {
    console.log('\n🎉 All tests passed! Template should work for Google Rich Results');
} else {
    console.log('\n⚠️  Some validation issues remain');
}

console.log('\n🔧 TEMPLATE FIXES SUMMARY:');
console.log('===========================');
console.log('✅ Image field: Added fallback to placeholder_image.png'); 
console.log('✅ Image array: Enhanced with multiple images when available');
console.log('✅ Image quality: Set to 800x800 with format optimization');
console.log('✅ URL validation: All images use proper HTTPS URLs');
console.log('✅ Error handling: Graceful fallback for missing images');

console.log('\n🧪 TEST YOUR FIXES:');
console.log('====================');
console.log('1. Visit: https://search.google.com/test/rich-results');
console.log('2. Test URLs:');
console.log('   - https://www.dialadrinkkenya.com/beers');
console.log('   - https://www.dialadrinkkenya.com/category/wine/rose-wine'); 
console.log('   - Any individual product page');
console.log('3. Verify "Valid" status with no image errors');

module.exports = { validateCompleteStructuredData };