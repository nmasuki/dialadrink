var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Product = keystone.list("Product");
var ProductCategory = keystone.list("ProductCategory");
var filters = require('../../helpers/filters');

var router = keystone.express.Router();

router.get("/", function (req, res) {
    var filter = {};

    if(req.query.id)
        filter._id = typeof req.query.id == "string"? req.query.id: {"$in": req.query.id.map(id => id)};
    
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1000);
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
                .map(d => Object.assign({ options: d.options }, d.toAppObject()));

            console.log("Found " + json.data.length);
        }

        res.send(json);
    });
});

router.get("/:query", async function (req, res, next) {
    var query = req.params.query || "";
    var orderBy = req.query.sort || req.query.orderBy || "popularityRatio DESC";
    
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1500);
    var skip = (page - 1) * pageSize;
    var sort = filters.orderByToSortObj(orderBy);
    var filter = filters.luceneToMongo(query);

    console.log("Running filter on products:" + JSON.stringify(filter));
    var json = { response: "error", message: "", count: 0, data: [] };

    try{
        var products = Product.model.find(filter)
            .sort(sort).skip(skip).limit(pageSize)
            .populate('brand').populate('category').populate('ratings')
            .deepPopulate("subCategory.category,priceOptions.option")
            .exec();

        if (products && products.length) {
            json.response = "success";
            json.count = products.length;
            json.data = products.map(d => d.toAppObject());
        } else {
            json.response = "success";
            json.message = "No record matching the query";
        }
    } catch(err){
        if (err)
            json.message = "Error fetching drinks! " + err;
    }

    res.send(json);
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