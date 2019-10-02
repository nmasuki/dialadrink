var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductCategory Model
 * ==================
 */

var ProductCategory = new keystone.List('ProductCategory', {
    autokey: {from: '_id', path: 'key', unique: true},
});

ProductCategory.add({
    name: {type: String, required: true, initial: true},
    menus: {type: Types.Relationship, ref: 'MenuItem', many: true},
    image: {type: Types.CloudinaryImage, folder: "category"},
    pageTitle: {type: String},
    description: {type: Types.Html, wysiwyg: true, height: 150},
});

ProductCategory.relationship({ref: 'Product', refPath: 'category'});
ProductCategory.relationship({ref: 'ProductSubCategory', refPath: 'category'});

ProductCategory.schema.pre('save', function(next){
    this.updateMenu(next);
});

ProductCategory.schema.methods.updateMenu = function(next){
    var href = "/category/" + this.name.cleanId();
    var hrefParts = href.split('/');
    var brandHref = hrefParts.filter((a, i)=> i <= hrefParts.length - 2).join('/');

    var regex = new RegExp(href.escapeRegExp() + "[/#]?$");
    var parentRegex = new RegExp(brandHref.escapeRegExp() + "[/#]?$");

    keystone.list("MenuItem").model
                .find({ "$or":[
                    {href: regex},
                    {href: parentRegex}
                ]}) 
                .exec((err, allmenus) => {                    
                    if(err){
                        console.warn(err);
                        if(typeof next == "function")
                            return next(err);
                        else
                            return;
                    }
                    
                    var menus = allmenus.filter(m => regex.test(m.href));
                    var parentMenus = allmenus.filter(m => parentRegex.test(m.href));

                    if(menus && menus.length){
                        this.menus = menus.map(m=>{
                            m.href = href;
                            m.parent = parentMenus[0] || m.parent;
                            m.save();

                            return m;
                        });
                    }else{
                        var menu = keystone.list("MenuItem").model({
                            index: 1,
                            level: 2,
                            href: href,
                            label: this.name,
                            parent: parentMenus[0],
                            type: 'top',
                        });
                        menu.save();
                        this.menus = [menu];
                    }
                    
                    try{
                        this.save();
                    }catch(e){
                        console.warn(e);
                    }

                    if(typeof next == "function")
                        next(null, this.menus);
                });
};

ProductCategory.register();