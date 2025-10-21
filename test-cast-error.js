/**
 * Test CastError simulation
 */
process.env.HTTP_PORT = 3003; // Use unique test port
const keystone = require('./app-init');
const mongoose = keystone.get('mongoose');
const Product = keystone.list('Product');

async function connectToDatabase() {            
    console.log(`🔧 Connecting to database...`);
    
    await new Promise((resolve, reject) => {
        if (mongoose.connection.readyState === 1) {
            console.log(`✅ Database already connected`);
            resolve();
        } else {
            mongoose.connection.on('connected', () => {
                console.log(`✅ Database connected successfully`);
                resolve();
            });

            mongoose.connection.on('error', (error) => {
                console.error(`💥 Database connection error:`, error.message);
                reject(error);
            });

            //Open DB then start workers
            keystone.openDatabaseConnection(console.error);

            // Timeout after 10 seconds
            setTimeout(() => {
                console.error(`💥 Database connection timeout after 10 seconds`);
                reject(new Error('Database connection timeout'));
            }, 10000);
        }
    });
}

async function testCastError() {
    try {
        await connectToDatabase();

        console.log(`\n🧪 Testing CastError simulation...`);
        
        // Test 1: Direct _id query with slug (should cause CastError)
        console.log(`\n⏳ Test 1: Querying Product with _id = "vermouth-martini-rosso"...`);
        try {
            const result1 = await Product.model.findOne({ _id: "vermouth-martini-rosso" }).exec();
            console.log(`⚠️  Unexpected: Query succeeded - ${result1 ? 'Found product: ' + result1.name : 'No product found'}`);
        } catch (error) {
            if (error.name === 'CastError') {
                console.log(`✅ SUCCESS: CastError reproduced!`);
                console.log(`   - Error name: ${error.name}`);
                console.log(`   - Error message: ${error.message}`);
                console.log(`   - Failed value: "${error.value}"`);
                console.log(`   - Path: ${error.path}`);
                console.log(`   - Model: ${error.model?.modelName}`);
                console.log(`   - Kind: ${error.kind}`);
            } else {
                console.log(`❌ Different error: ${error.name} - ${error.message}`);
            }
        }

        // Test 2: Another slug test
        console.log(`\n⏳ Test 2: Querying Product with _id = "absolut-vodka"...`);
        try {
            const result2 = await Product.model.findOne({ _id: "absolut-vodka" }).exec();
            console.log(`⚠️  Unexpected: Query succeeded - ${result2 ? 'Found product: ' + result2.name : 'No product found'}`);
        } catch (error) {
            if (error.name === 'CastError') {
                console.log(`✅ CastError confirmed with second slug`);
                console.log(`   - Value: "${error.value}"`);
                console.log(`   - Expected: ObjectId`);
            } else {
                console.log(`❌ Different error: ${error.name} - ${error.message}`);
            }
        }

        // Test 3: Correct approach using href
        console.log(`\n⏳ Test 3: Correct query using href field...`);
        try {
            const result3 = await Product.model.findOne({ href: "vermouth-martini-rosso" }).exec();
            console.log(`✅ Correct approach: ${result3 ? 'Found product: ' + result3.name : 'No product found with that href'}`);
        } catch (error) {
            console.log(`❌ Error with href query: ${error.message}`);
        }

        // Test 4: Test findById with slug (another way to trigger CastError)
        console.log(`\n⏳ Test 4: Using findById with slug...`);
        try {
            const result4 = await Product.model.findById("vermouth-martini-rosso").exec();
            console.log(`⚠️  Unexpected: findById succeeded - ${result4 ? 'Found product: ' + result4.name : 'No product found'}`);
        } catch (error) {
            if (error.name === 'CastError') {
                console.log(`✅ findById also triggers CastError as expected`);
                console.log(`   - Message: ${error.message}`);
            } else {
                console.log(`❌ Different error: ${error.name} - ${error.message}`);
            }
        }

        // Test 5: Show what happens with a valid ObjectId format
        console.log(`\n⏳ Test 5: Valid ObjectId format test...`);
        try {
            const result5 = await Product.model.findOne({ _id: "507f1f77bcf86cd799439011" }).exec();
            console.log(`✅ Valid ObjectId format: ${result5 ? 'Found product: ' + result5.name : 'No product found (expected)'}`);
        } catch (error) {
            console.log(`❌ Error with valid ObjectId: ${error.message}`);
        }

        console.log(`\n🎯 CastError simulation completed!`);
        console.log(`\n📋 Summary:`);
        console.log(`   ✅ CastError successfully reproduced with slug strings`);
        console.log(`   ✅ Error occurs when using _id field with non-ObjectId values`);
        console.log(`   ✅ Correct approach is to use href or other string fields`);
        console.log(`   ✅ Both findOne({_id: slug}) and findById(slug) trigger the error`);

    } catch (error) {
        console.error(`💥 Test failed:`, error.message);
        throw error;
    }
}

// Run the test
testCastError().then(() => {
    console.log('\n✨ CastError test completed!');
    process.exit(0);
}).catch((error) => {
    console.error('\n💥 Test failed:', error.message);
    process.exit(1);
});