#!/usr/bin/env node

/**
 * Database Relationship Repair Script
 * 
 * This script reads all products, product categories, product price options,
 * and related models to fix missing foreign field relationships that cause
 * Mongoose virtual population errors.
 * 
 * Usage: node fix-database-relationships.js
 */

const keystone = require('./app-init');
const mongoose = require('mongoose');

// Statistics tracking
const stats = {
    products: { total: 0, fixed: 0, errors: 0 },
    categories: { total: 0, fixed: 0, errors: 0 },
    priceOptions: { total: 0, fixed: 0, errors: 0 },
    productOptions: { total: 0, fixed: 0, errors: 0 },
    grapes: { total: 0, fixed: 0, errors: 0 }
};

// Helper function to safely populate references
async function safePopulate(doc, populateConfig) {
    try {
        if (typeof populateConfig === 'string') {
            await doc.populate(populateConfig).execPopulate();
        } else {
            await doc.populate(populateConfig).execPopulate();
        }
        return true;
    } catch (error) {
        console.warn(`Population failed for ${doc._id}:`, error.message);
        return false;
    }
}

// Helper function to validate ObjectId references
function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

// Helper function to clean invalid references
function cleanInvalidReferences(doc, fieldName) {
    let cleaned = false;
    const field = doc[fieldName];
    
    if (Array.isArray(field)) {
        const originalLength = field.length;
        doc[fieldName] = field.filter(ref => {
            if (!ref) return false;
            const id = ref._id || ref;
            return isValidObjectId(id);
        });
        cleaned = doc[fieldName].length !== originalLength;
    } else if (field) {
        const id = field._id || field;
        if (!isValidObjectId(id)) {
            doc[fieldName] = null;
            cleaned = true;
        }
    }
    
    return cleaned;
}

async function fixProducts() {
    console.log('\n=== Fixing Product Relationships ===');
    
    try {
        const Product = keystone.list('Product').model;
        const products = await Product.find({});
        stats.products.total = products.length;
        
        console.log(`Found ${products.length} products to check`);
        
        for (let i = 0; i < products.length; i++) {
            const productData = products[i];
            let needsSave = false;
            
            try {
                const product = await Product.findById(productData._id);
                if (!product) continue;
                
                // Check and clean category reference
                if (cleanInvalidReferences(product, 'category')) {
                    console.log(`Fixed invalid category reference in product ${product._id}`);
                    needsSave = true;
                }
                
                // Check and clean subCategory reference
                if (cleanInvalidReferences(product, 'subCategory')) {
                    console.log(`Fixed invalid subCategory reference in product ${product._id}`);
                    needsSave = true;
                }
                
                // Check and clean brand reference
                if (cleanInvalidReferences(product, 'brand')) {
                    console.log(`Fixed invalid brand reference in product ${product._id}`);
                    needsSave = true;
                }
                
                // Check and clean grape reference
                if (cleanInvalidReferences(product, 'grape')) {
                    console.log(`Fixed invalid grape reference in product ${product._id}`);
                    needsSave = true;
                }
                
                // Check and clean priceOptions array
                if (cleanInvalidReferences(product, 'priceOptions')) {
                    console.log(`Fixed invalid priceOptions references in product ${product._id}`);
                    needsSave = true;
                }
                
                // Validate category relationship exists
                if (product.category) {
                    const ProductCategory = keystone.list('ProductCategory').model;
                    const categoryExists = await ProductCategory.findById(product.category);
                    if (!categoryExists) {
                        console.log(`Removing non-existent category ${product.category} from product ${product._id}`);
                        product.category = null;
                        needsSave = true;
                    }
                }
                
                // Validate subCategory relationship exists
                if (product.subCategory) {
                    const ProductSubCategory = keystone.list('ProductSubCategory').model;
                    const subCategoryExists = await ProductSubCategory.findById(product.subCategory);
                    if (!subCategoryExists) {
                        console.log(`Removing non-existent subCategory ${product.subCategory} from product ${product._id}`);
                        product.subCategory = null;
                        needsSave = true;
                    }
                }
                
                // Validate brand relationship exists
                if (product.brand) {
                    const ProductBrand = keystone.list('ProductBrand').model;
                    const brandExists = await ProductBrand.findById(product.brand);
                    if (!brandExists) {
                        console.log(`Removing non-existent brand ${product.brand} from product ${product._id}`);
                        product.brand = null;
                        needsSave = true;
                    }
                }
                
                // Validate grape relationship exists
                if (product.grape) {
                    const Grape = keystone.list('Grape').model;
                    const grapeExists = await Grape.findById(product.grape);
                    if (!grapeExists) {
                        console.log(`Removing non-existent grape ${product.grape} from product ${product._id}`);
                        product.grape = null;
                        needsSave = true;
                    }
                }
                
                if (needsSave) {
                    await product.save();
                    stats.products.fixed++;
                }
                
                // Progress indicator
                if ((i + 1) % 100 === 0 || i === products.length - 1) {
                    console.log(`Processed ${i + 1}/${products.length} products`);
                }
                
            } catch (error) {
                console.error(`Error processing product ${productData._id}:`, error.message);
                stats.products.errors++;
            }
        }
        
    } catch (error) {
        console.error('Error in fixProducts:', error);
    }
}

