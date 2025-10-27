#!/usr/bin/env node

/**
 * Google Rich Results Structured Data Validator
 * Tests product pages for required schema.org markup
 */

const https = require('https');
const { JSDOM } = require('jsdom');

const testUrls = [
    'https://www.dialadrinkkenya.com/beers',
    'https://www.dialadrinkkenya.com/category/wine/rose-wine', 
    'https://www.dialadrinkkenya.com/category/wine/red-wine'
];

function validateStructuredData(jsonLd) {
    const errors = [];
    const warnings = [];
    
    // Check required properties
    if (!jsonLd['@context']) {
        errors.push('Missing @context');
    } else if (!jsonLd['@context'].includes('schema.org')) {
        errors.push('@context should use schema.org');
    }
    
    if (!jsonLd['@type'] || jsonLd['@type'] !== 'Product') {
        errors.push('Missing or invalid @type (should be "Product")');
    }
    
    if (!jsonLd.name || jsonLd.name.trim().length === 0) {
        errors.push('Missing or empty product name');
    }
    
    // Check for required: offers, review, or aggregateRating
    const hasOffers = jsonLd.offers && Object.keys(jsonLd.offers).length > 0;
    const hasReview = jsonLd.review && jsonLd.review.length > 0;
    const hasAggregateRating = jsonLd.aggregateRating && jsonLd.aggregateRating.ratingValue;
    
    if (!hasOffers && !hasReview && !hasAggregateRating) {
        errors.push('CRITICAL: Missing required property - must have at least one of: offers, review, or aggregateRating');
    }
    
    // Validate offers if present
    if (hasOffers) {
        const offers = jsonLd.offers;
        
        if (!offers['@type'] || offers['@type'] !== 'Offer') {
            errors.push('offers: Missing or invalid @type (should be "Offer")');
        }
        
        if (!offers.price || isNaN(parseFloat(offers.price))) {
            errors.push('offers: Missing or invalid price');
        }
        
        if (!offers.priceCurrency) {
            errors.push('offers: Missing priceCurrency');
        }
        
        if (!offers.availability || !offers.availability.includes('schema.org')) {
            errors.push('offers: Missing or invalid availability');
        }
        
        if (!offers.seller || !offers.seller.name) {
            warnings.push('offers: Missing seller information');
        }
    }
    
    // Validate aggregateRating if present
    if (hasAggregateRating) {
        const rating = jsonLd.aggregateRating;
        
        if (!rating['@type'] || rating['@type'] !== 'AggregateRating') {
            errors.push('aggregateRating: Missing or invalid @type');
        }
        
        const ratingValue = parseFloat(rating.ratingValue);
        if (isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            errors.push('aggregateRating: ratingValue must be between 1 and 5');
        }
        
        const ratingCount = parseInt(rating.ratingCount);
        if (isNaN(ratingCount) || ratingCount < 1) {
            errors.push('aggregateRating: ratingCount must be at least 1');
        }
    }
    
    // Validate reviews if present
    if (hasReview) {
        jsonLd.review.forEach((review, index) => {
            if (!review['@type'] || review['@type'] !== 'Review') {
                errors.push(`review[${index}]: Missing or invalid @type`);
            }
            
            if (!review.reviewRating || !review.reviewRating.ratingValue) {
                errors.push(`review[${index}]: Missing reviewRating.ratingValue`);
            }
            
            if (!review.author || !review.author.name) {
                errors.push(`review[${index}]: Missing author.name`);
            }
        });
    }
    
    // Check image
    if (!jsonLd.image || !Array.isArray(jsonLd.image) || jsonLd.image.length === 0) {
        warnings.push('Missing or invalid image array');
    }
    
    return { errors, warnings };
}

async function testUrl(url) {
    return new Promise((resolve, reject) => {
        console.log(`\n🔍 Testing: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const dom = new JSDOM(data);
                    const document = dom.window.document;
                    
                    const scriptTags = document.querySelectorAll('script[type="application/ld+json"]');
                    
                    if (scriptTags.length === 0) {
                        console.log('❌ No JSON-LD structured data found');
                        return resolve({ url, errors: ['No structured data found'], warnings: [] });
                    }
                    
                    let allErrors = [];
                    let allWarnings = [];
                    
                    scriptTags.forEach((script, index) => {
                        try {
                            const jsonLd = JSON.parse(script.textContent);
                            console.log(`📋 Found structured data block ${index + 1}`);
                            
                            if (jsonLd['@type'] === 'Product') {
                                const validation = validateStructuredData(jsonLd);
                                allErrors = allErrors.concat(validation.errors);
                                allWarnings = allWarnings.concat(validation.warnings);
                                
                                // Log validation results
                                if (validation.errors.length === 0) {
                                    console.log('✅ Product structured data validation passed');
                                } else {
                                    console.log('❌ Product structured data validation failed:');
                                    validation.errors.forEach(error => console.log(`   - ${error}`));
                                }
                                
                                if (validation.warnings.length > 0) {
                                    console.log('⚠️  Warnings:');
                                    validation.warnings.forEach(warning => console.log(`   - ${warning}`));
                                }
                                
                                // Log key properties
                                console.log(`   Name: ${jsonLd.name || 'N/A'}`);
                                console.log(`   Offers: ${jsonLd.offers ? '✅' : '❌'}`);
                                console.log(`   Reviews: ${jsonLd.review ? `✅ (${jsonLd.review.length})` : '❌'}`);
                                console.log(`   AggregateRating: ${jsonLd.aggregateRating ? `✅ (${jsonLd.aggregateRating.ratingValue}/5)` : '❌'}`);
                            }
                        } catch (parseError) {
                            allErrors.push(`JSON parsing error in block ${index + 1}: ${parseError.message}`);
                            console.log(`❌ JSON parsing error in block ${index + 1}: ${parseError.message}`);
                        }
                    });
                    
                    resolve({ url, errors: allErrors, warnings: allWarnings });
                    
                } catch (error) {
                    console.log(`❌ Error processing ${url}: ${error.message}`);
                    reject(error);
                }
            });
            
        }).on('error', (error) => {
            console.log(`❌ Request error for ${url}: ${error.message}`);
            reject(error);
        });
    });
}

async function runTests() {
    console.log('🚀 Google Rich Results Validation Test');
    console.log('=====================================');
    
    const results = [];
    
    for (const url of testUrls) {
        try {
            const result = await testUrl(url);
            results.push(result);
        } catch (error) {
            results.push({ url, errors: [error.message], warnings: [] });
        }
    }
    
    // Summary
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=====================');
    
    let totalErrors = 0;
    let totalWarnings = 0;
    
    results.forEach(result => {
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
        
        const status = result.errors.length === 0 ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${result.url}`);
        
        if (result.errors.length > 0) {
            console.log(`  Errors: ${result.errors.length}`);
        }
        if (result.warnings.length > 0) {
            console.log(`  Warnings: ${result.warnings.length}`);
        }
    });
    
    console.log(`\nTotal Errors: ${totalErrors}`);
    console.log(`Total Warnings: ${totalWarnings}`);
    
    if (totalErrors === 0) {
        console.log('\n🎉 All tests passed! Your structured data should be eligible for Google Rich Results.');
    } else {
        console.log('\n⚠️  Some issues found. Please fix the errors above to be eligible for Google Rich Results.');
    }
}

// Run the tests
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = { validateStructuredData, testUrl };