var keystone = require('keystone');
var mongoose = require('mongoose');

var Product = keystone.list('Product');

var WorkProcessor = require('../helpers/WorkProcessor');
var self = module.exports = new WorkProcessor(getWork, doWork);

mongoose.connect('mongodb://localhost:27017/lexir', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: false,
});


const ProductMap = mongoose.model('Product', new mongoose.Schema({}, { strict: false }))

function getWork(next, done) {
    var filter = {
        modifiedDate: { $gt: new Date(self.worker.lastRun || '2020-01-01') }
    };

    Product.findPublished(filter)
        .exec(function (err, products) {            
            if(err)
                return console.error("Error reading products!", err || "Unknown");


            var mapping = products.filter(p => p.defaultOption).map(p => {
                var map = {
                    _id: p._id,
                    name: p.name, //:{ type: String, required: true },
                    url: p.href, //:{ type: String, required: true, unique: true },
                    image: p.image.secure_url, //:{ type: String },
                    price: p.defaultOption.price, //:{ type: Number, required: true },
                    quantity: p.defaultOption.quantity, //:{ type: String },
                    description: p.description, //:{ type: String },
                    discount: 0, //:{ type: Number, default: 0 },
                    imageName: p.image.public_id, //:{ type: String },
                    otherImages: p.altImages.map(a => a.secure_url), //[{ name: String }],
                    outlets: [], //[ { type: ObjectId, ref: 'Outlet' } ],
                    promoted: null, //:{ type: Boolean, default: false },
                    lastPromotion: null, //:{ type: Date },
                    promotions: [], /*[
                      {
                        date: null, //:{ type: Date },
                        amount: null, //:{ type: Number, required: true },
                        package: null, //:{ type: String }
                      }
                    ]*/
                    mainCategory: "Alcohol", //:{ type: String, required: true },
                    category: p.category && p.category.name || null, //:{ type: String, required: true },
                    subcategory: p.subCategory && p.subCategory.name || null, //:{ type: String },
                    specificCategory: null, //:{ type: String },
                    subcategories: [p.subCategory && p.subCategory.name].filter(x => x),
                    company: null, //:{ type: ObjectId, ref: 'Business', required: true },
                    listingName: null, //:{ type: String },
                    brand: null, //:{ type: String },
                    related: [],
                    variations: [],
                    features: [],
                    suspended: !p.inStock, //:{ type: Boolean, default: false },
                    keywords: p.keyWords,
                    user: null, //:{ type: ObjectId, ref: 'User', required: true },
                    verified: '', //:{ type: Boolean, default: false },
                    location: '', //:{ type: String, default: '' },
                    county: p.countryOfOrigin, //:{ type: String, default: '' },
                    created_at: Date.now, //:{ type: Date, default: Date.now },
                    isProduct: true, //:{ type: Boolean, default: true },
                    color: null, //:{ type: String },
                    weight: '', //:{ type: String },
                    model_number: '', //:{ type: String, default: '' },
                    label: [],
                    warranty: 'Not applicable', //:{ type: String, default: 'Not applicable' },
                    tags: [],
                    nameChunk: [],
                    inMarket: null, //:{ type: Boolean, default: true },
                    inStock: p.inStock, //:{ type: Boolean, default: true },
                    published: true, //:{ type: Boolean, default: true },
                    onOffer: p.onOffer, //:{ type: Boolean, default: false },
                    featured: p.isGiftPack, //:{ type: Boolean, default: false },
                    customTags: [],
                    reviews: p.averageRatings, //:{ type: Number, default: 1, min: 1 }
                };

                return map;
            })


            if(mapping.length)
                console.log("ETLing " + mapping.length + " products " + filter.modifiedDate.$gt.toISOString());

            next(null, mapping, done);
        });
}

function doWork(err, products, next) {
    if (err)
        return console.warn(err);

    return new Promise((resolve) => {
        (function saveNext(){
            var p = products.pop();
            if(!p) return resolve();

            var map = new ProductMap(p);            
            map.save(saveNext);
        })();
    }).then(next);
}