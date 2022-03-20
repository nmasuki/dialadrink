var keystone = require('keystone');
var extractor = require("keyword-extractor");
var cloudinary = require('cloudinary');
var Types = keystone.Field.Types;

var Product = new keystone.List('Product', {
    map: { name: 'name' },
    autokey: { from: 'name', path: 'key' },
});

Product.add({
    href: {
        type: String,
        initial: true,
        required: true
    },
    name: {
        type: String,
        initial: true
    },

    alcoholContent: {
        type: Number
    },
    
    countryOfOrigin: {
        type: String
    },

    howToOpen: {
        type: String
    },

    priceOptions: {
        type: Types.Relationship,
        ref: 'ProductPriceOption',
        label: "Prices",
        many: true,
        noedit: true,
    },

    onOffer: { type: Types.Boolean },
    isPopular: { type: Types.Boolean },
    isBrandFocus: { type: Types.Boolean },
    inStock: { type: Types.Boolean  },
    isGiftPack: { type: Types.Boolean  }, 
    
    reorderLevel: {
        type: Types.Number, default: 10
    },

    state: {
        type: Types.Select,
        options: 'draft, published, archived',
        default: 'draft',
        index: true
    },
    image: {
        type: Types.CloudinaryImage,
        folder: "products"
    },
    altImages: {
        type: Types.CloudinaryImages,
        folder: "products"
    },
    youtubeUrl: {
        type: String
    },

    pageTitle: {
        type: String
    },

    tags: {
        type: Types.TextArray
    },

    description: {
        type: Types.Html,
        wysiwyg: true,
        height: 150
    },

    publishedDate: {
        type: Date,
        default: Date.now
    },
    modifiedDate: {
        type: Date,
        default: Date.now
    },

    popularity: {
        type: Number,
        //noedit: true
    },

    category: {
        type: Types.Relationship,
        ref: 'ProductCategory'
    },
    subCategory: {
        type: Types.Relationship,
        ref: 'ProductSubCategory',
        filters: {
            product: ':category'
        }
    },

    brand: {
        type: Types.Relationship,
        ref: 'ProductBrand'
    },

    ratings: {
        type: Types.Relationship,
        ref: 'ProductRating',
        many: true,
        hidden: true
    },

    relatedProducts: {
        type: Types.Relationship,
        ref: 'Product',
        many: true,
        hidden: true
    },
});

Product.schema.virtual("keyWords").get(function () {
    var tags = this.tags || [];

    if (this.brand) {
        tags.push(this.brand.name);
        if (this.brand.company && this.brand.company.name)
            tags.push((this.brand.company.name || "").toProperCase(true));
    }
    if (this.category)
        tags.push(this.category.name);
    if (this.subCategory)
        tags.push(this.subCategory.name);
    if (this.options)
        this.options.forEach(po => tags.push(po.quantity));

    var sentence = (tags.concat([this.name, this.pageTitle, this.description]))
        .join(", ").replace(/(&nbsp;?)/g, " ")
        .replace(/\W/g, x => x.trim())
        .truncate(500);

    var keyWords = extractor.extract(sentence, {
        language: "english",
        remove_digits: true,
        return_changed_case: false,
        remove_duplicates: true
    });

    return keyWords.filter(s => s && s.length > 2);
});

Product.schema.virtual('stockOptions').get(function(){
    var options = this.options.filter(op => op.inStock);

    if(options.length <= 0)
        options = this.options.splice(0, 1);

    return options;
});

Product.schema.virtual('options').get(function () {
    var product = this;
    if(this.priceOptions.every(p => p.inStock != product.inStock))
        this.priceOptions.forEach(p => p.inStock = product.inStock);

    return this.priceOptions.map(op => ({
        _id: op._id,
        quantity: (op.option || {}).quantity,
        currency: (op.currency || "KES").toUpperCase().replace('KSH', "KES"),
        offerPrice: op.offerPrice || 0,
        price: op.price || 0,
        inStock: op.inStock
    })).distinctBy(op => op.quantity);
});

