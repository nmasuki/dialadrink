var keystone = require('keystone');
var Product = keystone.list("Product");
var filters = require('../../helpers/filters');

var router = keystone.express.Router();

async function getPagedProducts(page, pageSize, query, orderBy){
    var strQuery = typeof query == "object"? JSON.stringify(query): query;
    console.log(`Running filter on products: '${strQuery}' Page:${page}, PageSize:${pageSize}`);
    var json = { response: "error", message: "", count: 0, data: [] };

    try{
        var products = await Product.model.find(query)
            .populate('brand').populate('category').populate('ratings')
            .deepPopulate("subCategory.category,priceOptions.option")
            .exec();

        products = products.map(d => d.toAppObject());
        //products = products.filter(filters.mongoFilterToFn(query));
        products = products.orderByExpr(orderBy);
        products = products.slice((page - 1) * pageSize, pageSize);

        if (products && products.length) {
            console.log(`Got ${products.length} products with query '${strQuery}' Page:${page}, PageSize:${pageSize}.`);
            json.response = "success";
            json.count = products.length;
            json.data = products;
        } else {
            console.log(`Got no products with query '${strQuery}' Page:${page}, PageSize:${pageSize}`);
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

    var mapping = {
        "category": "category.name",
        "company": "company.name",
        "brand": "brand.name",
        "CountryOfOrigin": "countryOfOrigin",
        "Description": "description",
        "subcategory": "subcategory.name",
        "price": "priceOptions.option.price",
        "quantity": "priceOptions.option.quantity",
        "currency": "priceOptions.option.currency",
        "offerPrice": "priceOptions.option.offerPrice",
        "inStock": "priceOptions.option.inStock",
        "isFeatured": "onOffer"
    };
    
    if (query) {
        for (var i in mapping) {
            if (!mapping.hasOwnProperty(i)) continue;
            var regex = new RegExp("\\b(" + i + ")\\b", "ig");            
            query = query.replaceAll(regex, mapping[i]);
        }
    }

    if(ids && Array.isArray(ids))
        filter._id = {"$in": ids.map(id => id)};
    else 
        filter = filters.luceneToMongo(ids || query);
    
    var orderBy = req.query.sort || req.query.orderBy || "popularityRatio DESC";
    var page = parseInt(req.query.page || 1);
    var pageSize = parseInt(req.query.pageSize || 20);

    var json = await getPagedProducts(page, pageSize, filter, orderBy);
    res.send(json);
});

router.get("/:id", async function (req, res, next) {
    var id = req.params.id || "";

    var json = { response: "error", message: "", data: [] };

    try {
        var product = await Product.model.findOne({_id: id })
            .populate('brand').populate('category').populate('ratings')
            .deepPopulate("subCategory.category,priceOptions.option")
            .exec();

        if (product) {
            json.response = "success";
            json.data = product.toAppObject();
        } else {
            json.response = "success";
            json.message = "No record matching the query";
        }
    } catch (err) {
        if (err) {
            json.message = `Error fetching drink by id: ${id}!` + err;
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