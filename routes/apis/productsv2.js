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