Product.schema.virtual('defaultOption').get(function () {
    return this.stockOptions.orderBy(o => o.price).last();
});

Product.schema.virtual('averageRatings').get(function () {
    if (this.ratings && this.ratings.length)
        return Math.round((this.ratings || []).avg(r => r.rating));
    else if (this.onOffer)
        return 4.5;
    else if (this.category && this.category.name) { 
        //Developers own ratings
        if (this.category.name.toLowerCase().contains("whisky"))
            return 4.6;
        else if (this.category.name.toLowerCase().contains("beer"))
            return 4.2;
        else if (this.category.name.toLowerCase().contains("wine"))
            return 4.3;
        else if (this.category.name.toLowerCase().contains("vodka"))
            return 4.4;
    }
    //Pic a random value
    return Math.round(1 + Math.random() * 4.0);
});

Product.schema.virtual("ratingCount").get(function () {
    if (this.ratings && this.ratings.length)
        return 5 + this.ratings.length;
    return 5;
});

Product.schema.virtual('quantity').get(function () {
    var defaultOption = this.defaultOption || this.priceOptions.first() || {};
    return defaultOption ? defaultOption.quantity : null;
});

Product.schema.virtual('currency').get(function () {
    var defaultOption = this.defaultOption || this.priceOptions.first() || {};
    return (defaultOption ? defaultOption.currency || "KES" : "KES").replace('Ksh', "KES");
});

Product.schema.virtual('price').get(function () {
    var defaultOption = this.defaultOption || this.priceOptions.first() || {};
    return defaultOption ? defaultOption.price : null;
});

Product.schema.virtual('offerPrice').get(function () {
    var defaultOption = this.defaultOption || this.priceOptions.first() || {};
    return defaultOption && defaultOption.offerPrice > 0? defaultOption.offerPrice : null;
});

Product.schema.virtual('percentOffer').get(function () {
    var defaultOption = this.defaultOption || this.priceOptions.first() || {};
    if (defaultOption && !!defaultOption.offerPrice && defaultOption.price > defaultOption.offerPrice) {
        var discount = defaultOption.price - defaultOption.offerPrice;
        var percent = Math.round(100 * discount / defaultOption.price);
        return percent || null;
    }

    return null;
});

Product.schema.virtual('priceValidUntil').get(function () {
    var today = new Date();

    var firstStr = today.toISOString().substr(0, 8) + "01";
    var expiryStr = new Date(firstStr).addMonths(1).addSeconds(-1).toISOString();

    if (expiryStr.startsWith("01")) 
        expiryStr = expiryStr.replace(/^01/, "20");
    
    return expiryStr;
});

Product.schema.virtual('popularityRatio').get(function () {
    var max = 1.0, min = 0.75;
    var ratio = this.hitsPerWeek / topHitsPerWeek;

    if (ratio)
        return parseFloat((min + (max - min) * ratio).toFixed(5));

    return min;
});

Product.schema.virtual('hitsPerWeek').get(function () {
    var weeks = (new Date().getTime() - this.modifiedDate.getTime()) / 604800000.0;

    if (weeks <= 1)
        return topHitsPerWeek;

    weeks = (new Date().getTime() - this.publishedDate.getTime()) / 604800000.0;
    return this.popularity / weeks;
});

Product.schema.methods.findSimilar = function (callback) {
    var filter = {
        _id: { "$ne": this._id },
        "$or": []
    };

    if (this.brand)
        filter.$or.push({
            brand: this.brand._id || this.brand
        });
    if (this.subCategory)
        filter.$or.push({
            subCategory: this.subCategory._id || this.subCategory
        });
    if (this.category)
        filter.$or.push({
            category: this.category._id || this.category
        });

    var product = this;
    return Product.findPublished(filter).exec((err, similar) => {
        similar = (similar || []).orderBy(p => Math.abs(p.popularity - product.popularity));
        
        if (typeof callback == "function")
            callback(err, similar);

        return similar;
    });
};

Product.schema.methods.findRelated = function (callback) {
    return Product.findRelated([this.id || this._id], callback);
};

