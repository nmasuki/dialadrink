var keystone = require('keystone');
var router = keystone.express.Router();

router.get("/:mybrands", function(req, res, next){
    var view = new keystone.View(req, res);
    var locals = res.locals;

    //set locals
    locals.section = 'store';

    //load brands
    view.on('init', function (next){
        keystone.list('Mybrands').model
        .find({
            key: locals.filters.brand.cleanId()
        });

        //render view
        view.render('mybrands');
    });;
})

exports = module.exports = router;