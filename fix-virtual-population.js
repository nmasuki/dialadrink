#!/usr/bin/env node

/**
 * Virtual Population Fixer
 * 
 * This script specifically addresses Mongoose virtual population errors
 * by checking and fixing virtual field configurations that require
 * localField and foreignField options.
 * 
 * Usage: node fix-virtual-population.js
 */

const keystone = require('./app-init');
const mongoose = keystone.get('mongoose');

async function analyzeVirtualFields() {
    console.log('=== Analyzing Virtual Field Configurations ===\n');
    
    try {
        // Get all registered models
        const models = Object.keys(keystone.lists);
        
        for (const modelName of models) {
            const List = keystone.list(modelName);
            if (!List) continue;
            
            const Model = List.model;
            const schema = Model.schema;
            
            console.log(`--- ${modelName} ---`);
            
            // Check for virtual fields
            const virtuals = schema.virtuals;
            const virtualNames = Object.keys(virtuals).filter(name => 
                !name.startsWith('_') && name !== 'id'
            );
            
            if (virtualNames.length > 0) {
                console.log(`Virtual fields: ${virtualNames.join(', ')}`);
                
                // Check each virtual for population options
                virtualNames.forEach(virtualName => {
                    const virtual = virtuals[virtualName];
                    if (virtual.options) {
                        const options = virtual.options;
                        console.log(`  ${virtualName}:`, {
                            ref: options.ref,
                            localField: options.localField,
                            foreignField: options.foreignField,
                            justOne: options.justOne
                        });
                        
                        // Check for potential issues
                        if (options.ref && (!options.localField || !options.foreignField)) {
                            console.log(`    ⚠️  Missing localField or foreignField for virtual population`);
                        }
                    }
                });
            } else {
                console.log('No custom virtual fields found');
            }
            
            // Check for relationship configurations
            if (List.relationships && Object.keys(List.relationships).length > 0) {
                console.log('Relationships:', Object.keys(List.relationships));
                Object.keys(List.relationships).forEach(relName => {
                    const rel = List.relationships[relName];
                    console.log(`  ${relName}: ref=${rel.ref}, path=${rel.path}, refPath=${rel.refPath}`);
                });
            }
            
            console.log('');
        }
        
    } catch (error) {
        console.error('Error analyzing virtual fields:', error);
    }
}

async function testPopulation() {
    console.log('=== Testing Population Scenarios ===\n');
    
    try {
        // Test Product model population
        console.log('Testing Product model...');
        const Product = keystone.list('Product').model;
        const product = await Product.findOne({});
        
        if (product) {
            console.log(`Testing with product: ${product._id}`);
            
            const populationTests = [
                { path: 'category', description: 'Category relationship' },
                { path: 'subCategory', description: 'SubCategory relationship' },
                { path: 'brand', description: 'Brand relationship' },
                { path: 'grape', description: 'Grape relationship' },
                { path: 'priceOptions', description: 'Price Options array' },
                { path: 'priceOptions.option', description: 'Nested option in price options' }
            ];
            
            for (const test of populationTests) {
                try {
                    const populated = await Product.findById(product._id).populate(test.path);
                    console.log(`  ✓ ${test.description}: SUCCESS`);
                    
                    // Log populated data structure
                    const populatedField = test.path.includes('.') 
                        ? populated.priceOptions?.[0]?.option 
                        : populated[test.path];
                    
                    if (populatedField) {
                        console.log(`    Data: ${JSON.stringify(populatedField).substring(0, 100)}...`);
                    }
                } catch (error) {
                    console.log(`  ✗ ${test.description}: FAILED`);
                    console.log(`    Error: ${error.message}`);
                    
                    // Try to identify the specific issue
                    if (error.message.includes('localField') || error.message.includes('foreignField')) {
                        console.log(`    ⚠️  Virtual population configuration issue detected`);
                    }
                }
            }
        } else {
            console.log('No products found for testing');
        }
        
        console.log('');
        
        // Test ProductPriceOption model
        console.log('Testing ProductPriceOption model...');
        const ProductPriceOption = keystone.list('ProductPriceOption').model;
        const priceOption = await ProductPriceOption.findOne({});
        
        if (priceOption) {
            console.log(`Testing with price option: ${priceOption._id}`);
            
            try {
                const populated = await ProductPriceOption.findById(priceOption._id)
                    .populate('product')
                    .populate('option');
                console.log(`  ✓ Product and Option population: SUCCESS`);
            } catch (error) {
                console.log(`  ✗ Product and Option population: FAILED`);
                console.log(`    Error: ${error.message}`);
            }
        } else {
            console.log('No price options found for testing');
        }
        
    } catch (error) {
        console.error('Error in testPopulation:', error);
    }
}