var saveDebounce = function(){ return this.save(); }.debounce();
Product.schema.methods.addPopularity = function (factor) {
    this.popularity = (this.popularity || 0) + (factor || 1);
    saveDebounce.apply(this);
};

Product.schema.methods.toAppObject = function () {
    var d = this;

    var cloudinaryOptions = {
        secure: true,
        fetch_format: "auto",
        transformation: [{ background: "white" },
            {
                width: 250,
                height: 250,
                crop: "fill"
            }
        ]
    };
    
    var cloudinarySmallImageOptions = {
        secure: true,
        fetch_format: "auto",
        transformation: [{ background: "white" },
            {
                width: 24,
                height: 24,
                crop: "fill"
            }
        ]
    };

    var obj = Object.assign({}, this.toObject(), {
        id: d.id,
        _id: d.id,
        _rev: d.__v,

        url: [keystone.get('url'), d.href].map(p => p.trim('/')).join('/'),
        
        imageFullSize: d.image.secure_url,
        imagesFullSize: d.altImages ? d.altImages.map(a => a && a.secure_url) : [],
        
        imageSmallSize: cloudinary.url(d.image.public_id, cloudinarySmallImageOptions),
        imagesSmallSize: d.altImages ? d.altImages.map(a => cloudinary.url(a.public_id, cloudinarySmallImageOptions)): [],
        
        image: cloudinary.url(d.image.public_id, cloudinaryOptions),
        images: d.altImages ? d.altImages.map(a => a && a.secure_url || cloudinary.url(a.public_id, cloudinaryOptions)) : [],
        
        category: d.category ? d.category.name : null,
        categories: d.onOffer ? (d.category ? [d.category.name, "offer"] : ["offer"]) : d.category ? [d.category.name] : [],
        
        company: d.brand && d.brand.company ? d.brand.company.name : null,
        subcategory: d.subCategory ? d.subCategory.name : null,
        brand: d.brand ? d.brand.name : null,

        ratings: d.averageRatings,
        ratingCount: d.ratingCount,

        inStock: !!d.inStock,
        hitsPerWeek: d.hitsPerWeek,

        remainingStock: 10,
        reorderLevel: d.reorderLevel,
        
        //Use cheapest option for price
        price: d.price || 0,
        offerPrice: d.offerPrice || 0,

        isFeatured: d.onOffer,
        onOffer: (d.offerPrice || 0) > 0 && d.offerPrice < d.price,

        quantity: d.quantity,        
        currency: d.currency,
    });

    ["__v", 'options', 'defaultOption', 'categories', 'priceOptions', 'subCategory', 'altImages', 'href'].forEach(i => {
        delete obj[i];
    });

    return obj;
};

Product.defaultColumns = 'name, image, brand, category, state, onOffer';

