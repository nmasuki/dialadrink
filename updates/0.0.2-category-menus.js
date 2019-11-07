var keystone = require('keystone');
var MenuItem = keystone.list('MenuItem');

var categories = require('../data/categories');

function importMenus(i, parent, index, done){
    var label = i.name.toProperCase(), href = i.name.cleanId();
	var level = parent ? parent.level + 1 : 0;

    return MenuItem.model
        .findOne({href: href, level: level})
		.exec((err, menu) => {
			if (err)
				return console.log(err, arguments[1]);

			if (!menu)
				menu = new MenuItem.model({});

			menu.href = href;
			menu.label = label.trim();
			menu.level = level;
			menu.index = index || 0;
			menu.parent = parent;
			menu.show = true;
            menu.type = parent ? parent.type : "top";
            
            if(i.sub && i.sub.length){
                if(parent){
                    parent.submenus.push(menu);
                    parent.submenus = parent.submenus.distinctBy(s => s.id || s);
                }

                var promise = i.sub.aggregate(Promise.resolve(), (p, s) => {
                    return p.then(() => {
                        return importMenus(s, menu, menu.index + 1);
                    });
                });

                return promise.then(() => menu.save());
            }else
                return menu.save(() => {
                    if(parent){
                        parent.submenus.push(menu);
                        parent.submenus = parent.submenus.distinctBy(s => s.id || s);
                    }

                    return menu;
                });
        });
}

module.exports = function (done) {
    MenuItem.model.findOne({ href: "/" })
        .exec((err, menu) => {
            if (err)
                return console.log(err, arguments[1]);

            if(!menu){
                menu = new MenuItem.model({href:"/", label:"Home"});
                menu.save();
            }

            var promise = categories.aggregate(Promise.resolve(), (p, a) => {
                return p.then(() => {
                    return importMenus(a, menu);
                });
            });

            promise.then(() => {
                menu.save();
                done();
            });
        });
}