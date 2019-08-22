var keystone = require('keystone');
var Types = keystone.Field.Types;

var Client = new keystone.List('Client', {
    map:{name: 'firstName'},
    defaultSort: '-lastOrderDate',
    autokey: {path: 'key', unique: true, from: '_id'},
});

Client.add({
    phoneNumber: {type: String},
    email: {type: String},

    firstName: {type: String},
    lastName: {type: String},
    gender: {type: String, default:"Undefined"},
    
    city: {type: String, default: 'Nairobi'},
    address: {type: String},
    building: {type: String},
    houseNumber: {type: String},
    clientIps: {type: Types.TextArray, noedit:true},

    orderCount: {type: Number, noedit:true},
    orderValue: {type: Number, noedit:true},

    fcmCode:  {type: String},

    image: {type: Types.CloudinaryImage, folder: "clients"},
    username: {type: String},
    password: {type: String, noedit:true},    
    tempPassword: {
        pwd: {type: String},
        expiryDate: {type: Types.Datetime, default: Date.now}
    },

    registrationDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},
    createdDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},
    modifiedDate: {type: Types.Datetime, index: true, default: Date.now, noedit: true},    
    lastOrderDate: {type: Types.Datetime, index: true, noedit: true}
});

Client.relationship({ref: 'Order', refPath: 'client'});

Client.defaultColumns = 'firstName, lastName, phoneNumber, email, address, orderCount, orderValue, lastOrderDate';

Client.schema.virtual("name").get(function () {
    return ((this.firstName || '')+ ' ' + (this.lastName || '')).trim();
});

Client.schema.virtual("isAppRegistered").get(function () {
    return !!this.password;
});

Client.schema.virtual("name").set(function (name) {
    name = name || "";
    this.firstName = (name.split(' ')[0] || "").trim();
    this.lastName =  (name.split(' ')[1] || "").trim();
});

Client.schema.methods.toAppObject = function(){
    function getUniqueCode(){
        return Buffer.from(this.username + ':' + this.password).toString('base64');
    }

    return {
        userid: this.id,
        username: this.username || this.email.split('@')[0],
        user_unique_code: getUniqueCode(),
        user_email: this.email,
        user_name: this.name,
        user_mobile: this.phoneNumber,
        user_address: this.address,
        user_state :this.city,
        user_city: this.city,
        user_country: this.country,
        user_zipcode: this.zipcode,
        user_image: this.image,
        user_phone_verified: this.isPhoneVerified,
        user_reg_date: this.registrationDate,
        user_status: this.status
    };
};

Client.schema.pre('save', function (next) {
    this.modifiedDate = Date.now();
    this.clientIps = this.clientIps.filter(ip => ip).distinct();
    
    if(this.phoneNumber)
        this.phoneNumber = this.phoneNumber.cleanPhoneNumber();
    
    var findOption = {"$or":[]};
    if(this.phoneNumber) 
        findOption.$or.push({"delivery.phoneNumber": new RegExp(this.phoneNumber.substr(3))});
    
    
    if(this.email){
        var email = this.email || null;
        if(email){
            findOption.$or.push({"delivery.email": new RegExp(username.escapeRegExp(), "i")});
        }
    }

    if(findOption.$or.length){
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

Client.fromAppObject = function(obj, callback){
    return Client.model.findOne({
        $or: [
            {username: obj.username},
            {email: obj.user_email}
        ]
    })
        .exec((err, client) => {
            if(err)
                throw err;
            if(!client)
                client = new Client.model({});

            client.id = userid;
            client.username = username || user_email.split('@')[0];
            client.email = user_email;
            client.name = user_name;
            client.phoneNumber = user_mobile;
            client.address = user_address;
            client.city = user_state;
            client.city = user_city;
            client.country = user_country;
            client.zipcode = user_zipcode;
            client.image = user_image;
            client.isPhoneVerified = user_phone_verified;
            client.registrationDate = user_reg_date;
            client.statu = user_status;                  
            
            if(typeof callback == "function")
                callback(client);
            return client;
        });
}
Client.register();