keystone.deepPopulate(Product.schema);
Product.schema.pre('save', function (next) {
    var product = this;
    if(this.priceOptions.every(p => p.inStock != product.inStock))
        this.priceOptions.forEach(p => p.inStock = product.inStock);

    this.modifiedDate = new Date();
    var defaultOption = this.defaultOption || this.priceOptions.first();

    if (this.alcoholContent) {
        if (this.alcoholContent > 100)
            this.alcoholContent = 100;
        else if (this.alcoholContent < 0)
            this.alcoholContent = 0.00;
    }

    if (defaultOption) {
        this.price = defaultOption.price;
        this.offerPrice = defaultOption.offerPrice;
        this.quantity = defaultOption.quantity;
    }

    if (this.youtubeUrl)
        this.youtubeUrl = this.youtubeUrl.replace(/\/watch(\/|\?v=)/, "/embed/");

    function defaultTags() {
        var tags = [];

        if (this.brand) {
            tags.push(this.brand.name);
            if (this.brand.company && this.brand.company.name)
                tags.push((this.brand.company.name || "").toProperCase(true));
        }
        if (this.category)
            tags.push(this.category.name);
        if (this.subCategory)
            tags.push(this.subCategory.name);
        if (this.options)
            this.options.forEach(po => tags.push(po.quantity));

        return tags.filter(t => !!t);
    }

    if (!this.tags || !this.tags.length)
        this.tags = defaultTags.call(this);

    var longTagLength = 50;
    var longTags = this.tags.filter(t => t && t.length > longTagLength && t.contains(" "));

    if (longTags.length){
        this.tags = this.tags.filter(t => t && t.length <= longTagLength || !t.contains(" "));
        var sentence = longTags.distinct()
            .join(", ").replace(/(&nbsp;?)/g, " ")
            .replace(/\W/g, function (x) { return (x.trim() + " "); })
            .truncate(500);

        var keyWords = extractor.extract(sentence, {
            language: "english",
            remove_digits: true,
            return_changed_case: false,
            remove_duplicates: true
        });

        this.tags = this.tags.concat(keyWords.filter(s => s && s.length > 2));
    }

    if (this.tags.some(t => t == "Whisky") && !this.tags.some(t => t == "Whiskey"))
        this.tags.push("Whiskey");

    if (this.tags.some(t => t == "Whiskey") && !this.tags.some(t => t == "Whisky"))
        this.tags.push("Whisky");

    var keyWordMap = {
        "alcohol": "",
        "content": "",
        "kenya": "",
        "extras": "",
        "delivery": "",
        "free": "",
        "nairobi": "",
        "price": "",
        "best price": "",
        "drostdhof": "",
        "drink": "",
        "dial a drink":"",
        "buy": "",
        "price in kenya": ""
    };

    this.tags = this.tags.filter(t => t).map(t => keyWordMap[t.trim().toLowerCase()] == undefined ? t : keyWordMap[t.trim().toLowerCase()]);
    this.tags = this.tags.map(t => t.replace("  ", " ").replace('`', "'").replace(/(\d+(.\d+)?)\s+(m?l)/i, "$1$3").replace("Litre", "litre"));
    this.tags = this.tags.distinctBy(t => t.toLowerCase().trim()).orderBy();

    var p = this;
    this.tags.orderByDescending(t => t.length).forEach(t => {
        p.tags = p.tags.filter(pt => {
            if(!pt) return false;
            pt = pt.trim().toLowerCase();
            t = t.toLowerCase();
            return pt == t || !t.contains(pt);
        });
    });

    next();
});

Product.schema.set('toObject', {
    transform: function (doc, ret, options) {
        
        var whitelist = [
            'href', 'name', 'priceOptions', 'onOffer', 'inStock',
            'state', 'image', 'altImages', 'pageTitle', 'description',
            'publishedDate', 'modifiedDate', 'popularity', 'category',
            'subCategory', 'brand', 'ratings', 'popularityRatio', 'options', 'defaultOption',
            'quantity', 'currency', 'price', 'offerPrice',
            'averageRatings', 'ratingCount', 'tags',
            'priceValidUntil', 'percentOffer'
        ];

        whitelist.forEach(i => ret[i] = doc[i]);
        return ret;
    }
});

Product.schema.set('toJSON', {
    transform: function (doc, ret, options) {
        return doc.toObject();
    }
});

Product.register();

