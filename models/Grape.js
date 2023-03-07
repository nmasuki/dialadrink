var keystone = require('keystone');
const { Relationship } = require('keystone/lib/fieldTypes');
var Types = keystone.Field.Types;

var Grape = new keystone.List('Grape',{
autokey: {from: 'name', path: 'key', unique: true},
});

Grape.add({
    name:{type: String, required: true, initial: true},
    category: {type: Types.Relationship, ref: 'ProductCategory'},
    modifiedDate: {type: Date, default: Date.now},
});

Grape.relationship({ref: 'Product', path: 'product', refPath: 'grape'});
Grape.register();
