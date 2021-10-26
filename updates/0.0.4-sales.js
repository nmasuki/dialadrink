var Sale = require('../helpers/LocalStorage').getInstance("sale");

function getAppPaymentMethod(method){
	method = method || "";
    //Cash,MPESA,PesaPal,COOP,Swipe On Delivery,Credit
    var mapping = {
        "Cash": ["Cash", "Cash on Delivery"],
        "MPESA": ["MPESA", "MPESA on Delivery"],
        "PesaPal": ["PesaPal"],
        "COOP":["CyberSource"],
    };

    for(var i in mapping){
        var match = mapping[i].find(x => x.toLowerCase() == method.toLowerCase());
        if(match)
            return i;
    }

    return method.split(' ')[0];
}

module.exports = function (done) {
	var sales = Sale.getAll().map(sale => {
		if(sale.products && sale.products.some(p => p)){
			sale.productIds = sale.products.filter(p => p).map(p => p._id).concat(sale.productIds || []);
			sale.products = null;
		}

		if(sale.client && sale.client._id){
			sale.clientId = sale.client._id;
			sale.client = null;
		}

		sale.paymentMethod = getAppPaymentMethod(sale.paymentMethod);
		if(sale.description)
			sale.mode = "Online";
			
		return sale;
	});

	Sale.save(sales);
	done();
};