Product.findRelated = function (products, callback) {    
    //Get Cart Items
    var productIds = Array.isArray(products)
        ? products.map(p => (p.id || p._id || p || "").toString())
        : [(products.id || products._id || products || "").toString()];

    return new Promise((resolve, reject) => {
        keystone.list("CartItem").model.find({ product: { $in: productIds } })
            .exec((err, cartItems) => {
                if(err || !cartItems)
                    return console.warn("No related cartItems found!");

                var cartIds = cartItems.map(c => c._id);
                return keystone.list("Order").model.find({ cart: { $in: cartIds } })
                    .deepPopulate("cart.product.category,cart.product.relatedProducts")
                    .exec((err, orders) => {
                        if (err)
                            return console.log(err, orders);

                        var productCounts = {};
                        var categoryCounts = {};
                        var products = [];

                        orders.forEach(order => {
                            order.cart.forEach(item => {
                                if (!item || !item.product) return;
                                function incrementCounts(p) {
                                    var id = (p._id || p).toString();
                                    var catId = ((p.category && p.category._id || p.category) || "").toString();

                                    if (catId)
                                        categoryCounts[catId] = (categoryCounts[catId] = categoryCounts[catId] || 0) + 1;

                                    if (!productIds.contains(id))
                                        productCounts[id] = (productCounts[id] = productCounts[id] || 0) + 1;
                                    else
                                        products.push(p);
                                }

                                incrementCounts(item.product);
                                if (item.product.relatedProducts)
                                    item.product.relatedProducts.forEach(incrementCounts);
                            });
                        });

                        var relatedProdIds = Object.keys(productCounts);

                        //Get products that where ordered together
                        return Product.findPublished({ _id: { $in: relatedProdIds } })
                            .exec((err, related) => {
                                if (err) {
                                    if (typeof callback == "function")
                                        return callback(err, related);
                                    return;
                                }

                                related = related.orderByDescending(p => p.hitsPerWeek)
                                    .orderByDescending(p => {
                                        var id = (p._id || p).toString();
                                        var catId = ((p.category && p.category._id || p.category) || "").toString();

                                        var score = productCounts[id] + (categoryCounts[catId] || 0) * 0.2;
                                        var extraTags = ["extras", "extra", "soft-drinks", "cigars-and-ciggarrettes", "other", "others"];

                                        if (products.some(product => product.category && p.category && product.category.key == p.category.key))
                                            score *= 0.3;
                                        else if ((p.category && extraTags.some(t => p.category.key == t)) || (p.tags || []).some(t => extraTags.contains(t.toLowerCase())))
                                            score *= 2.75;

                                        return score;
                                    });

                                if (typeof callback == "function")
                                    callback(null, related);

                                return resolve(related);
                            });
                    });
            });
    })
};

Product.offerAndPopular = function(size, callback){
    size = size || 8;
    Product.findPublished({inStock: true, onOffer: true})
        .exec(function(err, offers){
            if (err || !offers)
                return callback(err);

            Product.findPublished({inStock: true, isBrandFocus: true, onOffer: false})
                .exec((err, brandFocus) => {
                    if (err)
                        return callback(err);

                    Product.findPublished({inStock: true})
                        .exec((err, popular) => {
                            if (err || !offers)
                                return callback(err);
                            
                            if(brandFocus.length == 0)
                                brandFocus = popular.filter(p => !p.isPopular).slice(0, 3);

                            var excludePopular =  offers.concat(brandFocus);

                            popular = popular.filter(p => !excludePopular.any(x => x.id == p.id));
                            var explicitPopular = popular.filter(p => p.isPopular);
                            var ratingPopular = popular.filter(p => !p.isPopular)
        
                            console.log(`Popular: ${popular.length}, Offers: ${offers.length}, BrandFocus: ${brandFocus.length}..`);

                            var data = { 
                                popular: explicitPopular.concat(ratingPopular).slice(0, size), 
                                offers: offers.slice(0, size),
                                brandFocus: brandFocus.slice(0, size),
                            };

                            data.products = data.popular.concat(data.offers).concat(data.brandFocus);        
                            callback(err, data);
                        });
                });
        });

};

Product.findPublished = function (filter, callback) {
    filter = Object.assign(filter || {}, { state: 'published'  });
    var a = Product.model.find(filter)
        .sort({ isPopular: 1, popularity: -1 })
        .populate('brand')
        .populate('category')
        .populate('ratings')
        .deepPopulate("subCategory.category,priceOptions.option");

    if (typeof callback == "function")
        a.exec(callback);

    return a;
};

Product.findOnePublished = function (filter, callback) {
    filter = Object.assign({ state: 'published' }, filter || {});
    var a = keystone.list('Product').model.findOne(filter)
        .sort({ popularity: -1 })
        .populate('brand')
        .populate('category')
        .populate('ratings')
        .deepPopulate("subCategory.category,priceOptions.option");

    if (typeof callback == "function")
        a.exec(callback);

    return a;
};

