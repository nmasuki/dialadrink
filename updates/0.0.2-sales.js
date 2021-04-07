var Sale = require('../helpers/LocalStorage').getInstance("sale");
module.exports = function (done) {
	var sales = Sale.getAll().map(sale => {
		if(sale.products){
			sale.productIds = sale.products.map(p => p._id);
			sale.products = null;
		}

		if(sale.client){
			sale.clientId = sale.client._id;
			sale.client = null;
		}

		return sale;
	});

	Sale.save(sales);
	done();
};