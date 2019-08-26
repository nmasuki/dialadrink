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
    gender: {type: String},
    
    city: {type: String, default: 'Nairobi'},
    address: {type: String},
    building: {type: String},
    houseNumber: {type: String},
    clientIps: {type: Types.TextArray, noedit:true},

    orderCount: {type: Number, noedit:true},
    orderValue: {type: Number, noedit:true},

    fcmCodes: {type: Types.TextArray, noedit:true},

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
Client.schema.virtual("isAppRegistered").get(function () {
    return !!this.password;
});

Client.schema.virtual("name")
    .get(() =>  ((this.firstName || '' )+ ' ' + (this.lastName || '')).trim())
    .set(function (name) {
        name = name || "";
        this.firstName = (name.split(' ')[0] || "").trim();
        this.lastName =  (name.split(' ')[1] || "").trim();
    });

Client.schema.methods.toAppObject = function(){
    function getUniqueCode(){
        return Buffer.from(this.username + ':' + this.password + ':' + new Date().getTime()).toString('hex');
    }

    return {
        userid: this.id || '',
        username: this.username || this.email.split('@')[0] || 'Guest',
        user_unique_code: getUniqueCode(),
        user_password: this.password || '',
        user_email: this.email || '',
        user_name: this.name || '',
        user_mobile: this.phoneNumber || '',
        user_address: this.address || '',
        user_state :this.city || '',
        user_city: this.city || '',
        user_country: this.country || '',
        user_zipcode: this.zipcode || '',
        user_image: this.image || '',
        user_phone_verified: this.isPhoneVerified || '',
        user_reg_date: this.registrationDate || '',
        user_status: this.status || ''
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
        
    if(this.email)
        findOption.$or.push({"delivery.email": new RegExp(this.email.escapeRegExp(), "i")});        
    
    if(findOption.$or.length){
        var client = this;
        keystone.list("Order").model.find(findOption)
            .sort({orderDate: -1})
            .deepPopulate('cart.product.priceOptions.option')   
            .exec((err, orders)=>{
                if(err)
                    return next(err);

                client.orderCount = orders.length;
                client.orderValue = orders.sum(order => order.total);
                client.lastOrderDate = orders.max(order => order.orderDate);
                client.avgOrderValue = orders.avg(order => order.total);

                console.log("Saving client details!", client.name, client.orderCount, client.orderValue);  
                next();
            });
    }else{
        console.error("This should never be hit!!");
        next();
    }
});

Client.fromAppObject = function(obj, callback){
    return Client.model.findOne({
        $or: [
            {phoneNumber: (obj.mobile || "").cleanPhoneNumber()},
            {_id: obj.userid}
        ]
    })
        .exec((err, client) => {
            if(err)
                throw err;
            
            if(!client && obj.createNew)
                client = new Client.model({});

            if(!client)
                throw "User not found!";

            if(obj.userid)
                client.id = obj.userid;
            if(obj.username)
                client.username = client.username;
            if(obj.user_email)
                client.email = obj.user_email;
            if(obj.user_name)
                client.name = obj.user_name;
            if(obj.user_mobile)
                client.phoneNumber = obj.user_mobile;
            if(obj.user_address)
                client.address = obj.user_address;
            if(obj.user_state)
                client.city = obj.user_state;
            if(obj.user_city)
                client.city = obj.user_city;
            if(obj.user_country)
                client.country = obj.user_country;
            if(obj.user_zipcode)
                client.zipcode = obj.user_zipcode;
            if(obj.user_image)
                client.image = obj.user_image;
            if(obj.user_phone_verified)
                client.isPhoneVerified = obj.user_phone_verified;
            if(obj.user_reg_date)
                client.registrationDate = obj.user_reg_date;
            if(obj.user_status)
                client.status = obj.user_status;                  
            
            if(typeof callback == "function")
                callback(null, client);

            return client;
        });
}
Client.register();