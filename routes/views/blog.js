var keystone = require('keystone');
var router = keystone.express.Router();
var async = require('async');


router.get("/", function (req, res) {
    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Init locals
    locals.section = 'blog';
    locals.filters = {
        category: req.params.category,
    };
    locals.data = {
        posts: [],
        categories: [],
    };

    locals.page = Object.assign({title: "Blog"}, locals.page);

    // Load all categories
    view.on('init', function (next) {
        keystone.list('BlogCategory').model.find().sort('name').exec(function (err, results) {
            if (err || !results.length) {
                return next(err);
            }

            locals.data.categories = results;

            // Load the counts for each category
            async.each(locals.data.categories, function (category, next) {

                keystone.list('Blog').model.count().where('categories').in([category.id]).exec(function (err, count) {
                    category.postCount = count;
                    next(err);
                });

            }, function (err) {
                next(err);
            });
        });
    });

    // Load the current category filter
    view.on('init', function (next) {
        if (req.params.category) {
            keystone.list('BlogCategory').model.findOne({key: locals.filters.category}).exec(function (err, result) {
                locals.data.category = result;
                next(err);
            });
        } else {
            next();
        }
    });

    // Load the posts
    view.on('init', function (next) {
        var q = keystone.list('Blog').paginate({
            page: req.query.page || 1,
            perPage: 10,
            maxPages: 10,
            filters: {
                state: 'published',
            },
        })
            .sort('-publishedDate')
            .populate('author categories');

        if (locals.data.category) {
            q.where('categories').in([locals.data.category]);
        }

        q.exec(function (err, results) {
            locals.data.blogs = results;
            next(err);
        });
    });

    // Render the view
    view.render('blog');
});

router.get("/:post", function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Init locals
    locals.section = 'blog';
    locals.filters = {
        category: req.params.category,
    };
    locals.data = {
        post: [],
        categories: [],
    };

    locals.page = Object.assign({title: "Blog"}, locals.page);

    // Load all categories
    view.on('init', function (next) {
        keystone.list('BlogCategory').model.find().sort('name').exec(function (err, results) {
            if (err || !results.length) {
                return next(err);
            }

            locals.data.categories = results;

            // Load the counts for each category
            async.each(locals.data.categories, function (category, next) {

                keystone.list('Blog').model.count().where('categories').in([category.id]).exec(function (err, count) {
                    category.postCount = count;
                    next(err);
                });

            }, function (err) {
                next(err);
            });
        });
    });

    // Load the selected post
    view.on('init', function (next) {
        var q = keystone.list('Blog').model
            .findOne({href: req.params.post})
            .populate('author categories')
            .exec((err, post) => {
                if (post) {
                    locals.data.blog = post;
                    locals.page.title = post.title;
                    locals.page.meta = post.content.breaf || post.title;
                }

                next();
            });
    });

    // Render the view
    view.render('post');
});

router.get("/cat/:category", function (req, res) {

    var view = new keystone.View(req, res);
    var locals = res.locals;

    // Init locals
    locals.section = 'blog';
    locals.filters = {
        category: req.params.category,
    };
    locals.data = {
        posts: [],
        categories: [],
    };

    // Load all categories
    view.on('init', function (next) {
        keystone.list('BlogCategory').model.find().sort('name').exec(function (err, results) {
            if (err || !results.length) {
                return next(err);
            }

            locals.data.categories = results;

            // Load the counts for each category
            async.each(locals.data.categories, function (category, next) {

                keystone.list('Blog').model.count().where('categories').in([category.id]).exec(function (err, count) {
                    category.postCount = count;
                    next(err);
                });

            }, function (err) {
                next(err);
            });
        });
    });

    // Load the current category filter
    view.on('init', function (next) {
        if (req.params.category) {
            keystone.list('BlogCategory').model.findOne({key: locals.filters.category}).exec(function (err, result) {
                locals.data.category = result;
                next(err);
            });
        } else {
            next();
        }
    });

    // Load the posts
    view.on('init', function (next) {

        var q = keystone.list('Blog').paginate({
            page: req.query.page || 1,
            perPage: 10,
            maxPages: 10,
            filters: {
                state: 'published',
            },
        })
            .sort('-publishedDate')
            .populate('author categories');

        if (locals.data.category) {
            q.where('categories').in([locals.data.category]);
        }

        q.exec(function (err, results) {

            locals.data.blogs = results;
            var cat;
            if (results) {
                cat = (locals.data.category.name || locals.data.category);
                locals.page.title = (results.results.first() || {}).title || cat.toProperCase();
                locals.meta = (results.results.first() || {}).title || cat.toProperCase();
            }
            if (locals.data.category)
                locals.page.h1 = (cat || locals.data.category.name || locals.data.category).toProperCase();

            next(err);
        });
    });

    // Render the view
    view.render('blog');
});

module.exports = router;
