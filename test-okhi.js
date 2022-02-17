
var najax = require('najax');

var isProduction = process.env.NODE_ENV == "production";
var url = isProduction
    ? "https://api.okhi.io/v5/interactions"
    : "https://sandbox-api.okhi.io/v5/interactions";

var okHiServerKey = isProduction
    ? '89f731f0-eff7-4afb-8eb8-3d72f05e2793'
    : '4ade6dc4-0933-460d-8f31-d1f13183094b'

var okhiBranchId = isProduction
    ? 'BKGFF8S4Zp'
    : 'jopz3CCZWQ'

var data = {
    "user": {
        "phone": "+254720805835",
        "first_name": "Nelson",
        "last_name": "Masuki"
    },
    "value": 3499,
    "id": "73861834",
    "use_case": "e-commerce",
    "location_id": "T8XGEhlCTB",
    "location": {
        "lon": 36.8672768,
        "lat": -1.291059199999968,
        "id": "T8XGEhlCTB",
        "url": "https://sandbox.okhi.me/T8XGEhlCTB",
        "title": "Ruiruaka Crescent",
        "street_name": "ruiruaka crescent"
    },
    "properties": {
        "send_to_queue": true,
        "payment_method": "cash",
        "brand": "dialadrink",
        "location": "cbd",
        "currency": "KES",
        "basket": [{
                "sku": "5b48e934bdd218570be620e3",
                "value": 3499,
                "name": "Rosso Nobile ",
                "description": "<p><a title=\"rosso nobile wine kenya\" href=\"https://www.dialadrinkkenya.com/product/rosso-nobile\" target=\"_blank\" rel=\"noopener\">Rosso Nobile Al Cioccolata</a> is a <a title=\"rosso nobile\" href=\"https://www.dialadrinkkenya.com/product/rosso-nobile\" target=\"_blank\" rel=\"noopener\">chocolate flavoured wine</a> from Germany.Its a red wine infused with chocolate aromas to give it a smooth taste.It can be taken on its own or can be drank along with dark chocolates.</p>\r\n<p><a title=\"Buy rosso nobile kenya\" href=\"https://www.dialadrinkkenya.com/product/bianco-nobile\" target=\"_blank\" rel=\"noopener\">Rosso Nobile</a> is available at <a title=\"wine delivery kenya\" href=\"https://www.dialadrinkkenya.com/product/bianco-nobile\" target=\"_blank\" rel=\"noopener\">Dial A Drink Kenya</a> in a tall slender 750ml bottle. Rosso Nobile has an alcohol percentage of 10.0%.</p>\r\n<p>It also has its white variant,<a title=\"bianco nobile\" href=\"https://www.dialadrinkkenya.com/product/bianco-nobile\" target=\"_blank\" rel=\"noopener\">Bianco Nobile</a>,this is sweet white wine infused with vanilla flavours. The wine producing company also produces another one <a title=\"chocolate flavoured wine\" href=\"https://www.dialadrinkkenya.com/product/crema-nobile-al-cioccolata\" target=\"_blank\" rel=\"noopener\">Crema Nobile</a>,this is a cream infused with <a title=\"buy alcohol online in kenya\" href=\"https://www.dialadrinkkenya.com/product/crema-nobile-al-cioccolata\" target=\"_blank\" rel=\"noopener\">chocolate flavoured wine</a>.</p>\r\n<p><a title=\"wine delivery kenya\" href=\"https://www.dialadrinkkenya.com/product/rosso-nobile\" target=\"_blank\" rel=\"noopener\">Buy Rosso Nobile Wine at Ksh 1700</a> from Dial A Drink Kenya and our fast and free* wine delivery services within Nairobi and its environs.</p>\r\n<p><a title=\"alcohol delivery\" href=\"https://www.dialadrinkkenya.com/category/wine\" target=\"_blank\" rel=\"noopener\">Dial A Drink Kenya</a> offers the best <a title=\"drinks delivery kenya\" href=\"https://www.dialadrinkkenya.com\" target=\"_blank\" rel=\"noopener\">price in kenya for rosso nobile al cioccolata wine</a>.</p>",
                "category": "Wine",
                "quantity": 1
            }
        ],
        "shipping": {
            "cost": 0,
            "class": "Flat rate",
            "expectedDeliveryDate": "2022-02-17T09:01:49.786Z"
        }
    }
};


var key = "Token " + Buffer.from(okhiBranchId+":"+okHiServerKey).toString('base64');

console.log("Calling OKHI api:", url);
najax.post({
    url: url,
    contentType: "application/json; charset=utf-8",
    headers: { "Authorization": key },
    data: data,
    rejectUnauthorized: false,
    requestCert: true,
    agent: false,
    success: function (res) {
        console.log("OKHI api res:", res);
        //if (typeof next == "function")
        //    next(null, res);
    },
    error: function (xhr, status, err) {
        console.error("Error calling OKHI api!", status, xhr.responseText, err);
        //if (typeof next == "function")
        //    next(err, url);
    }
});