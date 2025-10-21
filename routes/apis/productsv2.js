var keystone = require('keystone');
var Product = keystone.list("Product");
var filters = require('../../helpers/filters');
var router = keystone.express.Router();

router.get("/", async function (req, res) {
    var fetchProducts = Product.model.find({})
        .populate('brand').populate('category').populate('ratings')
        .deepPopulate("subCategory.category,priceOptions.option")
        .exec();

    var json = await filters.getPaged("allProducts", fetchProducts, req, res);  
    return res.send(json);
});

router.get("/:id", async function (req, res, next) {
    var id = req.params.id || "";

    var json = { response: "error", message: "", data: [] };

    try {
        // Check if id is a valid ObjectId or a slug
        var query;
        if (/^[0-9a-fA-F]{24}$/.test(id)) {
            // Valid ObjectId format
            query = { _id: id };
        } else {
            // Assume it's a slug/href
            var regex = new RegExp(id.replace(/[^a-zA-Z0-9-]/g, '').trim(), "i");
            query = { 
                $or: [
                    { href: regex },
                    { href: id },
                    { slug: id }
                ]
            };
        }

        var product = await Product.model.findOne(query)
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
    var productId = req.params.productId;
    
    // Check if productId is a valid ObjectId or a slug
    var query;
    if (/^[0-9a-fA-F]{24}$/.test(productId)) {
        // Valid ObjectId format
        query = { _id: productId };
    } else {
        // Assume it's a slug/href
        var regex = new RegExp(productId.replace(/[^a-zA-Z0-9-]/g, '').trim(), "i");
        query = { 
            $or: [
                { href: regex },
                { href: productId },
                { slug: productId }
            ]
        };
    }

    Product.model.findOne(query)
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