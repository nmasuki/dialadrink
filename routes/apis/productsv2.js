var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Product = keystone.list("Product");
var ProductCategory = keystone.list("ProductCategory");
var filters = require('../../helpers/filters');

var router = keystone.express.Router();

router.get("/", async function (req, res) {
    var filter = {};
    var ids = req.query.id || req.query.ids;
    var query = req.query.query || "";
    
    if(ids && Array.isArray(ids))
        filter._id = {"$in": ids.map(id => id)};
    else 
        filter = filters.luceneToMongo(ids || query);
    
    var orderBy = req.query.sort || req.query.orderBy || "popularityRatio DESC";
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1500);
    var skip = (page - 1) * pageSize;
    var sort = filters.orderByToSortObj(orderBy);
    
    console.log("Running filter on products:" + JSON.stringify(filter));
    var json = { response: "error", message: "", count: 0, data: [] };

    try{
        var products = await Product.model.find(filter)
            .sort(sort).skip(skip).limit(pageSize)
            .populate('brand').populate('category').populate('ratings')
            .deepPopulate("subCategory.category,priceOptions.option")
            .exec();

        if (products && products.length) {
            console.log(`Got ${products.length} products with query '${query}'..`);
            json.response = "success";
            json.count = products.length;
            json.data = products.map(d => d.toAppObject());
        } else {
            console.log(`Got no products with query '${query}'..`);
            json.response = "success";
            json.message = "No record matching the query";
        }
    } catch(err){
        if (err){
            json.message = "Error fetching drinks! " + err;
            console.error(json.message);
        }
    }

    res.send(json);
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
        var products = await Product.model.find(filter)
            .sort(sort).skip(skip).limit(pageSize)
            .populate('brand').populate('category').populate('ratings')
            .deepPopulate("subCategory.category,priceOptions.option")
            .exec();

        if (products && products.length) {
            console.log(`Got ${products.length} products with query '${query}'..`);
            json.response = "success";
            json.count = products.length;
            json.data = products.map(d => d.toAppObject());
        } else {
            console.log(`Got no products with query '${query}'..`);
            json.response = "success";
            json.message = "No record matching the query";
        }
    } catch(err){
        if (err){
            json.message = "Error fetching drinks! " + err;
            console.error(json.message);
        }
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