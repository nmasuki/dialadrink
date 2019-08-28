var keystone = require('keystone');
var Page = keystone.list("Page");

var router = keystone.express.Router();

router.get('/', function (req, res) {
	var json = {
		response: "success",
		data: [{
			title: "name",
			value: keystone.get('name')
		}]
	};

	res.send(json);
});

router.get("/banners", function(reg, res){
    var filters = {$where:'this.mobileBannerImages && this.mobileBannerImages.length > 1'};

    Page.model.find(filters)
        .exec((err, pages) => {
            if (err)
                return res.send({
                    response: "error",
                    message: "Unexpected error while reading mobile banners! " + err
                });
            
            var json = {
                response: "error",
                message: ""
            };

            if(pages && pages.length){
                var banners = pages.selectMany(p=>{
                    return p.mobileBannerImages.map(b=>{
                        return {
                            id: p.id,
                            title: p.title,
                            meta: p.meta,
                            image: b.secure_url,
                            status: ""
                        };
                    });
                });
                json.response = "success";
                json.data = banners;
            }

            res.send(json);
        });    
});

exports = module.exports = router;