var keystone = require('keystone');
var najax = require('najax');
var cloudinary = require("cloudinary");
var Admin = keystone.list('Admin');
var Blog = keystone.list('Blog');
var BlogCategory = keystone.list('BlogCategory');
var baseUrl = keystone.get("url");

var docParser;
try {
    docParser = require('whacko');
} catch (e) {
    docParser = require("cheerio");
}

function importBlogCategory(done) {
    var _categories = ["Kenya", "Whisky|Whiskey", "Nairobi", "Delivery", "Shisha"];
    var _catIds = _categories.map(t => t.split("|").first().cleanId());
    var filter = { key: { "$in": _catIds } };
    BlogCategory.model.find(filter)
        .exec((err, categories) => {
            if (err)
                return done(err, arguments[1]);

            var newCategories = _catIds
                .filter(c => !categories.any(c2 => c2.key == c.cleanId()))
                .map(c => {
                    var category = new BlogCategory.model({ 
                        name: c.split("|").first().toProperCase(),
                        regexMatch: c.trim()
                    });

                    category.save(err => {
                        if (err)
                            console.log(err, categories, category, b);
                    });
                    return category;
                });

            categories = categories.concat(newCategories);
            done(null, categories)
        })
}

function importBlog(tile, done, categories) {
    var articleLink = tile.find("a.action-link").attr("href");
    var title = tile.find(".card-title a").html().trim();
    var breafContent = tile.find(".card-action").html();
    var imageUrl = tile.find("img").attr("src")

    if (articleLink.startsWith("/"))
        articleLink = baseUrl.trimRight("/") + articleLink;
    else if (!articleLink.startsWith("http"))
        articleLink = baseUrl.trimRight("/") + "/" + articleLink;

    if (imageUrl.startsWith("/"))
        imageUrl = baseUrl.trimRight("/") + imageUrl;
    else if (!imageUrl.startsWith("http"))
        imageUrl = baseUrl.trimRight("/") + "/" + imageUrl;

    najax({
        url: articleLink,
        success: function (html) {
            try {
                if (!html)
                    throw "Null HTML response";

                var $ = docParser.load(html);
                var extentedContent = $("#site-content").html();
                title = title || $(".main-title").text();

                Admin.model.findOne({}).exec((err, user) => {
                    if (err)
                        console.log(err);

                    user = user || {};
                    var blog = new Blog.model({
                        title: title,
                        state: 'published',
                        author: user._id,
                        publishedDate: new Date(),
                        //image: { type: Types.CloudinaryImage },
                        content: {
                            brief: breafContent,
                            extended: extentedContent,
                        }
                    });

                    if (!imageUrl)
                        blog.save(err => {
                            if (err)
                                return console.log(err, blog);

                            console.log("Added blog " + blog.title, "Without image");
                            done(null, blog);
                        });
                    else
                    {
                        cloudinary.v2.uploader.upload(imageUrl,
                            { public_id: "blog/" + title.cleanId() },
                            function (error, result) {
                                blog.image = result;
                                blog.save(err => {
                                    if (err)
                                        return console.log(err, blog);

                                    console.log("Added blog " + blog.title);
                                    done(null, blog);
                                });
                            });
                    }
                });
            } catch (e) {
                done(Object.assign({ status: "error", error: e }))
            }
        },
        error: function (error) {
            console.log("HTTP call failed!", baseUrl);

            var body = { status: "error", msg: error.responseText, code: error.statusCode() };
            console.warn(body);

            done(error);
        }
    });
}

exports = module.exports = function (done) {
    console.log("Loading blogs from " + baseUrl.trimRight("/") + "/blog");

    najax({
        url: baseUrl.trimRight("/") + "/blog",
        success: function (html) {
            console.log("Loaded!")
            try {
                if (!html)
                    throw "Null HTML response";

                var $ = docParser.load(html);
                var blogTiles = Array.from($(".home_tab_top .row .card"));
                var count = 0;

                importBlogCategory(function(){
                    blogTiles.forEach(function (tile) {
                        importBlog($(tile), function (err) {
                            if (err)
                                console.log(err);

                            if (++count >= blogTiles.length)
                                done();
                        })
                    })
                });
            }
            catch (e) {
                done(Object.assign({ status: "error", error: e }))
            }
        },
        error: function (error) {
            console.log("HTTP call failed!", baseUrl);

            var body = { status: "error", msg: error.responseText, code: error.statusCode() };
            console.warn(body);

            done(error);
        }
    });
};

