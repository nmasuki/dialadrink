#!/usr/bin/env node

/**
 * Simple Database Connection Test and Virtual Field Checker
 * 
 * This script connects directly to MongoDB to check for relationship issues
 * without starting the full Keystone application.
 */

const mongoose = require('mongoose');

// Connection setup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/diala';

async function connectToDatabase() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB successfully');
        return true;
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        return false;
    }
}

async function checkCollections() {
    console.log('\n=== Checking Collections ===');
    
    try {
        const collections = await mongoose.connection.listCollections().toArray();
        console.log('Available collections:');
        collections.forEach(col => {
            console.log(`  - ${col.name}`);
        });
        
        return collections.map(col => col.name);
    } catch (error) {
        console.error('Error listing collections:', error.message);
        return [];
    }
}

async function checkProductDocuments() {
    console.log('\n=== Checking Product Documents ===');
    
    try {
        const ProductSchema = new mongoose.Schema({}, { strict: false });
        const Product = mongoose.model('Product', ProductSchema, 'products');
        
        const count = await Product.count();
        console.log(`Total products: ${count}`);
        
        if (count > 0) {
            const sample = await Product.findOne({});
            console.log('Sample product structure:');
            console.log(JSON.stringify(sample, null, 2));
            
            // Check for common relationship fields
            const fieldsToCheck = ['category', 'subCategory', 'brand', 'grape', 'priceOptions'];
            console.log('\nRelationship field analysis:');
            
            for (const field of fieldsToCheck) {
                const withField = await Product.count({ [field]: { $exists: true, $ne: null } });
                console.log(`  ${field}: ${withField}/${count} documents have this field`);
                
                if (withField > 0) {
                    // Check for invalid ObjectIds
                    const sampleDoc = await Product.findOne({ [field]: { $exists: true, $ne: null } });
                    if (sampleDoc && sampleDoc[field]) {
                        const fieldValue = sampleDoc[field];
                        console.log(`    Sample ${field} value: ${fieldValue} (${typeof fieldValue})`);
                        
                        if (Array.isArray(fieldValue)) {
                            console.log(`    Array length: ${fieldValue.length}`);
                            if (fieldValue.length > 0) {
                                console.log(`    First element: ${fieldValue[0]} (${typeof fieldValue[0]})`);
                            }
                        }
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error checking products:', error.message);
    }
}

async function checkPriceOptions() {
    console.log('\n=== Checking ProductPriceOption Documents ===');
    
    try {
        const PriceOptionSchema = new mongoose.Schema({}, { strict: false });
        const PriceOption = mongoose.model('ProductPriceOption', PriceOptionSchema, 'productpriceoptions');
        
        const count = await PriceOption.count();
        console.log(`Total price options: ${count}`);
        
        if (count > 0) {
            const sample = await PriceOption.findOne({});
            console.log('Sample price option structure:');
            console.log(JSON.stringify(sample, null, 2));
            
            // Check for orphaned references
            const withProduct = await PriceOption.count({ product: { $exists: true, $ne: null } });
            const withOption = await PriceOption.count({ option: { $exists: true, $ne: null } });
            
            console.log(`Price options with product reference: ${withProduct}/${count}`);
            console.log(`Price options with option reference: ${withOption}/${count}`);
        }
        
    } catch (error) {
        console.error('Error checking price options:', error.message);
    }
}

async function validateObjectIds() {
    console.log('\n=== Validating ObjectId References ===');
    
    try {
        // Check products for invalid ObjectId references
        const ProductSchema = new mongoose.Schema({}, { strict: false });
        const Product = mongoose.model('Product2', ProductSchema, 'products');
        
        const products = await Product.find({}).limit(10);
        console.log(`Checking ${products.length} sample products for ObjectId validity...`);
        
        let invalidCount = 0;
        
        for (const product of products) {
            const relationshipFields = ['category', 'subCategory', 'brand', 'grape'];
            
            for (const field of relationshipFields) {
                if (product[field]) {
                    if (!mongoose.Types.ObjectId.isValid(product[field])) {
                        console.log(`❌ Invalid ObjectId in product ${product._id}, field ${field}: ${product[field]}`);
                        invalidCount++;
                    }
                }
            }
            
            // Check priceOptions array
            if (product.priceOptions && Array.isArray(product.priceOptions)) {
                for (let i = 0; i < product.priceOptions.length; i++) {
                    const priceOption = product.priceOptions[i];
                    if (priceOption && !mongoose.Types.ObjectId.isValid(priceOption._id || priceOption)) {
                        console.log(`❌ Invalid ObjectId in product ${product._id}, priceOptions[${i}]: ${priceOption}`);
                        invalidCount++;
                    }
                }
            }
        }
        
        if (invalidCount === 0) {
            console.log('✅ No invalid ObjectId references found in sample');
        } else {
            console.log(`⚠️  Found ${invalidCount} invalid ObjectId references`);
        }
        
    } catch (error) {
        console.error('Error validating ObjectIds:', error.message);
    }
}

async function suggestFixes() {
    console.log('\n=== Suggested Fixes ===');
    
    console.log('Based on the Mongoose virtual population error, here are likely causes and fixes:');
    console.log('');
    console.log('1. Virtual Field Configuration Issue:');
    console.log('   The error suggests a virtual field is trying to populate without proper configuration.');
    console.log('   Check your models for virtual fields that might need localField and foreignField.');
    console.log('');
    console.log('2. Deep Population Path Issue:');
    console.log('   If using "priceOptions.option", ensure both relationships are properly configured.');
    console.log('');
    console.log('3. Invalid ObjectId References:');
    console.log('   Clean up any invalid ObjectId values that might cause population to fail.');
    console.log('');
    console.log('4. Missing Referenced Documents:');
    console.log('   Ensure all referenced documents actually exist in their respective collections.');
    console.log('');
    console.log('To fix, you can:');
    console.log('   A. Run the comprehensive fix script: node fix-database-relationships.js');
    console.log('   B. Add proper virtual field configurations to your models');
    console.log('   C. Remove or fix invalid ObjectId references');
    console.log('   D. Use populate() with explicit path configuration');
}

async function main() {
    console.log('=== Simple Database Diagnostic ===');
    
    const connected = await connectToDatabase();
    if (!connected) {
        console.log('Cannot proceed without database connection');
        process.exit(1);
    }
    
    try {
        await checkCollections();
        await checkProductDocuments();
        await checkPriceOptions();
        await validateObjectIds();
        await suggestFixes();
        
        console.log('\n=== Diagnostic Complete ===');
        
    } catch (error) {
        console.error('Diagnostic error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the diagnostic
main().catch(console.error);