var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Page = keystone.list("Page");
var Location = keystone.list("Location");

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

router.get("/banners", function (req, res) {
    var filters = {
        $where: 'this.mobileBannerImages && this.mobileBannerImages.length > 1'
    };

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

            if (pages && pages.length) {
                json.response = "success";
                json.data = pages.selectMany(p => {
                    return p.mobileBannerImages.reverse().map(b => {
                        return {
                            id: p.id,
                            title: p.title,
                            meta: p.meta,
                            image: cloudinary.url(b.public_id, { height:300, width: 525, crop: "pad", background: 'auto' }),
                            status: ""
                        };
                    });
                });

                console.log(json.data.map(b=>b.image));
            }

            res.send(json);
        });
});

router.get("/locations", function (req, res) {
    Location.model.find({ show: true })
        .exec((err, locations) => {
            if (err)
                return res.send({
                    response: "error",
                    message: "Unexpected error while reading locations! " + err
                });

            var json = {
                response: "error",
                message: ""
            };

            if (locations && locations.length) {
                json.response = "success";
                json.data = locations.map(l=>l.toObject());
            }else{
                json.message = "No locations found!";
            }

            res.send(json);
        });
});

exports = module.exports = router;