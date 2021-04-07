var Sale = require('../helpers/LocalStorage').getInstance("sale");
module.exports = function (done) {
	var sales = Sale.getAll().map(sale => {
		if(sale.products){
			sale.productIds = sale.products.map(p => p._id);
			delete sale.products;
		}

		if(sale.client){
			sale.clientId = sale.client._id;
			delete sale.client;
		}

		return sale;
	});

	Sale.save(sales);
	done();
};