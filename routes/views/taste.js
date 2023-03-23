var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:taste", function(req, res, next){
    var view = new keystone.View(req, res);
    var locals = res.locals;

    //set locals
    locals.section = 'store';

    //load tastes
    view.on('init', function (next){
        keystone.list('Taste').model
        .find({
            key: locals.filters.taste.cleanId()
        });

        //render view
        view.render('products');
    });;
})

exports = module.exports = router;