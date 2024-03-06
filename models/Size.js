var keystone = require('keystone');
const { Relationship } = require('keystone/lib/fieldTypes');
var Types = keystone.Field.Types;

var Taste = new keystone.List('Size',{
autokey: {from: 'name', path: 'key', unique: true},
});

Taste.add({
    name:{type: String, required: true, initial: true},
    modifiedDate: {type: Date, default: Date.now},
});

Taste.schema.pre('save', function (next) {
    this.modifiedDate = new Date();
    next();
});

Taste.relationship({ref: 'Product', path: 'product', refPath: 'size'});
Taste.register();
