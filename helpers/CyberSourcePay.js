var crypto = require('crypto');
var SECRET_KEY = "09520ad791b8459ea884b065a7ab443d4424b665db8d4ee388da81b8ae8caf06d83275e944934d52afe031daa6a0838bd605642d787d486ea2f746b1809f48c6f9e95b2d905049348ff3be44384b5a8ee2720fc798c34c0b830545a4b647cd2422c9be27f7504981879b24a5be6014a4f7a3eac0bd944fd485360f5167293bd9";
var PROFILE_ID = "953529E0-8DB4-4DD1-B32B-FF1A0500DB57";
var ACCESS_KEY = "6cd03850bffa3b0c80310d7d8c600ba0";
					
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

			bill_to_address_city: "Nairobi",
			bill_to_address_country: "KE",
			
			bill_to_email: order.delivery.email || "",
			bill_to_address_line1: order.delivery.address,
			bill_to_surname: order.delivery.lastName,
			bill_to_forename: order.delivery.firstName
		};

		data.signature = signParams(data);
		data.paymentUrl = "https://testsecureacceptance.cybersource.com/pay";//https://testsecureacceptance.cybersource.com/pay

		return data;
	}
};