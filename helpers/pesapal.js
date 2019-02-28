
var najax = require('najax');
var Bitly = require('bitly');
var PesaPal = require('pesapaljs').init({
	key: process.env.PESAPAL_KEY,
	secret: process.env.PESAPAL_SECRET,
	debug: process.env.NODE_ENV != "production" // false in production!
});

function shortenUrlBitly(longUrl, next){
    var bitly = new Bitly.BitlyClient(process.env.BITLY_ACCESS_TOKEN, {});
    bitly.shorten(longUrl).then(function(result){
		console.log("URL shortened: ", result.url, longUrl);
        next(null, result.url);
    })
    .catch(function(error) {
		console.error("Error while doing URL shortening..", error);
        next(error);
    });
}

function shoternUrlGoogle(longUrl, next) {
	var googl = require('goo.gl');

	// Set a developer key (_required by Google_; see http://goo.gl/4DvFk for more info.)
	googl.setKey(process.env.GOOGLE_API_KEY1);

	// Shorten a long url and output the result
	googl.shorten(longUrl)
		.then(function (shortUrl) {
			next(null, shortUrl);
		})
		.catch(function (err) {
			next(err.message);
		});
}

function shoternUrlGoogleOld(longUrl, next) {
	var url = `https://www.googleapis.com/urlshortener/v1/url?key=${process.env.GOOGLE_API_KEY1}`;
	najax.post({
		url: url,
		contentType: "application/json; charset=utf-8",
		data: {
			longUrl: longUrl
		},
		success: function (res) {
			if (typeof next == "function")
				next(null, res);
		},
		error: function (err) {
			next(err, url);
		}
	});
}

function shoternUrl24h(longUrl, next) {
	var url = `https://4h.net/api.php?url=${longUrl}`;
	najax.get({
		url: url,
		success: function (res) {
			if (typeof next == "function")
				next(null, res);
		},
		error: function (err) {
			next(err, url);
		}
	});
}

function getPasaPalUrl(order, host) {
	var customer = new PesaPal.Customer(order.delivery.email || process.env.EMAIL_FROM, order.delivery.phoneNumber);
	customer.firstName = order.delivery.firstName;
	customer.lastName = order.delivery.lastName;

	var _order = new PesaPal.Order(
		order.orderNumber,
		customer, 'Order #' + order.orderNumber,
		order.payment.amount,
		"KES", "MERCHANT"
	);

	// Redirect user to PesaPal
	var url = PesaPal.getPaymentURL(_order, host + '/pesapal/' + order.orderNumber);
	// send it to an iframe ?
	return url;
}

function getPasaPalUrlOld(order, host) {
	var pesapal = require('pesapal')({
		consumerKey: process.env.PESAPAL_KEY,
		consumerSecret: process.env.PESAPAL_SECRET,
		testing: process.env.NODE_ENV != "production",
	});
	// post a direct order	   
	var postParams = {
		'oauth_callback': host + '/pesapal/' + order.orderNumber
	};

	var requestData = {
		'Type': 'MERCHANT',
		'Amount': order.payment.amount,
		'Reference': order.orderNumber,
		'Description': 'Order #' + order.orderNumber,
		'PhoneNumber': order.delivery ? order.delivery.phoneNumber : ""
	};

	var url = pesapal.postDirectOrder(postParams, requestData);
	return url;
}

module.exports = {
    getPasaPalUrl: getPasaPalUrl,
    shoternUrl: shortenUrlBitly
}