var keystone = require('keystone');
var Blog = keystone.list('Blog');

exports = module.exports = function (done) {
    Blog.model.find({})
        .exec((err, blogs) => {
            return blogs.map(b => {
                if (!b.pageTitle)
                    b.pageTitle = b.title.replace(/I/g, "|");

                if (b.title.contains("I") || b.title.contains("|"))
                    b.title = (b.title.contains("|") ? b.title.split("|").first() : b.title.split("I").first()).trim();

                if (b.href.length > b.title.length)
                    b.href = b.title.cleanId();

                return b.save();
            })
        }).then(() => {
            done()
        });
}