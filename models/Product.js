var keystone = require('keystone');
var extractor = require("keyword-extractor");
var Types = keystone.Field.Types;

var Product = new keystone.List('Product', {
    map: {name: 'name'},
    singular: 'Product',
    plural: 'Products',
    autokey: {path: 'href', from: 'href', unique: true}
});

Product.add({
    href: {type: String, initial: true, required: true},
    name: {type: String, initial: true},

    priceOptions: {
        type: Types.Relationship,
        ref: 'ProductPriceOption',
        label: "Prices",
        many: true,
        noedit: true,
    },

    onOffer: {type: Types.Boolean},
    inStock: {type: Types.Boolean},

    state: {type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true},
    image: {type: Types.CloudinaryImage},
    altImages: {type: Types.CloudinaryImages},

    pageTitle: {type: String},
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
        });

    var keyWords = extractor.extract(sentence, {
        language: "english",
        remove_digits: false,
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

Product.schema.virtual('avgRatings').get(function () {
    if (this.ratings && this.ratings.length)
        return Math.round((this.ratings || []).avg(r => r.rating));
    else if (this.onOffer)
        return 4.5;
    else if (this.category.name) { //Developers own ratings
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
    return 1 * Math.random() * 4.0;
});

Product.schema.virtual('ratingCount').get(function () {
    if (this.ratings && this.ratings.length)
        return (this.ratings || []).avg(r => r.rating);
    return 0;
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

Product.schema.virtual('tags').get(function () {
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
    return tags
});

Product.schema.methods.findSimilar = function (callback) {
    var filter = {_id: {"$ne": this._id}, "$or": []};

    if (this.brand)
        filter.$or.push({brand: this.brand._id || this.brand});
    if (this.subCategory)
        filter.$or.push({subCategory: this.subCategory._id || this.subCategory});
    if (this.category)
        filter.$or.push({category: this.category._id || this.category});

    return Product.findPublished(filter).exec(callback);
};

Product.schema.methods.addPopularity = function (factor) {
    this.popularity = (this.popularity || 0) + (factor || 1);
    this.save();
};

Product.defaultColumns = 'name, image, brand, category, state, onOffer';

keystone.deepPopulate(Product.schema);

Product.schema.pre('save', function (next) {
    var cheapestOption = this.cheapestOption || this.priceOptions.first() || {};
    this.price = cheapestOption.price;
    this.offerPrice = cheapestOption.offerPrice;
    this.quantity = cheapestOption.quantity;
    this.modifiedDate = new Date();
    next();
});

CartItem.schema.set('toObject', {
    virtual: true,
    transform: function (doc, ret, options) {
        var whitelist = [
            'href','name','priceOptions','onOffer','inStock',
            'state','image','altImages','pageTitle','description',
            'publishedDate','modifiedDate','popularity','category',
            'subCategory','brand','ratings',
            'options','cheapestOption','avgRatings', 'ratingCount',
            'quantity', 'currency', 'price', 'offerPrice', 'tags'
        ];
        whitelist.forEach(i => ret[i] = doc[i]);
        return ret;
    }
});

CartItem.schema.set('toJSON', {
    transform: function (doc, ret, options) {
        return doc.toObject();
    }
});

Product.register();

Product.findPublished = function (filter, callback) {
    filter = Object.assign(filter || {}, {state: 'published'});
    var a = keystone.list('Product').model.find(filter)
        .sort({popularity: -1})
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

Product.findOnePublished = function (filter, callback) {
    filter = Object.assign({state: 'published'}, filter || {});
    var a = keystone.list('Product').model.findOne(filter)
        .sort({popularity: -1})
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

            filter = {brand: {"$in": brands.map(b => b._id)}};
            Product.findPublished(filter, callback);
        });
};

Product.findByCategory = function (filter, callback) {
    keystone.list('ProductCategory').model.find(filter)
        .exec((err, categories) => {
            if (err || !categories)
                return console.log(err);

            filter = {category: {"$in": categories.map(b => b._id)}};
            Product.findPublished(filter, callback);
        });
};

Product.findBySubCategory = function (filter, callback) {
    keystone.list('ProductSubCategory').model.find(filter)
        .exec((err, subCategories) => {
            if (err || !subCategories)
                return console.log(err);

            filter = {subCategory: {"$in": subCategories.map(b => b._id)}};
            Product.findPublished(filter, callback);
        });
};

Product.findByOption = function (filter, callback) {
    keystone.list('ProductOption').model.find(filter)
        .exec((err, options) => {
            if (err || !options)
                return console.log(err);

            filter = {option: {"$in": options.map(b => b._id)}};
            keystone.list('ProductPriceOption').model.find(filter)
                .exec((err, options) => {
                    if (err || !options)
                        return console.log(err, options);

                    filter = {priceOptions: {"$in": options.map(b => b._id)}};
                    Product.findPublished(filter, callback);
                })

        });
};

Product.search = function (query, next) {

    var nameRegex = new RegExp(query.trim().replace(/\-/g, " ").escapeRegExp(), "i");
    var keyRegex = new RegExp(query.cleanId().trim().escapeRegExp(), "i");

    // Set locals
    var filters = {
        "$or": [
            {key: keyRegex},
            {href: nameRegex},
            {href: keyRegex},
            {name: nameRegex},
            {name: keyRegex},
            {quantity: nameRegex},
            {quantity: keyRegex},
            //{description: nameRegex}
        ]
    };

    //Searching by brand then category then product
    Product.findByBrand(filters, function (err, products) {
        if (err || !products || !products.length)
            Product.findByOption(filters, function (err, products) {
                if (err || !products || !products.length)
                    Product.findByCategory(filters, function (err, products) {
                        if (err || !products || !products.length)
                            Product.findBySubCategory(filters, function (err, products) {
                                if (err || !products || !products.length)
                                    Product.findPublished(Object.assign({description: nameRegex}, filters), function (err, products) {
                                        next(err, products)
                                    });
                                else
                                    next(err, products)
                            });
                        else
                            next(err, products)
                    });
                else
                    next(err, products)
            });
        else
            next(err, products)
    });
};