async function fixProductCategories() {
    console.log('\n=== Fixing Product Category Relationships ===');
    
    try {
        const ProductCategory = keystone.list('ProductCategory').model;
        const categories = await ProductCategory.find({});
        stats.categories.total = categories.length;
        
        console.log(`Found ${categories.length} categories to check`);
        
        for (let i = 0; i < categories.length; i++) {
            const categoryData = categories[i];
            let needsSave = false;
            
            try {
                const category = await ProductCategory.findById(categoryData._id);
                if (!category) continue;
                
                // Check and fix menu relationship if it exists
                if (category.menu && !isValidObjectId(category.menu)) {
                    console.log(`Fixed invalid menu reference in category ${category._id}`);
                    category.menu = null;
                    needsSave = true;
                }
                
                // Validate menu relationship exists if present
                if (category.menu) {
                    const MenuItem = keystone.list('MenuItem').model;
                    const menuExists = await MenuItem.findById(category.menu);
                    if (!menuExists) {
                        console.log(`Removing non-existent menu ${category.menu} from category ${category._id}`);
                        category.menu = null;
                        needsSave = true;
                    }
                }
                
                if (needsSave) {
                    await category.save();
                    stats.categories.fixed++;
                }
                
            } catch (error) {
                console.error(`Error processing category ${categoryData._id}:`, error.message);
                stats.categories.errors++;
            }
        }
        
    } catch (error) {
        console.error('Error in fixProductCategories:', error);
    }
}

async function fixProductPriceOptions() {
    console.log('\n=== Fixing Product Price Option Relationships ===');
    
    try {
        const ProductPriceOption = keystone.list('ProductPriceOption').model;
        const priceOptions = await ProductPriceOption.find({});
        stats.priceOptions.total = priceOptions.length;
        
        console.log(`Found ${priceOptions.length} price options to check`);
        
        for (let i = 0; i < priceOptions.length; i++) {
            const priceOptionData = priceOptions[i];
            let needsSave = false;
            
            try {
                const priceOption = await ProductPriceOption.findById(priceOptionData._id);
                if (!priceOption) continue;
                
                // Check and clean product reference
                if (cleanInvalidReferences(priceOption, 'product')) {
                    console.log(`Fixed invalid product reference in price option ${priceOption._id}`);
                    needsSave = true;
                }
                
                // Check and clean option reference
                if (cleanInvalidReferences(priceOption, 'option')) {
                    console.log(`Fixed invalid option reference in price option ${priceOption._id}`);
                    needsSave = true;
                }
                
                // Validate product relationship exists
                if (priceOption.product) {
                    const Product = keystone.list('Product').model;
                    const productExists = await Product.findById(priceOption.product);
                    if (!productExists) {
                        console.log(`Removing non-existent product ${priceOption.product} from price option ${priceOption._id}`);
                        priceOption.product = null;
                        needsSave = true;
                    }
                }
                
                // Validate option relationship exists
                if (priceOption.option) {
                    const ProductOption = keystone.list('ProductOption').model;
                    const optionExists = await ProductOption.findById(priceOption.option);
                    if (!optionExists) {
                        console.log(`Removing non-existent option ${priceOption.option} from price option ${priceOption._id}`);
                        priceOption.option = null;
                        needsSave = true;
                    }
                }
                
                if (needsSave) {
                    await priceOption.save();
                    stats.priceOptions.fixed++;
                }
                
            } catch (error) {
                console.error(`Error processing price option ${priceOptionData._id}:`, error.message);
                stats.priceOptions.errors++;
            }
        }
        
    } catch (error) {
        console.error('Error in fixProductPriceOptions:', error);
    }
}

async function fixGrapes() {
    console.log('\n=== Fixing Grape Relationships ===');
    
    try {
        const Grape = keystone.list('Grape').model;
        const grapes = await Grape.find({});
        stats.grapes.total = grapes.length;
        
        console.log(`Found ${grapes.length} grapes to check`);
        
        for (let i = 0; i < grapes.length; i++) {
            const grapeData = grapes[i];
            let needsSave = false;
            
            try {
                const grape = await Grape.findById(grapeData._id);
                if (!grape) continue;
                
                // Check and clean category reference
                if (cleanInvalidReferences(grape, 'category')) {
                    console.log(`Fixed invalid category reference in grape ${grape._id}`);
                    needsSave = true;
                }
                
                // Validate category relationship exists
                if (grape.category) {
                    const ProductCategory = keystone.list('ProductCategory').model;
                    const categoryExists = await ProductCategory.findById(grape.category);
                    if (!categoryExists) {
                        console.log(`Removing non-existent category ${grape.category} from grape ${grape._id}`);
                        grape.category = null;
                        needsSave = true;
                    }
                }
                
                if (needsSave) {
                    await grape.save();
                    stats.grapes.fixed++;
                }
                
            } catch (error) {
                console.error(`Error processing grape ${grapeData._id}:`, error.message);
                stats.grapes.errors++;
            }
        }
        
    } catch (error) {
        console.error('Error in fixGrapes:', error);
    }
}

