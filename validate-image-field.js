#!/usr/bin/env node

/**
 * Image Field Validation for Structured Data
 * Tests specifically for the image field requirements
 */

function validateImageField(product) {
    const errors = [];
    const warnings = [];
    
    console.log(`\n🖼️  Validating Image Field for: ${product.name || 'Unknown Product'}`);
    
    // Check if image field exists
    if (!product.image) {
        errors.push('CRITICAL: Missing image field - this is required for Google Rich Results');
        return { errors, warnings };
    }
    
    // Check image format
    let images = [];
    if (typeof product.image === 'string') {
        images = [product.image];
        warnings.push('Image should be an array for better SEO, even with single image');
    } else if (Array.isArray(product.image)) {
        images = product.image;
        console.log('✅ Image is properly formatted as array');
    } else {
        errors.push('Image field must be a string or array');
        return { errors, warnings };
    }
    
    // Validate each image URL
    images.forEach((imageUrl, index) => {
        if (!imageUrl || typeof imageUrl !== 'string') {
            errors.push(`Image ${index + 1}: Invalid or empty URL`);
            return;
        }
        
        // Check for valid URL format
        try {
            new URL(imageUrl);
            console.log(`✅ Image ${index + 1}: Valid URL format`);
        } catch {
            errors.push(`Image ${index + 1}: Invalid URL format - ${imageUrl}`);
            return;
        }
        
        // Check for HTTPS
        if (!imageUrl.startsWith('https://')) {
            warnings.push(`Image ${index + 1}: Should use HTTPS for better SEO`);
        }
        
        // Check for image file extensions
        const hasImageExt = /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(imageUrl);
        if (!hasImageExt) {
            warnings.push(`Image ${index + 1}: URL should include image file extension`);
        }
        
        // Check for reasonable dimensions in URL (if Cloudinary)
        if (imageUrl.includes('cloudinary') && !imageUrl.includes('w_')) {
            warnings.push(`Image ${index + 1}: Consider specifying image dimensions for performance`);
        }
    });
    
    // Check minimum requirements
    if (images.length === 0) {
        errors.push('At least one image URL is required');
    } else {
        console.log(`✅ Found ${images.length} image(s)`);
    }
    
    return { errors, warnings };
}

// Test cases based on your template fixes
const testProducts = [
    {
        name: "Sample Product with Valid Images",
        image: [
            "https://res.cloudinary.com/example/image/upload/c_fit,w_800,h_800/product1.jpg",
            "https://res.cloudinary.com/example/image/upload/c_fit,w_800,h_800/product1_alt.jpg"
        ]
    },
    {
        name: "Product with Single Image (String)",
        image: "https://res.cloudinary.com/example/image/upload/c_fit,w_800,h_800/product2.jpg"
    },
    {
        name: "Product with Default Fallback",
        image: ["https://www.dialadrinkkenya.com/images/default-product.jpg"]
    },
    {
        name: "Product with Invalid Image",
        image: ["not-a-valid-url"]
    },
    {
        name: "Product with Missing Image"
        // No image field
    },
    {
        name: "Product with HTTP Image (Security Warning)", 
        image: ["http://example.com/image.jpg"] // HTTP instead of HTTPS
    }
];

console.log('🚀 Image Field Validation Test');
console.log('===============================');

let totalErrors = 0;
let totalWarnings = 0;

testProducts.forEach((product, index) => {
    const result = validateImageField(product);
    
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
    console.log(`\n${status} Test ${index + 1}`);
});

console.log('\n📊 VALIDATION SUMMARY');
console.log('=====================');
console.log(`Total Errors: ${totalErrors}`);
console.log(`Total Warnings: ${totalWarnings}`);

console.log('\n💡 IMAGE REQUIREMENTS FOR GOOGLE RICH RESULTS:');
console.log('===============================================');
console.log('1. ✅ Image field is REQUIRED - cannot be missing');
console.log('2. ✅ Must be a valid URL (preferably HTTPS)');
console.log('3. ✅ Should be an array format, even for single image');
console.log('4. ✅ Minimum 1 image, multiple images recommended');
console.log('5. ✅ High resolution recommended (800x800 or larger)');
console.log('6. ✅ Supported formats: JPG, PNG, WebP, GIF');
console.log('7. ✅ Must be publicly accessible (no authentication required)');

console.log('\n🔧 FIXES APPLIED TO YOUR TEMPLATE:');
console.log('===================================');
console.log('✅ Added fallback for missing image: default-product.jpg');
console.log('✅ Enhanced image array with main + alt images');
console.log('✅ Specified optimal dimensions: 800x800');
console.log('✅ Added format and quality optimization');
console.log('✅ Conditional logic to handle missing images');

console.log('\n🚨 CRITICAL NEXT STEPS:');
console.log('========================');
console.log('1. Create default product image at: /public/images/default-product.jpg');
console.log('2. Ensure all products in database have valid image URLs');
console.log('3. Test with Google Rich Results Tool');
console.log('4. Check that Cloudinary URLs are accessible publicly');

module.exports = { validateImageField };