var crypto = require('crypto');
var SECRET_KEY = process.env.CYBERSOURCE_SECRET_KEY;
var PROFILE_ID = process.env.CYBERSOURCE_PROFILE_ID;
var ACCESS_KEY = process.env.CYBERSOURCE_ACCESS_KEY;
var PAYMENT_URL = process.env.CYBERSOURCE_PAYMENT_URL;
					
var SIGNED_FIELDS = "access_key,profile_id,transaction_uuid,signed_field_names,unsigned_field_names,signed_date_time,locale,transaction_type,reference_number,amount,currency,bill_to_address_line1,bill_to_address_city,bill_to_email,bill_to_surname,bill_to_forename,bill_to_address_country";

function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, 
            v = (c == 'x' ? r : (r & 0x3 | 0x8));
        return v.toString(16);
    });
}

function buildDataToSign(params){
	var signedFieldNames = params.signed_field_names.split(',');
	var dataToSign = signedFieldNames.map(s => `${s}=${params[s] || ''}`);
	return dataToSign.join(',');
}

function signString(str, secretKey){
	return crypto.createHmac('sha256', secretKey).update(str).digest("base64");
}

function signParams(params){
	return signString(buildDataToSign(params), SECRET_KEY);
}

module.exports = {
    getPostData: function(order){
		var data = {
			access_key: ACCESS_KEY,
			profile_id: PROFILE_ID,
			transaction_uuid: uuidv4(),
			signed_field_names: SIGNED_FIELDS,
			unsigned_field_names: "",

			signed_date_time: new Date().toISOString().substr(0, 19) + "Z",
			locale: "en",
			transaction_type: "authorization",
			reference_number: order.orderNumber,
			amount: order.total,
			currency: "KES",

			bill_to_address_line1: order.delivery.address || "Nairobi CBD",
			bill_to_address_city: "Nairobi",
			bill_to_address_country: "KE",
			
			bill_to_email: order.delivery.email || "",
			bill_to_surname: order.delivery.lastName,
			bill_to_forename: order.delivery.firstName
		};

		data.signature = signParams(data);
		data.paymentUrl = PAYMENT_URL;

		return data;
	}
};