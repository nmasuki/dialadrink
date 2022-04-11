var keystone = require('keystone');
var cloudinary = require('cloudinary');
var AppUser = keystone.list('AppUser');
var router = keystone.express.Router();

router.options("/", function (req, res, next) {
    res.send({ 
        response: "success",
        message: "OK",
        data: new Date().toISOString()
    });
});

module.exports = router;