var keystone = require('keystone');
var MenuItem = keystone.list('MenuItem');

exports = module.exports = function (done) {
    MenuItem.model.find({href:/(\/category\/)/})
        .exec((err, menus) => {
            return menus.map(m => {
                m.href = m.href.replace(/(\/category\/)/,"/");
                return m.save();
            });
        }).then(() => {
            done();
        });
}