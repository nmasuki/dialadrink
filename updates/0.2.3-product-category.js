// Import
var keystone = require('keystone');
var ProductCategory = keystone.list('ProductCategory');
var ProductSubCategory = keystone.list('ProductSubCategory');

exports = module.exports = function (done) {
    ProductCategory.model.find()
        .populate('subCategories')
        .exec((err, categories) => {
            categories.forEach(c => c.save())
        });

    ProductSubCategory.model.find()
        .exec((err, categories) => {
            categories.forEach(c => c.save())
        });

    done();
};