async function fixProductOptions() {
    console.log('\n=== Fixing Product Option Relationships ===');
    
    try {
        const ProductOption = keystone.list('ProductOption').model;
        const options = await ProductOption.find({});
        stats.productOptions.total = options.length;
        
        console.log(`Found ${options.length} product options to check`);
        
        // Product options mainly have back-references, so we just validate they exist
        for (let i = 0; i < options.length; i++) {
            const optionData = options[i];
            
            try {
                const option = await ProductOption.findById(optionData._id);
                if (!option) continue;
                
                // Product options are mostly self-contained, just log their existence
                console.log(`Validated product option ${option._id}: ${option.quantity}`);
                
            } catch (error) {
                console.error(`Error processing product option ${optionData._id}:`, error.message);
                stats.productOptions.errors++;
            }
        }
        
    } catch (error) {
        console.error('Error in fixProductOptions:', error);
    }
}

async function validateVirtualPopulation() {
    console.log('\n=== Testing Virtual Population ===');
    
    try {
        // Test product population
        const Product = keystone.list('Product').model;
        const testProduct = await Product.findOne({});
        
        if (testProduct) {
            console.log('Testing product population...');
            
            // Test individual field population
            const populationTests = [
                'category',
                'subCategory', 
                'brand',
                'grape',
                'priceOptions'
            ];
            
            for (const field of populationTests) {
                try {
                    await testProduct.populate(field).execPopulate();
                    console.log(`✓ ${field} population successful`);
                } catch (error) {
                    console.log(`✗ ${field} population failed:`, error.message);
                }
            }
            
            // Test deep population
            try {
                await testProduct.populate('priceOptions.option').execPopulate();
                console.log('✓ Deep priceOptions.option population successful');
            } catch (error) {
                console.log('✗ Deep priceOptions.option population failed:', error.message);
            }
        }
        
    } catch (error) {
        console.error('Error in validateVirtualPopulation:', error);
    }
}

function printStatistics() {
    console.log('\n=== REPAIR STATISTICS ===');
    console.log('Products:');
    console.log(`  Total: ${stats.products.total}`);
    console.log(`  Fixed: ${stats.products.fixed}`);
    console.log(`  Errors: ${stats.products.errors}`);
    
    console.log('Categories:');
    console.log(`  Total: ${stats.categories.total}`);
    console.log(`  Fixed: ${stats.categories.fixed}`);
    console.log(`  Errors: ${stats.categories.errors}`);
    
    console.log('Price Options:');
    console.log(`  Total: ${stats.priceOptions.total}`);
    console.log(`  Fixed: ${stats.priceOptions.fixed}`);
    console.log(`  Errors: ${stats.priceOptions.errors}`);
    
    console.log('Product Options:');
    console.log(`  Total: ${stats.productOptions.total}`);
    console.log(`  Fixed: ${stats.productOptions.fixed}`);
    console.log(`  Errors: ${stats.productOptions.errors}`);
    
    console.log('Grapes:');
    console.log(`  Total: ${stats.grapes.total}`);
    console.log(`  Fixed: ${stats.grapes.fixed}`);
    console.log(`  Errors: ${stats.grapes.errors}`);
    
    const totalFixed = stats.products.fixed + stats.categories.fixed + 
                      stats.priceOptions.fixed + stats.productOptions.fixed + stats.grapes.fixed;
    const totalErrors = stats.products.errors + stats.categories.errors + 
                       stats.priceOptions.errors + stats.productOptions.errors + stats.grapes.errors;
    
    console.log(`\nOVERALL: ${totalFixed} items fixed, ${totalErrors} errors encountered`);
}

// Main execution
async function main() {
    console.log('=== Database Relationship Repair Script ===');
    console.log('Starting relationship validation and repair...\n');
    
    try {
        // Connect to database
        await new Promise((resolve, reject) => {
            keystone.start({
                onMount: resolve,
                onFailure: reject
            });
        });
        
        console.log('Connected to database successfully');
        
        // Run all repair functions
        await fixProducts();
        await fixProductCategories();
        await fixProductPriceOptions();
        await fixProductOptions();
        await fixGrapes();
        
        // Test virtual population after fixes
        await validateVirtualPopulation();
        
        // Print final statistics
        printStatistics();
        
        console.log('\n=== Repair Complete ===');
        
    } catch (error) {
        console.error('Fatal error:', error);
        process.exit(1);
    } finally {
        // Close database connection
        mongoose.connection.close();
        process.exit(0);
    }
}

// Handle script errors
process.on('unhandledRejection', (error) => {
    console.error('Unhandled rejection:', error);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught exception:', error);
    process.exit(1);
});

// Run the script
if (require.main === module) {
    main();
}

module.exports = { main, stats };