Product.findByBrand = function (filter, callback) {
    keystone.list('ProductBrand').model.find(filter)
        .exec((err, brands) => {
            if (err || !brands)
                return console.log(err);

            filter = {
                brand: {
                    "$in": brands.map(b => b._id)
                }
            };
            Product.findPublished(filter, callback);
        });
};

Product.findByCategory = function (filter, callback) {
    keystone.list('ProductCategory').model.find(filter)
        .exec((err, categories) => {
            if (err || !categories)
                return console.log(err);

            filter = {
                category: {
                    "$in": categories.map(b => b._id)
                }
            };
            
            Product.findPublished(filter, callback);
        });
};

Product.findBySubCategory = function (filter, callback) {
    keystone.list('ProductSubCategory').model.find(filter)
        .exec((err, subCategories) => {
            if (err || !subCategories)
                return console.log(err);

            filter = {
                subCategory: {
                    "$in": subCategories.map(b => b._id)
                }
            };
            Product.findPublished(filter, callback);
        });
};

Product.findByOption = function (filter, callback) {
    keystone.list('ProductOption').model.find(filter)
        .exec((err, options) => {
            if (err || !options)
                return console.log(err);

            filter = {
                option: {
                    "$in": options.map(b => b._id)
                }
            };

            keystone.list('ProductPriceOption').model.find(filter)
                .exec((err, options) => {
                    if (err || !options)
                        return console.log(err, options);

                    filter = {
                        priceOptions: {
                            "$in": options.map(b => b._id)
                        }
                    };
                    Product.findPublished(filter, callback);
                });

        });
};

Product.search = function (query, next, deepSearch) {
    var filters = query;
    if(typeof query == "string"){
        var nameStr = query.trim().toLowerCase().replace(/\-/g, " ").escapeRegExp().replace(/\s+/g, "\\W*");
        var keyStr = query.cleanId().trim().escapeRegExp();

        var nameRegex = new RegExp("(^|\\W)(" + nameStr + ")", "i");
        var keyRegex = new RegExp("(^|\\W)(" + keyStr + ")", "i");

        // Set filters
        filters = {
            "$or": [
                { 'category.key': new RegExp(keyStr + "$", "i") },
                { key: keyRegex },
                { href: keyRegex },
                { href: nameRegex },
                { tags: keyRegex },
                { tags: nameRegex },
                { name: nameRegex },
                { name: keyRegex },
                { quantity: nameRegex },
                { quantity: keyRegex },
                { countryOfOrigin: nameRegex},
                {
                    $or: [
                        { 'company.name': keyRegex },
                        { 'company.name': nameRegex }
                    ]
                }
            ]
        };
    }

    var allProducts = [];
    //Searching by brand then category then product
    return Product.findPublished({ $or:[{href: new RegExp("^" + keyStr + "$", "i") }, {_id: query.trim()}]}, function (err, products) {
        if (deepSearch || err || !products || !products.length) {
            if (products && products.length) allProducts = allProducts.concat(products);
            return Product.findPublished(filters, function (err, products) {
                if (deepSearch || err || !products || !products.length) {
                    if (products && products.length) allProducts = allProducts.concat(products);
                    return Product.findByCategory({ key: keyRegex }, function (err, products) {
                        if (deepSearch || err || !products || !products.length) {
                            if (products && products.length) allProducts = allProducts.concat(products);
                            return Product.findBySubCategory(filters, function (err, products) {
                                if (deepSearch || err || !products || !products.length) {
                                    if (products && products.length) allProducts = allProducts.concat(products);
                                    return Product.findByBrand(filters, function (err, products) {
                                        if (deepSearch || err || !products || !products.length) {
                                            if (products && products.length) allProducts = allProducts.concat(products);
                                            return Product.findByOption(filters, function (err, products) {
                                                if (deepSearch || err || !products || !products.length) {
                                                    if (products && products.length) allProducts = allProducts.concat(products);
                                                    next(err, allProducts.orderByDescending(p => p.hitsPerWeek));
                                                } else
                                                    next(err, products.orderByDescending(p => p.hitsPerWeek));
                                            });
                                        } else
                                            next(err, products.orderByDescending(p => p.hitsPerWeek));
                                    });
                                } else
                                    next(err, products.orderByDescending(p => p.hitsPerWeek));
                            });
                        } else
                            next(err, products.orderByDescending(p => p.hitsPerWeek));
                    });
                } else
                    next(err, products.orderByDescending(p => p.hitsPerWeek));
            });

        } else
            next(err, products.orderByDescending(p => p.hitsPerWeek));
    });
};

