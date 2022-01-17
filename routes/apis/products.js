var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Product = keystone.list("Product");
var ProductCategory = keystone.list("ProductCategory");

var router = keystone.express.Router();

router.get("/", function (req, res) {
    var filter = {};

    if(req.query.id)
        filter._id = typeof req.query.id == "string"? req.query.id: {"$in": req.query.id.map(id => id)};
    
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1500);
    var start = (page - 1) * pageSize;
    
    var query = req.query.query || "";
    console.log("Looking up products.. " + query, "page:", page, "pageSize:", pageSize, "skip:", start);
    Product.search(query, function (err, products) {
        var json = {
            response: "error",
            message: ""
        };

        if (err)
            json.message = "Error fetching drinks! " + err;
        else {
            json.response = "success";
            json.data = products.orderBy(p => p.publishedDate)
                .slice(start, start + pageSize)
                .selectMany(d => {
                    return d.options.map(o => {
                        var obj = Object.assign({}, d.toAppObject(), o);
                        obj._id = [obj._id, o.quantity].join("-");
                        obj.price = obj.price || 0;
                        obj.offerPrice = obj.offerPrice || 0;
                        return obj;
                    });
                });
            console.log("Found " + json.data.length);
        }

        res.send(json);
    });
});

router.get("/categories", function (req, res) {
    var cloudinaryOptions = {
        secure: true,
        transformation: [
            //{ effect: "cartoonify" },
            //{ background: "white" }, 
            { width: 250, height:250, radius: "15", crop: "fill" }
        ]
    };
    
    ProductCategory.model.find()
        .populate("menus")
        .exec((err, categories) => {
            var json = {
                response: "error",
                message: "",
                data: []
            };

            if (err)
                json.message = "Error fetching drinks! " + err;
            else if (categories && categories.length) {
                json.response = "success";
                json.data = categories.orderBy(c => {
                    var menus = c.menus.orderBy(m => m.index);                        
                    return menus.length? menus[0].index: 100;
                }).map(d => {
                    return {
                        id: d.id,
                        slug: d.key,
                        name: d.name || '',
                        image: (d.image ? cloudinary.url(d.image.public_id, cloudinaryOptions) : res.locals.placeholderImg),
                        title: d.pageTitle || '',
                        description: d.description || ''
                    };
                });
            } else {
                json.response = "success";
                json.message = "No record matching the query";
            }

            res.send(json);
        });
});

router.get("/category/:category", function (req, res) {
    ProductCategory.model.find({ key: req.params.category.cleanId() })
        .exec((err, categories) => {
            var filter = {
                category: {
                    "$in": categories.map(c => c._id)
                }
            };

            Product.findPublished(filter, (err, products) => {
                var json = {
                    response: "error",
                    message: "",
                    count: 0,
                    data: []
                };

                if (err)
                    json.message = "Error fetching drinks! " + err;
                else if (products && products.length) {
                    json.response = "success";
                    json.count = products.length;
                    json.data = products.map(d => d.toAppObject());
                } else {
                    json.response = "success";
                    json.message = "No record matching the query";
                }

                res.send(json);
            });
        });
});

router.get("/:query", function (req, res, next) {
    var query = req.params.query;
    Product.search(query, function (err, products) {
        var json = {
            response: "error",
            message: "",
            count: 0,
            data: []
        };

        if (err)
            json.message = "Error fetching drinks! " + err;
        else if (products && products.length) {
            json.response = "success";
            json.count = products.length;
            json.data = products.map(d => d.toAppObject());
        } else {
            json.response = "success";
            json.message = "No record matching the query";
        }

        res.send(json);
    });
});

router.get("/related/:productId", function(req, res, next){
    Product.model.findOne({_id: req.params.productId})
        .exec((err, product) => {
            var json = {
                response: "error",
                message: "",
                count: 0,
                data: []
            };

            if (err)
                json.message = "Error fetching related products! " + err;
            else if (product) {
                return product.findRelated((err, products) => {
                    json.response = "success";
                    json.data = products.map(d => d.toAppObject());
                    
                    res.send(json);
                });
            } else {
                json.message = `No record matching the id '${req.params.productId}'`;
            }
            
            res.send(json);
        });
});

module.exports = router;