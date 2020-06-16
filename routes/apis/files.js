var keystone = require('keystone');
var cloudinary = require('cloudinary');
var router = keystone.express.Router();

router.post('/upload', function (req, res) {
    console.dir(req.files);

    if(req.files){
        for(var i in req.files){
            var file = req.files[i];
            console.log(file);
            
        }
    }

    var json = {
        response: "error",
        data: ["https://res.cloudinary.com/nmasuki/image/upload/v1591049992/users/emmah-present-from-cousin-mugo-njoki.jpg"]
    };

    res.send(json);
});

exports = module.exports = router;