Product.groupProducts = function(products, maxGroupSize){
    maxGroupSize = maxGroupSize || 12;
    var groupedProducts = products.groupBy(p => p.subCategory && p.subCategory.name || p.subCategory || '');
    var hasMore = {};
    for(var i in groupedProducts){
        if(groupedProducts[i].length < 4)
            delete groupedProducts[i];
        else{
            var count = Math.min(maxGroupSize, groupedProducts[i].length - groupedProducts[i].length % 4);
            hasMore[i] = groupedProducts[i].length > count;
            groupedProducts[i] = groupedProducts[i].slice(0, count);
        }
    }

    return  Object.keys(groupedProducts)
        .map(key => { return { key, products: groupedProducts[key], hasMore: hasMore[key]}});            
}

Product.getUIFilters = function (products, limit) {
    var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
    var subCategoryGroups = Object.values(products.filter(p => p.subCategory).groupBy(p => p.subCategory._id));
    var tagsGroups = Object.values(products.filter(p => p.tags.length)
        .selectMany(p => p.tags.map(t => {
            return {
                t: t,
                p: p
            };
        }))
        .groupBy(t => t.t.cleanId()));

    var brandGroups = Object.values(products.filter(p => p.brand)
        .groupBy(p => p.brand._id));

    var l = 0, i = 0;
    var regexStr = "Whiskies|Whiskey";

    categories.forEach(c => c && c.name ? regexStr += "|" + c.name + "(es|s|ry)|" + c.name : null);

    var regex = new RegExp(regexStr, "i");
    var uifilters = [];

    uifilters = uifilters.concat(tagsGroups.map(g => {
        return {
            filter: g[0].t.replace(regex, "").trim(),
            hits: g.length * 0.4,
            g: g
        };
    }));

    if (categories.length >= 3) {
        var categoryGroups = Object.values(products.filter(p => p.category).groupBy(p => p.category._id));
        uifilters = uifilters.concat(categoryGroups.map(g => {
            return {
                filter: g[0].category.name.trim(),
                hits: g.length,
                g: g
            };
        }));
    }

    if (subCategoryGroups.length >= 3)
        uifilters = uifilters.concat(subCategoryGroups.map(g => {
            return {
                filter: g[0].subCategory.name.replace(regex, "").trim(),
                hits: g.length * 1.2,
                g: g
            };
        }));

    if (brandGroups.length > 2)
        uifilters = uifilters.concat(brandGroups.map(g => {
            return {
                filter: g[0].brand.name.replace(regex, "").trim(),
                hits: g.length * 0.6,
                g: g
            };
        }));

    var strUIfilters = uifilters
        .filter(f => f.hits > 0 && f.filter && !/^\d/.test(f.filter))
        .filter(f => f.filter.cleanId().split('-').length <= 3)
        .filter(f => f.g.length < products.length * .7 && f.g.length >= 2)
        .orderByDescending(f => f.hits)
        .distinctBy(f => f.filter.cleanId())
        .distinctBy(f => f.g.map(p => p.id).orderBy(i => i).join("|"));

    strUIfilters.forEach(s => {
        if (l <= 75) {
            i += 1;
            l += (s.filter || s).length;
        }
    });

    return strUIfilters.slice(0, limit || i);
};

var topHitsPerWeek = 100;
Product.model.find().exec((err, data) => topHitsPerWeek = data.max(p => p.hitsPerWeek));
