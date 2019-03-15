var keystone = require('keystone');
var Types = keystone.Field.Types;

var Client = new keystone.List('Client', {
    map:{name: 'firstName'},
    defaultSort: '-lastOrderDate',
    autokey: {path: 'key', unique: true, from: '_id'},
});

Client.add({
    firstName: {type: String},
    lastName: {type: String},
    phoneNumber: {type: String},
    email: {type: String},
    address: {type: String},
    building: {type: String},
    houseNumber: {type: String},
    clientIps: {type: Types.TextArray},

    orderCount: {type: Number, noedit:true},
    orderValue: {type: Number, noedit:true},

    createdDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},
    modifiedDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},    
    lastOrderDate: {type: Types.Datetime, index: true, noedit: true}
});

Client.relationship({ref: 'Order', refPath: 'client'});

Client.defaultColumns = 'firstName, lastName, phoneNumber, email, address, orderCount, orderValue,lastOrderDate';

Client.schema.virtual("fullName").get(function () {
    return (this.firstName + ' ' + this.lastName || '').trim();
});

Client.schema.pre('save', function (next) {
    this.modifiedDate = Date.now();
    if(this.phoneNumber && this.phoneNumber.startsWith('0'))
        this.phoneNumber = '254' + this.phoneNumber.trimLeft('0');

    
    var findOption = {"$or":[]};
    if(this.phoneNumber) {
        findOption["$or"].push({"delivery.phoneNumber": new RegExp(this.phoneNumber.substr(3))});
    }else{
        var email = this.email || null;
        if(email){
            var username = email.split('@')[0];
            if(username)                    
                findOption["$or"].push({"delivery.email": new RegExp("^" + username)});
        }
    }

    if(findOption["$or"].length){
        var client = this;
        keystone.list("Order").model.find(findOption)
            .sort({orderDate: -1})
            .deepPopulate('cart.product.priceOptions.option')   
            .exec((err, orders)=>{
                if(err)
                    return next(err);

                client.orderCount = orders.length;
                client.orderValue = orders.sum(order=>order.total);
                client.lastOrderDate = orders.max(order=>order.orderDate);

                console.log(client.fullName, client.orderCount, client.orderValue);  
                next();
            });
    }else{
        console.log("This should not be hit!!")
        next();
    }
});

Client.register();