var keystone = require('keystone');
var MenuItem = keystone.list('MenuItem');

exports = module.exports = function (done) {
    MenuItem.model.find({href:/(\/category\/)/})
        .exec((err, menus) => {
            return menus.map(m => {

                var href;
                if(/^(\/category\/[^\/]+\/[^\/]+)/.test(m.href))
                    href = m.href.replace(/^(\/category\/[^\/]+\/)/,"/");
                else
                    href = m.href.replace(/^(\/category\/)/,"/");

                console.log(m.href, "-->" , href);
                m.href = href;
                return m.save();
            });
        }).then(() => {
            done();
        });
}