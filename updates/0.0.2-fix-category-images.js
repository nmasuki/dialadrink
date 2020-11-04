var keystone = require('keystone');
var cloudinary = require('cloudinary');
var ProductCategory = keystone.list('ProductCategory');

exports = module.exports = function (done) {
    console.log("Extracting clients from categories...");
    ProductCategory.model.find({})
        .exec(function (err, categories) {
            var index = -1;
            categories = categories.filter(p => !!p && p.image && p.image.secure_url && p.image.secure_url.toString().indexOf("/nmasuki/") > 0);

            (function fixNext(){
                console.log(`Extracting client from order ${index + 1}/${categories.length}...`);
                var category = categories[++index];                
                if(category){
                    if (category.image && category.image.secure_url)
                        cloudinary.v2.uploader.upload(category.image.secure_url, {public_id: "categories/" + category.name.cleanId()},
                            function (error, result) {
                                if(error){
                                    return fixNext(--index);
                                }
                                ProductCategory.model.find({_id: category._id})
                                    .exec((err, p) => {
                                        p.image = result;                                
                                        p.altImages = [result];
                                        p.save(err => {
                                            if (err){
                                                console.log(err, category);
                                                return fixNext(--index);
                                            }
                                            console.log("Fixed category image " + category.name);                                    
                                            return fixNext();
                                        });
                                    });
                                
                            });
                } else {
                    // done();
                }
            })();
            done();
        });
};