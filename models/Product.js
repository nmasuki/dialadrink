var keystone = require('keystone');
var extractor = require("keyword-extractor");
var cloudinary = require('cloudinary');
var Types = keystone.Field.Types;

var Product = new keystone.List('Product', {
    map: {
        name: 'name'
    }
});


Product.add({
    href: {type: String, initial: true, required: true},
    name: {type: String, initial: true},

    alcoholContent: {type: Number, initial: true},

    priceOptions: {
        type: Types.Relationship,
        ref: 'ProductPriceOption',
        label: "Prices",
        many: true,
        noedit: true,
    },

    onOffer: {type: Types.Boolean},
    inStock: {type: Types.Boolean},
    isGiftPack: {type: Types.Boolean},

    state: {type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true},
    image: {type: Types.CloudinaryImage, folder: "products"},
    altImages: {type: Types.CloudinaryImages, folder: "products"},
    youtubeUrl: {type: String},

    pageTitle: {type: String},
    tags: {type: Types.TextArray},
    description: {type: Types.Html, wysiwyg: true, height: 150},
    
    publishedDate: {type: Date, default: Date.now},
    modifiedDate: {type: Date, default: Date.now},

    popularity: {type: Number, noedit: true},

    category: {type: Types.Relationship, ref: 'ProductCategory'},
    subCategory: {type: Types.Relationship, ref: 'ProductSubCategory', filters: {product: ':category'}},
    brand: {type: Types.Relationship, ref: 'ProductBrand'},

    ratings: {type: Types.Relationship, ref: 'ProductRating', many: true, hidden: true}
});

Product.schema.virtual("keyWords").get(function () {
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

    var sentence = (tags.concat([this.name, this.pageTitle, this.description]))
        .join(", ").replace(/(&nbsp;?)/g, " ")
        .replace(/\W/g, function (x) {
            return (x.trim() + " ");
        })
        .truncate(500);

    var keyWords = extractor.extract(sentence, {
        language: "english",
        remove_digits: true,
        return_changed_case: false,
        remove_duplicates: true
    });

    return keyWords.filter(s => s && s.length > 2);
});

Product.schema.virtual('options').get(function () {
    return this.priceOptions.map(op => ({
        _id: op._id,
        quantity: (op.option || {}).quantity,
        currency: op.currency || "KES",
        offerPrice: op.offerPrice,
        price: op.price,
    })).distinctBy(op => op.quantity);
});

Product.schema.virtual('cheapestOption').get(function () {
    return this.options.orderBy(o => o.price).first();
});

