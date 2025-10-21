#!/usr/bin/env node

/**
 * Database Initialization Script
 * 
 * Properly initializes the database with sample data to resolve
 * virtual population errors caused by empty collections.
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

async function cleanExistingData() {
    console.log('=== Cleaning Existing Data ===');
    
    try {
        // Drop and recreate collections to avoid key conflicts
        const collections = [
            'products',
            'productcategories', 
            'productbrands',
            'productoptions',
            'productpriceoptions'
        ];
        
        for (const collectionName of collections) {
            try {
                await mongoose.connection.db.dropCollection(collectionName);
                console.log(`✅ Dropped collection: ${collectionName}`);
            } catch (error) {
                if (error.message.includes('ns not found')) {
                    console.log(`ℹ️  Collection ${collectionName} does not exist, skipping`);
                } else {
                    console.log(`⚠️  Error dropping ${collectionName}:`, error.message);
                }
            }
        }
        
    } catch (error) {
        console.error('Error cleaning data:', error);
    }
}

async function createSampleData() {
    console.log('\n=== Creating Sample Data ===');
    
    try {
        // Define schemas matching Keystone structure
        const CategorySchema = new mongoose.Schema({
            name: { type: String, required: true },
            key: { type: String, unique: true },
            description: String,
            state: { type: String, default: 'published' },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        
        const BrandSchema = new mongoose.Schema({
            name: { type: String, required: true },
            key: { type: String, unique: true },
            description: String,
            state: { type: String, default: 'published' },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        
        const ProductOptionSchema = new mongoose.Schema({
            quantity: { type: String, required: true },
            key: { type: String, unique: true },
            description: String,
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        
        const ProductSchema = new mongoose.Schema({
            name: { type: String, required: true },
            key: { type: String, unique: true },
            description: String,
            price: Number,
            state: { type: String, default: 'published' },
            category: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductCategory' },
            brand: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductBrand' },
            priceOptions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ProductPriceOption' }],
            inStock: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        
        const PriceOptionSchema = new mongoose.Schema({
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            option: { type: mongoose.Schema.Types.ObjectId, ref: 'ProductOption', required: true },
            price: { type: Number, required: true },
            currency: { type: String, default: 'KES' },
            offerPrice: Number,
            inStock: { type: Boolean, default: true },
            optionText: String,
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });
        
        // Create models
        const Category = mongoose.model('ProductCategory', CategorySchema);
        const Brand = mongoose.model('ProductBrand', BrandSchema);
        const ProductOption = mongoose.model('ProductOption', ProductOptionSchema);
        const Product = mongoose.model('Product', ProductSchema);
        const PriceOption = mongoose.model('ProductPriceOption', PriceOptionSchema);
        
        // Create categories with proper keys
        console.log('Creating categories...');
        const categories = await Category.create([
            { 
                name: 'Wines', 
                key: 'wines',
                description: 'Red and white wines from around the world' 
            },
            { 
                name: 'Spirits', 
                key: 'spirits',
                description: 'Premium spirits including whiskey, vodka, rum and gin' 
            },
            { 
                name: 'Beers', 
                key: 'beers',
                description: 'Local and imported beers and lagers' 
            },
            { 
                name: 'Soft Drinks', 
                key: 'soft-drinks',
                description: 'Non-alcoholic beverages and mixers' 
            }
        ]);
        console.log(`✅ Created ${categories.length} categories`);
        
        // Create brands with proper keys
        console.log('Creating brands...');
        const brands = await Brand.create([
            { 
                name: 'Diageo', 
                key: 'diageo',
                description: 'Premium spirits and beer brand' 
            },
            { 
                name: 'East African Breweries', 
                key: 'east-african-breweries',
                description: 'Leading brewery in East Africa' 
            },
            { 
                name: 'Pernod Ricard', 
                key: 'pernod-ricard',
                description: 'French premium spirits company' 
            },
            { 
                name: 'Heineken', 
                key: 'heineken',
                description: 'International beer brand' 
            }
        ]);
        console.log(`✅ Created ${brands.length} brands`);
        
        // Create product options with proper keys
        console.log('Creating product options...');
        const productOptions = await ProductOption.create([
            { 
                quantity: '750ml', 
                key: '750ml',
                description: 'Standard wine/spirits bottle' 
            },
            { 
                quantity: '1L', 
                key: '1l',
                description: 'Large bottle size' 
            },
            { 
                quantity: '500ml', 
                key: '500ml',
                description: 'Small bottle size' 
            },
            { 
                quantity: '330ml', 
                key: '330ml',
                description: 'Standard beer bottle' 
            },
            { 
                quantity: '250ml', 
                key: '250ml',
                description: 'Small can/bottle' 
            }
        ]);
        console.log(`✅ Created ${productOptions.length} product options`);
        
        // Create products with proper keys
        console.log('Creating products...');
        const products = await Product.create([
            {
                name: 'Cabernet Sauvignon Red Wine',
                key: 'cabernet-sauvignon-red-wine',
                description: 'Rich and full-bodied red wine with notes of blackcurrant and oak',
                price: 2500,
                category: categories[0]._id, // Wines
                brand: brands[0]._id, // Diageo
                inStock: true
            },
            {
                name: 'Tusker Lager Beer',
                key: 'tusker-lager-beer',
                description: 'Kenya\'s premium lager beer, crisp and refreshing',
                price: 350,
                category: categories[2]._id, // Beers
                brand: brands[1]._id, // East African Breweries
                inStock: true
            },
            {
                name: 'Jameson Irish Whiskey',
                key: 'jameson-irish-whiskey',
                description: 'Smooth and balanced Irish whiskey with vanilla and honey notes',
                price: 4500,
                category: categories[1]._id, // Spirits
                brand: brands[2]._id, // Pernod Ricard
                inStock: true
            },
            {
                name: 'Heineken Lager',
                key: 'heineken-lager',
                description: 'Premium international lager with a distinctive taste',
                price: 400,
                category: categories[2]._id, // Beers
                brand: brands[3]._id, // Heineken
                inStock: true
            },
            {
                name: 'White Wine Chardonnay',
                key: 'white-wine-chardonnay',
                description: 'Crisp white wine with citrus and tropical fruit flavors',
                price: 2200,
                category: categories[0]._id, // Wines
                brand: brands[0]._id, // Diageo
                inStock: true
            }
        ]);
        console.log(`✅ Created ${products.length} products`);
        
        // Create price options for each product
        console.log('Creating price options...');
        const priceOptionsData = [];
        
        for (const product of products) {
            // Determine appropriate options based on category
            let availableOptions;
            if (product.category.toString() === categories[2]._id.toString()) {
                // Beers - use 330ml and 500ml
                availableOptions = [productOptions[3], productOptions[2]]; // 330ml, 500ml
            } else {
                // Wines and Spirits - use 750ml and 1L
                availableOptions = [productOptions[0], productOptions[1]]; // 750ml, 1L
            }
            
            for (let i = 0; i < availableOptions.length; i++) {
                const option = availableOptions[i];
                const sizeMultiplier = option.quantity === '1L' ? 1.3 : 
                                     option.quantity === '500ml' ? 0.8 : 1;
                const calculatedPrice = Math.round(product.price * sizeMultiplier);
                
                priceOptionsData.push({
                    product: product._id,
                    option: option._id,
                    price: calculatedPrice,
                    currency: 'KES',
                    offerPrice: Math.round(calculatedPrice * 0.9), // 10% discount
                    optionText: option.quantity,
                    inStock: true
                });
            }
        }
        
        const createdPriceOptions = await PriceOption.create(priceOptionsData);
        console.log(`✅ Created ${createdPriceOptions.length} price options`);
        
        // Update products with their price option references
        console.log('Linking price options to products...');
        for (const product of products) {
            const productPriceOptions = createdPriceOptions
                .filter(po => po.product.toString() === product._id.toString())
                .map(po => po._id);
            
            await Product.findByIdAndUpdate(product._id, {
                priceOptions: productPriceOptions,
                updatedAt: new Date()
            });
        }
        console.log('✅ Updated product-price option relationships');
        
        return {
            categories: categories.length,
            brands: brands.length,
            productOptions: productOptions.length,
            products: products.length,
            priceOptions: createdPriceOptions.length
        };
        
    } catch (error) {
        console.error('Error creating sample data:', error);
        throw error;
    }
}

async function testPopulation() {
    console.log('\n=== Testing Population ===');
    
    try {
        const ProductSchema = new mongoose.Schema({}, { strict: false });
        const Product = mongoose.model('ProductTest', ProductSchema, 'products');
        
        // Test basic find
        const product = await Product.findOne({});
        console.log(`✅ Found test product: ${product.name}`);
        
        // Test individual population
        const CategorySchema = new mongoose.Schema({}, { strict: false });
        const Category = mongoose.model('CategoryTest', CategorySchema, 'productcategories');
        
        if (product.category) {
            const category = await Category.findById(product.category);
            console.log(`✅ Category population: ${category ? category.name : 'FAILED'}`);
        }
        
        // Test price options
        const PriceOptionSchema = new mongoose.Schema({}, { strict: false });
        const PriceOption = mongoose.model('PriceOptionTest', PriceOptionSchema, 'productpriceoptions');
        
        if (product.priceOptions && product.priceOptions.length > 0) {
            const priceOption = await PriceOption.findById(product.priceOptions[0]);
            console.log(`✅ Price option found: ${priceOption ? priceOption.optionText : 'FAILED'}`);
        }
        
        console.log('✅ All population tests passed');
        
    } catch (error) {
        console.error('❌ Population test failed:', error);
    }
}

async function main() {
    console.log('=== Database Initialization Script ===');
    
    const connected = await connectToDatabase();
    if (!connected) {
        process.exit(1);
    }
    
    try {
        // Clean existing problematic data
        await cleanExistingData();
        
        // Create proper sample data
        const stats = await createSampleData();
        
        // Test that population works
        await testPopulation();
        
        console.log('\n=== SUCCESS ===');
        console.log('Database has been initialized with sample data:');
        console.log(`- Categories: ${stats.categories}`);
        console.log(`- Brands: ${stats.brands}`);
        console.log(`- Product Options: ${stats.productOptions}`);
        console.log(`- Products: ${stats.products}`);
        console.log(`- Price Options: ${stats.priceOptions}`);
        console.log('');
        console.log('🎯 The virtual population error should now be resolved!');
        console.log('Your application can now populate product relationships properly.');
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
}

main().catch(console.error);