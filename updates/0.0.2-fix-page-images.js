var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Page = keystone.list('Page');

exports = module.exports = function (done) {
    console.log("Extracting clients from pages...");
    Page.model.find({})
        .exec(function (err, pages) {
            var index = -1;
            pages = pages.filter(p => !!p && p.image && p.image.secure_url && p.image.secure_url.toString().indexOf("/nmasuki/") > 0);

            (function fixNext(){
                console.log(`Extracting client from order ${index + 1}/${pages.length}...`);
                var page = pages[++index];                
                if(page){
                    if (page.bannerImages){
                        var bannerImages =  [], mobileBannerImages = [];
                        page.bannerImages.forEach(image => {
                            cloudinary.v2.uploader.upload(image.secure_url, {public_id: "banners/" + page.name.cleanId()},
                            function (error, result) {
                                if(error){
                                    return fixNext(--index);
                                }

                                bannerImages.push(result);
                                if(bannerImages.length >= page.bannerImages.length && 
                                    mobileBannerImages.length >= page.mobileBannerImages.length){
                                    page.bannerImages = bannerImages;
                                    page.mobileBannerImages = mobileBannerImages;
                                    return page.save(fixNext);
                                }
                            });                
                        });

                        page.bannerImages.forEach(image => {
                            cloudinary.v2.uploader.upload(image.secure_url, {public_id: "mobilebanners/" + page.name.cleanId()},
                            function (error, result) {
                                if(error){
                                    return fixNext(--index);
                                }

                                bannerImages.push(result);
                                if(bannerImages.length >= page.bannerImages.length && 
                                    mobileBannerImages.length >= page.mobileBannerImages.length){
                                    page.bannerImages = bannerImages;
                                    page.mobileBannerImages = mobileBannerImages;
                                    return page.save(fixNext);
                                }
                            });                
                        });
                    }
                        
                } else {
                    // done();
                }
            })();
            done();
        });
};