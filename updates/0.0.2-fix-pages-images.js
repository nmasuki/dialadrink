var keystone = require('keystone');
var cloudinary = require('cloudinary');
var Page = keystone.list('Page');

exports = module.exports = function (done) {
    console.log("Extracting clients from pages...");
    Page.model.find({})
        .exec(function (err, pages) {
            var index = -1;
            pages = pages.filter(p => !!p);

            (function fixNext(){
                console.log(`Fixing page ${index + 2}/${pages.length}...`);
                var page = pages[++index];                
                if(page){
                    if (page.bannerImages){
                        var bannerImages =  [], mobileBannerImages = [], missed = {a:0,b:0};
                        page.bannerImages.forEach(image => {
                            cloudinary.v2.uploader.upload(image.secure_url, {public_id: "banners/" + page.name.cleanId()},
                            function (error, result) {
                                if(error){
                                    missed.a += 1;
                                    console.error(error.message);
                                    if(error.http_code != 404) index--;
                                    return fixNext();
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

                        page.mobileBannerImages.forEach(image => {
                            cloudinary.v2.uploader.upload(image.secure_url, {public_id: "mobilebanners/" + page.name.cleanId()},
                            function (error, result) {
                                if(error){
                                    missed.b += 1;
                                    console.error(error.message);                              
                                    if(error.http_code != 404) index--;
                                    return fixNext();
                                }

                                mobileBannerImages.push(result);
                                if(missed.b + bannerImages.length >= page.bannerImages.length && 
                                    mobileBannerImages.length >= page.mobileBannerImages.length){
                                    page.bannerImages = bannerImages;
                                    page.mobileBannerImages = mobileBannerImages;
                                    return page.save(fixNext);
                                }
                            });                
                        });
                    }
                        
                } else {
                    //done();
                }
            })();
            done();
        });
};