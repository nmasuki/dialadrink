var keystone = require('keystone');
var Location = keystone.list('Location');

exports = module.exports = function (done) {
	Location.model.find({})
		.exec(function (err, locations) {
			var index = -1;
			(function updateLocation() {
				console.log(`Extracting location from order ${index + 1}/${locations.length}`);
				var location = locations[++index];
				if (location)
					return location.save(updateLocation);
				done();
			})();
		});
};