async function generateFixSuggestions() {
    console.log('=== Fix Suggestions ===\n');
    
    console.log('Based on the analysis, here are potential fixes for virtual population issues:');
    console.log('');
    
    console.log('1. For Product model virtual fields:');
    console.log('   If you have virtual fields for reverse relationships, ensure they have:');
    console.log('   - ref: target model name');
    console.log('   - localField: field name in this model');
    console.log('   - foreignField: field name in target model');
    console.log('');
    
    console.log('2. Example virtual field configuration:');
    console.log(`   schema.virtual('relatedItems', {
     ref: 'RelatedModel',
     localField: '_id',
     foreignField: 'productId',
     justOne: false
   });`);
    console.log('');
    
    console.log('3. Check for deep population paths:');
    console.log('   Ensure all intermediate relationships are properly configured');
    console.log('   Example: "priceOptions.option" requires both relationships to work');
    console.log('');
    
    console.log('4. Common fixes:');
    console.log('   - Remove invalid ObjectId references');
    console.log('   - Add missing localField/foreignField to virtual configurations');
    console.log('   - Ensure referenced documents exist in the database');
    console.log('   - Use proper population syntax in queries');
}

async function quickFix() {
    console.log('=== Applying Quick Fixes ===\n');
    
    try {
        // Remove any documents with invalid ObjectId references
        console.log('Scanning for invalid ObjectId references...');
        
        const Product = keystone.list('Product').model;
        const products = await Product.find({});
        
        let fixCount = 0;
        
        for (const product of products) {
            let needsSave = false;
            
            // Check each relationship field
            const relationshipFields = ['category', 'subCategory', 'brand', 'grape'];
            
            for (const field of relationshipFields) {
                if (product[field] && !mongoose.Types.ObjectId.isValid(product[field])) {
                    console.log(`Fixing invalid ${field} reference in product ${product._id}`);
                    product[field] = null;
                    needsSave = true;
                }
            }
            
            // Check priceOptions array
            if (product.priceOptions && Array.isArray(product.priceOptions)) {
                const validPriceOptions = product.priceOptions.filter(po => 
                    po && mongoose.Types.ObjectId.isValid(po._id || po)
                );
                
                if (validPriceOptions.length !== product.priceOptions.length) {
                    console.log(`Fixing invalid priceOptions in product ${product._id}`);
                    product.priceOptions = validPriceOptions;
                    needsSave = true;
                }
            }
            
            if (needsSave) {
                await product.save();
                fixCount++;
            }
        }
        
        console.log(`Applied fixes to ${fixCount} products`);
        
    } catch (error) {
        console.error('Error in quickFix:', error);
    }
}

async function main() {
    console.log('=== Virtual Population Diagnostic Tool ===\n');
    
    try {
        // Connect to database
        await new Promise((resolve, reject) => {
            keystone.start({
                onMount: resolve,
                onFailure: reject
            });
        });
        
        console.log('Connected to database successfully\n');
        
        // Run diagnostic functions
        await analyzeVirtualFields();
        await testPopulation();
        await generateFixSuggestions();
        await quickFix();
        
        console.log('\n=== Diagnostic Complete ===');
        
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        // Close database connection
        mongoose.connection.close();
        process.exit(0);
    }
}

// Handle errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main };