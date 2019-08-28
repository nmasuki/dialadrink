var keystone = require('keystone');
var Product = keystone.list("Product");
var ProductCategory = keystone.list("ProductCategory");

var router = keystone.express.Router();

router.get("/", function (req, res) {
    var since = new Date(req.query.since || '2015-01-01');

    Product.findPublished({modifiedDate: { $gt: since}}, function (err, products) {
        var json = {
            response: "error",
            message: ""
        };

        if (err)
           json.message = "Error fetching drinks! " + err;
        else{
            json.response = "success";
            json.data = products.map(d => d.toAppObject());
        }

        res.send(json);
    });
});

router.get("/categories", function(req, res){
    ProductCategory.model.find()
        .exec((err, categories) => {
            var json = {
                response: "error",
                message: "",
                data: []
            };
    
            if (err)
               json.message = "Error fetching drinks! " + err;
            else if(categories && categories.length){
                json.response = "success";
                json.data = categories.map(d => {
                    return {
                        id: d.id,
                        slug: d.key,
                        name: d.name || '',
                        image: (d.image? d.image.secure_url: res.locals.placeholderImg),
                        title: d.title || '',
                        description: d.description || ''
                    };
                });
            } else{            
                json.response = "success";
                json.message = "No record matching the query";
            }
    
            res.send(json);
        });
});

router.get("/{query}", function(req, res, next){
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
        else if(products && products.length){
            json.response = "success";
            json.count = products.length;
            json.data = products.map(d => d.toAppObject());
        } else{            
            json.response = "success";
            json.message = "No record matching the query";
        }

        res.send(json);
    });
});

module.exports = router;