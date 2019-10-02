var keystone = require('keystone');
var Types = keystone.Field.Types;

var docParser;
try {
    docParser = require('whacko');
} catch (e) {
    docParser = require("cheerio");
}

/**
 * Blog Model
 * ==========
 */

var Blog = new keystone.List('Blog', {
    map: {name: 'title'},
    singular: 'Blog',
    plural: 'Blogs',
    //autokey: {path: 'href', from: 'title', unique: true},
});

Blog.add({
    href: {type: String},

    pageTitle: {type: String},
    title: {type: String, required: true, initial: true},
    
    state: {type: Types.Select, options: 'draft, published, archived', default: 'draft', index: true},
    author: {type: Types.Relationship, ref: 'User', index: true},
    publishedDate: {type: Types.Datetime, index: true, dependsOn: {state: 'published'}},
    image: {type: Types.CloudinaryImage, folder: "blob"},
    imageAlt:{type: String, default:'Dial a drink Kenya'},

    content: {
        brief: {type: Types.Html, wysiwyg: true, height: 150},
        extended: {type: Types.Html, wysiwyg: true, height: 400},
    },
    categories: {type: Types.Relationship, ref: 'BlogCategory', many: true},
    tags: {type: Types.TextArray}
});

Blog.schema.virtual('content.full').get(function () {
    return this.content.extended || this.content.brief;
});

Blog.schema.pre("save", function (next) {
    if(!this.href)
        this.href = this.title.cleanId();
        
    keystone.list("BlogCategory").model.find({}).exec((err, caxtegories) => {
        this.categories = categories.filter(c => {
            var regex = new RegExp(c.name, "i");
            return regex.test(this.title) || regex.test(this.content.brief) || regex.test(this.content.extended)
        });

        if((!this.tags || !this.tags.length) && this.content.extended) {
            var $ = docParser.load(this.content.extended);
            var tagElems = ["h1", "h2", "strong", "b"].map(t => "#site-content " + t).join(", ");
            var tags = $(tagElems).text().split("\t").map(t => t.trim());
            var newTags = tags.filter(t => this.tags.any(t1 => t1.toLowerCase().trim() == t.toLowerCase().trim()));

            this.tags = this.tags.concat(newTags);
        }

        next();
    })
})

Blog.defaultColumns = 'title, state|20%, author|20%, publishedDate|20%';
Blog.register();
