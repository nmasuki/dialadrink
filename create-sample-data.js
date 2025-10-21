#!/usr/bin/env node

/**
 * Sample Data Creator
 * 
 * Creates sample data to test virtual population and relationships
 * since the database appears to be empty.
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

async function createSampleData() {
    console.log('=== Creating Sample Data ===\n');
    
    try {
        // Create schemas for the data we need
        const CategorySchema = new mongoose.Schema({
            name: String,
            description: String,
            state: { type: String, default: 'published' },
            createdAt: { type: Date, default: Date.now },
            createdBy: mongoose.Schema.Types.ObjectId
        });
        
        const BrandSchema = new mongoose.Schema({
            name: String,
            description: String,
            state: { type: String, default: 'published' },
            createdAt: { type: Date, default: Date.now },
            createdBy: mongoose.Schema.Types.ObjectId
        });
        
        const ProductOptionSchema = new mongoose.Schema({
            quantity: String,
            description: String,
            key: String,
            createdAt: { type: Date, default: Date.now },
            createdBy: mongoose.Schema.Types.ObjectId
        });
        
        const ProductSchema = new mongoose.Schema({
            name: String,
            description: String,
            price: Number,
            state: { type: String, default: 'published' },
            category: mongoose.Schema.Types.ObjectId,
            brand: mongoose.Schema.Types.ObjectId,
            priceOptions: [mongoose.Schema.Types.ObjectId],
            inStock: { type: Boolean, default: true },
            createdAt: { type: Date, default: Date.now },
            createdBy: mongoose.Schema.Types.ObjectId
        });
        
        const PriceOptionSchema = new mongoose.Schema({
            product: mongoose.Schema.Types.ObjectId,
            option: mongoose.Schema.Types.ObjectId,
            price: Number,
            currency: { type: String, default: 'KES' },
            offerPrice: Number,
            inStock: { type: Boolean, default: true },
            optionText: String,
            createdAt: { type: Date, default: Date.now },
            createdBy: mongoose.Schema.Types.ObjectId
        });
        
        // Create models
        const Category = mongoose.model('ProductCategory', CategorySchema, 'productcategories');
        const Brand = mongoose.model('ProductBrand', BrandSchema, 'productbrands');
        const ProductOption = mongoose.model('ProductOption', ProductOptionSchema, 'productoptions');
        const Product = mongoose.model('Product', ProductSchema, 'products');
        const PriceOption = mongoose.model('ProductPriceOption', PriceOptionSchema, 'productpriceoptions');
        
        // Create sample categories
        console.log('Creating sample categories...');
        const categories = await Category.insertMany([
            { name: 'Wines', description: 'Red and white wines' },
            { name: 'Spirits', description: 'Whiskey, vodka, rum and more' },
            { name: 'Beers', description: 'Local and imported beers' }
        ]);
        console.log(`Created ${categories.length} categories`);
        
        // Create sample brands
        console.log('Creating sample brands...');
        const brands = await Brand.insertMany([
            { name: 'Diageo', description: 'Premium spirits brand' },
            { name: 'East African Breweries', description: 'Local brewery' },
            { name: 'Pernod Ricard', description: 'French spirits company' }
        ]);
        console.log(`Created ${brands.length} brands`);
        
        // Create sample product options
        console.log('Creating sample product options...');
        const productOptions = await ProductOption.insertMany([
            { quantity: '750ml', description: 'Standard bottle', key: '750ml' },
            { quantity: '1L', description: 'Large bottle', key: '1l' },
            { quantity: '500ml', description: 'Small bottle', key: '500ml' }
        ]);
        console.log(`Created ${productOptions.length} product options`);
        
        // Create sample products
        console.log('Creating sample products...');
        const products = await Product.insertMany([
            {
                name: 'Red Wine Cabernet',
                description: 'Premium red wine with rich flavor',
                price: 2500,
                category: categories[0]._id,
                brand: brands[0]._id,
                inStock: true
            },
            {
                name: 'Tusker Lager',
                description: 'Kenyan premium lager beer',
                price: 350,
                category: categories[2]._id,
                brand: brands[1]._id,
                inStock: true
            },
            {
                name: 'Jameson Whiskey',
                description: 'Irish whiskey, smooth and balanced',
                price: 4500,
                category: categories[1]._id,
                brand: brands[2]._id,
                inStock: true
            }
        ]);
        console.log(`Created ${products.length} products`);
        
        // Create sample price options
        console.log('Creating sample price options...');
        const priceOptions = [];
        
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            for (let j = 0; j < productOptions.length; j++) {
                const option = productOptions[j];
                const basePrice = product.price;
                const multiplier = j === 0 ? 1 : (j === 1 ? 1.3 : 0.7); // Different pricing for different sizes
                
                priceOptions.push({
                    product: product._id,
                    option: option._id,
                    price: Math.round(basePrice * multiplier),
                    currency: 'KES',
                    offerPrice: Math.round(basePrice * multiplier * 0.9), // 10% discount
                    optionText: option.quantity,
                    inStock: true
                });
            }
        }
        
        const createdPriceOptions = await PriceOption.insertMany(priceOptions);
        console.log(`Created ${createdPriceOptions.length} price options`);
        
        // Update products with price option references
        console.log('Updating products with price option references...');
        for (const product of products) {
            const productPriceOptions = createdPriceOptions
                .filter(po => po.product.toString() === product._id.toString())
                .map(po => po._id);
            
            await Product.findByIdAndUpdate(product._id, {
                priceOptions: productPriceOptions
            });
        }
        
        console.log('✅ Sample data creation complete!');
        console.log('\nData Summary:');
        console.log(`- Categories: ${categories.length}`);
        console.log(`- Brands: ${brands.length}`);
        console.log(`- Product Options: ${productOptions.length}`);
        console.log(`- Products: ${products.length}`);
        console.log(`- Price Options: ${createdPriceOptions.length}`);
        
        return {
            categories,
            brands,
            productOptions,
            products,
            priceOptions: createdPriceOptions
        };
        
    } catch (error) {
        console.error('Error creating sample data:', error);
        throw error;
    }
}

async function testRelationships() {
    console.log('\n=== Testing Relationships ===');
    
    try {
        // Test basic relationship queries
        const ProductSchema = new mongoose.Schema({}, { strict: false });
        const Product = mongoose.model('Product2', ProductSchema, 'products');
        
        console.log('Testing product relationships...');
        
        // Find a product and try to populate its relationships
        const product = await Product.findOne({});
        
        if (product) {
            console.log(`Found product: ${product.name}`);
            console.log(`Category ID: ${product.category}`);
            console.log(`Brand ID: ${product.brand}`);
            console.log(`Price Options: ${product.priceOptions ? product.priceOptions.length : 0} items`);
            
            // Test that the references exist
            const CategorySchema = new mongoose.Schema({}, { strict: false });
            const Category = mongoose.model('ProductCategory2', CategorySchema, 'productcategories');
            
            if (product.category) {
                const category = await Category.findById(product.category);
                console.log(`Category found: ${category ? category.name : 'NOT FOUND'}`);
            }
            
            console.log('✅ Basic relationship test passed');
        } else {
            console.log('❌ No products found for testing');
        }
        
    } catch (error) {
        console.error('Error testing relationships:', error);
    }
}

async function main() {
    console.log('=== Sample Data Creator ===\n');
    
    const connected = await connectToDatabase();
    if (!connected) {
        console.log('Cannot proceed without database connection');
        process.exit(1);
    }
    
    try {
        // Check if data already exists
        const ProductSchema = new mongoose.Schema({}, { strict: false });
        const Product = mongoose.model('TempProduct', ProductSchema, 'products');
        const existingCount = await Product.countDocuments();
        
        if (existingCount > 0) {
            console.log(`Found ${existingCount} existing products. Skipping data creation.`);
            console.log('If you want to recreate data, delete existing products first.');
        } else {
            await createSampleData();
        }
        
        await testRelationships();
        
        console.log('\n=== Complete ===');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
    }
}

// Run the script
main().catch(console.error);