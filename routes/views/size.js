var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:size", function(req, res, next){
    var view = new keystone.View(req, res);
    var locals = res.locals;

    //set locals
    locals.section = 'store';

    //load size
    view.on('init', function (next){
        keystone.list('Size').model
        .find({
            key: locals.filters.size.cleanId()
        });

        //render view
        view.render('products');
    });;
})

exports = module.exports = router;