var keystone = require('keystone');
var Product = keystone.list("Product");
var filters = require('../../helpers/filters');

var router = keystone.express.Router();

async function getPagedProducts(page, pageSize, query, orderBy){
    console.log(`Running filter on products: '${query}'`);
    var json = { response: "error", message: "", count: 0, data: [] };

    try{
        var allProducts = await Product.model.find({})
            .populate('brand').populate('category').populate('ratings')
            .deepPopulate("subCategory.category,priceOptions.option")
            .exec();

        var products = allProducts.map(d => d.toAppObject());

        products = products.filter(filters.luceneToFn(query));
        products = products.orderByExpr(orderBy);
        products = products.slice((page - 1) * pageSize, pageSize);

        if (products && products.length) {
            console.log(`Got ${products.length} products with query '${query}'..`);
            json.response = "success";
            json.count = products.length;
            json.data = products;
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

    return json;
}

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

    var json = await getPagedProducts(page, pageSize, filter, orderBy);
    res.send(json);
});

router.get("/:query", async function (req, res, next) {
    var query = req.params.query || "";
    var orderBy = req.query.sort || req.query.orderBy || "popularityRatio DESC";
    
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 1500);

    var json = await getPagedProducts(page, pageSize, query, orderBy)

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