Product.schema.virtual('averageRatings').get(function () {
    if (this.ratings && this.ratings.length)
        return Math.round((this.ratings || []).avg(r => r.rating));
    else if (this.onOffer)
        return 4.5;
    else if (this.category && this.category.name) { //Developers own ratings
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
    var cheapestOption = this.cheapestOption || this.priceOptions.first() || {};
    return cheapestOption ? cheapestOption.quantity : null;
});

Product.schema.virtual('currency').get(function () {
    var cheapestOption = this.cheapestOption || this.priceOptions.first() || {};
    return cheapestOption ? cheapestOption.currency || "KES" : null;
});

Product.schema.virtual('price').get(function () {
    var cheapestOption = this.cheapestOption || this.priceOptions.first() || {};
    return cheapestOption ? cheapestOption.price : null;
});

Product.schema.virtual('offerPrice').get(function () {
    var cheapestOption = this.cheapestOption || this.priceOptions.first() || {};
    return cheapestOption ? cheapestOption.offerPrice : null;
});

Product.schema.virtual('percentOffer').get(function () {
    var cheapestOption = this.cheapestOption || this.priceOptions.first() || {};
    if (cheapestOption && cheapestOption.price > cheapestOption.offerPrice) {
        var discount = cheapestOption.price - cheapestOption.offerPrice;
        var percent = Math.round(100 * discount / cheapestOption.price);
        return percent;
    }
    return null;
});

Product.schema.virtual('priceValidUntil').get(function () {
    var today = new Date();
    var firstStr = today.toISOString().substr(0, 8) + "01";
    var lastExpiry = new Date(firstStr);
    return lastExpiry.addMonths(1).addSeconds(-1).toISOString();
});

Product.schema.virtual('popularityRatio').get(function () {
    var max = 1.0,
        min = 0.75;
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
        _id: {
            "$ne": this._id
        },
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

    return Product.findPublished(filter).exec(callback);
};

Product.schema.methods.addPopularity = function (factor) {
    this.popularity = (this.popularity || 0) + (factor || 1);
    this.save();
};

Product.schema.methods.toAppObject = function(){
    var d = this;

    var cloudinaryOptions = {
        transformation: [
            //{ effect: "cartoonify" },
            { background: "transparent" }, 
            //{background_removal: "remove_the_background"},
            { width: 250, height:250, crop: "lpad" }
        ]
    };

    var obj = Object.assign({}, this.toObject(), {
        url: 'https://www.dialadrinkkenya.com/' + d.href,
        imageFullSize: d.image.secure_url,
        imagesFullSize: d.altImages ? d.altImages.map(a => a && a.secure_url) : [],
        image: cloudinary.url(d.image.public_id, cloudinaryOptions),
        images: d.altImages ? d.altImages.map(a => a && a.secure_url || cloudinary.url(a.public_id, cloudinaryOptions)) : [],
        category: d.category ? d.category.name : null,
        categories: d.onOffer ? (d.category ? [d.category.name, "offer"] : ["offer"]) : d.category ? [d.category.name] : [],
        subcategory: d.subCategory ? d.subCategory.name : null,
        ratings: d.averageRatings,
        ratingCount: d.ratingCount,
        quantity: d.quantity,
        brand: d.brand ? d.brand.name : null,
        company: d.brand && d.brand.company ? d.brand.company.name : null,
        price: d.price,
        discount: d.percentOffer || "",
        currency: d.currency,
        options: d.options
    });

    ["__v", 'priceOptions', 'subCategory', 'altImages', 'href'].forEach(i => {
        delete obj[i];
    });

    return obj;
};

Product.defaultColumns = 'name, image, brand, category, state, onOffer';

keystone.deepPopulate(Product.schema);
Product.schema.pre('save', function (next) {
    var cheapestOption = this.cheapestOption || this.priceOptions.first();
    this.modifiedDate = new Date();

    if (this.alcoholContent) {
        if (this.alcoholContent > 100)
            this.alcoholContent = 100;
        else if (this.alcoholContent < 0)
            this.alcoholContent = 0;
    }

    if (cheapestOption) {
        this.price = cheapestOption.price;
        this.offerPrice = cheapestOption.offerPrice;
        this.quantity = cheapestOption.quantity;
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
        return tags.filter(t => !!t)
    }

    if (!this.tags || !this.tags.length)
        this.tags = defaultTags.call(this);

    next();
});

Product.schema.set('toObject', {
    transform: function (doc, ret, options) {
        var whitelist = [
            'href', 'name', 'priceOptions', 'onOffer', 'inStock',
            'state', 'image', 'altImages', 'pageTitle', 'description',
            'publishedDate', 'modifiedDate', 'popularity', 'category',
            'subCategory', 'brand', 'ratings', 'popularityRatio', 'options', 'cheapestOption',
            'averageRatings', 'ratingCount', 'tags',
            'quantity', 'currency', 'price', 'offerPrice',
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

Product.findPublished = function (filter, callback) {
    filter = Object.assign(filter || {}, {
        state: 'published'
    });
    var a = keystone.list('Product').model.find(filter)
        .sort({
            popularity: -1
        })
        .populate('brand')
        .populate('category')
        .populate('ratings')
        .populate('category')
        .deepPopulate("subCategory.category,priceOptions.option");

    if (typeof callback == "function")
        a.exec(callback);

    return a;
};

Product.findOnePublished = function (filter, callback) {
    filter = Object.assign({
        state: 'published'
    }, filter || {});
    var a = keystone.list('Product').model.findOne(filter)
        .sort({
            popularity: -1
        })
        .populate('brand')
        .populate('category')
        .populate('subCategory')
        .populate('ratings')
        .populate('category')
        .deepPopulate("priceOptions.option");

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

Product.search = function (query, next) {
    var nameStr = query.trim().toLowerCase().replace(/\-/g, " ").escapeRegExp().replace(/\s+/g, ".*?");
    var keyStr = query.cleanId().trim().escapeRegExp();

    var nameRegex = new RegExp(nameStr + ".*?", "i");
    var keyRegex = new RegExp(keyStr + ".*?", "i");

    // Set locals
    var filters = {
        "$or": [{
                'category.key': new RegExp(keyStr + "$", "i")
            },{
                key: keyRegex
            },
            {
                href: keyRegex
            },
            {
                href: nameRegex
            },
            {
                tags: keyRegex
            },
            {
                tags: nameRegex
            },
            {
                name: nameRegex
            },
            {
                name: keyRegex
            },
            {
                quantity: nameRegex
            },
            {
                quantity: keyRegex
            },
            {
                "$or": [{
                        'company.name': keyRegex
                    },
                    {
                        'company.name': nameRegex
                    }
                ]
            }
        ]
    };

    //Searching by brand then category then product
    return Product.findPublished({ 
        href: new RegExp(keyStr + "$", "i")
    }, function (err, products) {
        if (err || !products || !products.length)
            return Product.findByBrand(filters, function (err, products) {
                if (err || !products || !products.length)
                    return Product.findByOption(filters, function (err, products) {
                        if (err || !products || !products.length)
                            return Product.findByCategory(filters, function (err, products) {
                                if (err || !products || !products.length)
                                    return Product.findBySubCategory(filters, function (err, products) {
                                        if (err || !products || !products.length)
                                            return Product.findPublished(filters, function (err, products) {
                                                next(err, products.orderByDescending(p => p.hitsPerWeek));
                                            });
                                        else
                                            next(err, products.orderByDescending(p => p.hitsPerWeek));
                                    });
                                else
                                    next(err, products.orderByDescending(p => p.hitsPerWeek));
                            });
                        else
                            next(err, products.orderByDescending(p => p.hitsPerWeek));
                    });
                else
                    next(err, products.orderByDescending(p => p.hitsPerWeek));
            });
        else
            next(err, products.orderByDescending(p => p.hitsPerWeek));
    });
};

Product.getUIFilters = function (products) {
    var categories = products.map(p => p.category).filter(b => !!b).distinctBy(b => b.name);
    var subCategoryGroups = Object.values(products.filter(p => p.subCategory)
        .groupBy(p => p.subCategory._id));
    var tagsGroups = Object.values(products.filter(p => p.tags.length)
        .selectMany(p => p.tags.map(t => {
            return {
                t: t,
                p: p
            }
        }))
        .groupBy(t => t.t));

    var brandGroups = Object.values(products.filter(p => p.brand)
        .groupBy(p => p.brand._id));

    var l = 0,
        i = 0;
    var regexStr = "Whiskies|Whiskey";

    categories.forEach(c => c && c.name ? regexStr += "|" + c.name + "(es|s|ry)|" + c.name : null);

    var regex = new RegExp(regexStr, "i");
    var uifilters = [];

    uifilters = uifilters.concat(tagsGroups.map(g => {
        return {
            filter: g[0].t.replace(regex, "").trim(),
            hits: g.length,
            g: g
        };
    }));

    if (categories.length > 3) {
        var categoryGroups = Object.values(products.filter(p => p.category).groupBy(p => p.category._id));
        uifilters = uifilters.concat(categoryGroups.map(g => {
            return {
                filter: g[0].category.name.trim(),
                hits: g.length,
                g: g
            };
        }));
    }

    if(subCategoryGroups.length > 3)
        uifilters = uifilters.concat(subCategoryGroups.map(g => {
            return {
                filter: g[0].subCategory.name.replace(regex, "").trim(),
                hits: g.length,
                g: g
            };
        }));

    if(brandGroups.length > 2)
        uifilters = uifilters.concat(brandGroups.map(g => {
            return {
                filter: g[0].brand.name.replace(regex, "").trim(),
                hits: g.length,
                g: g
            };
        }));

    var strUIfilters = uifilters
        .filter(f => f.hits > 1 && f.filter && !/^\d/.test(f.filter))
        .orderBy(f => -f.hits)
        .distinctBy(f => f.filter.trim())
        .distinctBy(f => f.g.map(p => p.id).orderBy(i => i).join("|"));

    strUIfilters.forEach(s => {
        if (l <= 70) {
            i += 1;
            l += (s.filter || s).length;
        }
    });

    return strUIfilters.slice(0, i);
};

var topHitsPerWeek = 100;
Product.model.find()
    .exec(function (err, data) {
        topHitsPerWeek = data.max(p => p.hitsPerWeek);
    });