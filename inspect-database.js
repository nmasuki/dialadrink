#!/usr/bin/env node

/**
 * Database Content Inspector
 * 
 * Checks what data currently exists in the database
 * and helps identify the source of the virtual population error.
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

async function inspectCollection(collectionName, limit = 5) {
    console.log(`\n=== ${collectionName} ===`);
    
    try {
        const Schema = new mongoose.Schema({}, { strict: false });
        const Model = mongoose.model(collectionName + 'Temp', Schema, collectionName);
        
        const count = await Model.count();
        console.log(`Total documents: ${count}`);
        
        if (count > 0) {
            const docs = await Model.find({}).limit(limit);
            console.log(`Sample documents (showing ${Math.min(limit, count)}):`);
            
            docs.forEach((doc, index) => {
                console.log(`\n[${index + 1}] Document ID: ${doc._id}`);
                
                // Show key fields
                const keyFields = ['name', 'key', 'state', 'quantity', 'price', 'category', 'brand', 'product', 'option'];
                keyFields.forEach(field => {
                    if (doc[field] !== undefined) {
                        console.log(`  ${field}: ${doc[field]}`);
                    }
                });
                
                // Show all fields for smaller objects
                if (Object.keys(doc.toObject()).length <= 10) {
                    console.log('  Full object:', JSON.stringify(doc.toObject(), null, 2));
                }
            });
        }
        
        return { count, sampleDocs: count > 0 ? await Model.find({}).limit(limit) : [] };
        
    } catch (error) {
        console.error(`Error inspecting ${collectionName}:`, error.message);
        return { count: 0, sampleDocs: [] };
    }
}

async function findRelationshipIssues() {
    console.log('\n=== Relationship Analysis ===');
    
    try {
        // Check products with references
        const ProductSchema = new mongoose.Schema({}, { strict: false });
        const Product = mongoose.model('ProductInspect', ProductSchema, 'products');
        
        const products = await Product.find({});
        
        if (products.length === 0) {
            console.log('No products found - this explains the virtual population error!');
            console.log('The error likely occurs when trying to populate relationships on non-existent products.');
            return;
        }
        
        console.log(`Found ${products.length} products. Checking their relationships...`);
        
        // Check for invalid references
        let issuesFound = 0;
        
        for (const product of products) {
            console.log(`\nProduct: ${product.name || product._id}`);
            
            // Check category reference
            if (product.category) {
                if (!mongoose.Types.ObjectId.isValid(product.category)) {
                    console.log(`  ❌ Invalid category ObjectId: ${product.category}`);
                    issuesFound++;
                } else {
                    // Check if category exists
                    const CategorySchema = new mongoose.Schema({}, { strict: false });
                    const Category = mongoose.model('CategoryInspect', CategorySchema, 'productcategories');
                    const categoryExists = await Category.findById(product.category);
                    console.log(`  Category: ${categoryExists ? '✅ Found' : '❌ Missing'} ${product.category}`);
                    if (!categoryExists) issuesFound++;
                }
            }
            
            // Check brand reference
            if (product.brand) {
                if (!mongoose.Types.ObjectId.isValid(product.brand)) {
                    console.log(`  ❌ Invalid brand ObjectId: ${product.brand}`);
                    issuesFound++;
                } else {
                    const BrandSchema = new mongoose.Schema({}, { strict: false });
                    const Brand = mongoose.model('BrandInspect', BrandSchema, 'productbrands');
                    const brandExists = await Brand.findById(product.brand);
                    console.log(`  Brand: ${brandExists ? '✅ Found' : '❌ Missing'} ${product.brand}`);
                    if (!brandExists) issuesFound++;
                }
            }
            
            // Check priceOptions array
            if (product.priceOptions && Array.isArray(product.priceOptions)) {
                console.log(`  Price Options: ${product.priceOptions.length} items`);
                for (let i = 0; i < product.priceOptions.length; i++) {
                    const priceOptionId = product.priceOptions[i];
                    if (!mongoose.Types.ObjectId.isValid(priceOptionId)) {
                        console.log(`    ❌ Invalid priceOption[${i}] ObjectId: ${priceOptionId}`);
                        issuesFound++;
                    }
                }
            }
        }
        
        console.log(`\nFound ${issuesFound} relationship issues`);
        
    } catch (error) {
        console.error('Error in relationship analysis:', error);
    }
}

async function checkExistingCategories() {
    console.log('\n=== Category Key Analysis ===');
    
    try {
        const CategorySchema = new mongoose.Schema({}, { strict: false });
        const Category = mongoose.model('CategoryKeyCheck', CategorySchema, 'productcategories');
        
        const categories = await Category.find({});
        console.log(`Found ${categories.length} categories`);
        
        if (categories.length > 0) {
            console.log('Category key analysis:');
            categories.forEach((cat, index) => {
                console.log(`[${index + 1}] ${cat.name || 'unnamed'}: key="${cat.key}" (${typeof cat.key})`);
            });
            
            // Check for duplicate keys
            const keyCount = {};
            categories.forEach(cat => {
                const key = cat.key || 'null';
                keyCount[key] = (keyCount[key] || 0) + 1;
            });
            
            console.log('\nKey frequency:');
            Object.keys(keyCount).forEach(key => {
                if (keyCount[key] > 1) {
                    console.log(`  ❌ "${key}": ${keyCount[key]} duplicates (this causes the E11000 error)`);
                } else {
                    console.log(`  ✅ "${key}": ${keyCount[key]} unique`);
                }
            });
        }
        
    } catch (error) {
        console.error('Error checking categories:', error);
    }
}

async function main() {
    console.log('=== Database Content Inspector ===');
    
    const connected = await connectToDatabase();
    if (!connected) {
        process.exit(1);
    }
    
    try {
        // Inspect key collections
        const collections = [
            'products',
            'productcategories',
            'productbrands',
            'productoptions',
            'productpriceoptions'
        ];
        
        const results = {};
        for (const collection of collections) {
            results[collection] = await inspectCollection(collection, 3);
        }
        
        // Check for relationship issues
        await findRelationshipIssues();
        
        // Check category key issues
        await checkExistingCategories();
        
        // Summary
        console.log('\n=== SUMMARY ===');
        Object.keys(results).forEach(collection => {
            console.log(`${collection}: ${results[collection].count} documents`);
        });
        
        if (results.products.count === 0) {
            console.log('\n🎯 ROOT CAUSE IDENTIFIED:');
            console.log('The virtual population error is likely caused by:');
            console.log('1. No products exist in the database');
            console.log('2. Code is trying to populate relationships on non-existent products');
            console.log('3. This triggers Mongoose virtual population errors');
            console.log('\nSOLUTION: Create products or handle empty state gracefully in code');
        }
        
    } catch (error) {
        console.error('Inspector error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

main().catch(console.error);