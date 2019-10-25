var keystone = require('keystone');
var Types = keystone.Field.Types;

/**
 * ProductSubCategory Model
 * ==================
 */

var ProductSubCategory = new keystone.List('ProductSubCategory', {
    autokey: {from: 'name', path: 'key', unique: true},
});

ProductSubCategory.add({
    name: {type: String, required: true, initial: true},
    category: {type: Types.Relationship, ref: 'ProductCategory'},
    menus: {type: Types.Relationship, ref: 'MenuItem', many: true},
    modifiedDate: {type: Date, default: Date.now},
});

ProductSubCategory.schema.pre('save', function(next){
    this.modifiedDate = new Date();
    this.updateMenu(next);
});

ProductSubCategory.schema.methods.updateMenu = function(next){
    var categoryId = this.category && this.category._id || this.category;
    if(!categoryId) return (next || (e => next))();
    keystone.list("ProductCategory").model.findOne({_id: categoryId})
        .populate('menus')
        .exec((err, category) =>{
            if(err){
                if(typeof next == "function")
                    return next(err);
                else
                    return console.warn(err);
            }
            if(!category){
                console.log(`Could not find category: ${categoryId}`);
                category = {name :""};
            }
            var href = `/category/${category.name.cleanId()}/${this.name.cleanId()}`;
            var hrefParts = href.split('/');
            var brandHref = hrefParts.filter((a, i)=> i <= hrefParts.length - 2).join('/');

            var regex = new RegExp(href.escapeRegExp() + "[/#]?$");
            var parentRegex = new RegExp(brandHref.escapeRegExp() + "[/#]?$")

            keystone.list("MenuItem").model
                .find({ "$or":[
                    {href: regex},
                    {href: parentRegex}
                ]}) 
                .exec((err, allmenus)=>{                    
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
                            m.parent = parentMenus[0];
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
                    
                    this.save();
                    if(typeof next == "function")
                        next(null, this.menus);
                });
        });    
};

ProductSubCategory.relationship({ref: 'Product', path: 'product', refPath: 'subCategory'});
ProductSubCategory.register();
