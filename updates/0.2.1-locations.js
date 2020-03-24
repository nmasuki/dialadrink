var locationNames = [
	"Kileleshwa", "Parklands", "Westlands", "Ngara",
	"Lavington", "Kilimani", "Milimani", "Hurlingham",
	"South B", "South C", "Nairobi West", "Gachie",
	"Spring Valley", "Nyayo Estate", "Nyari Estate",
	"City Park", "Along Thika Road", "Along Jogoo Road",
	"Along Ngong Road", "Along Waiyaki Way", "Along Kiambu Road",
	"Muthaiga", "Runda", "Loresho", "CBD", "Eastland", "Langata",
	"Kasarani", "Roysambu", "Ruaka", "Madaraka", "Mlolongo"
];

exports.create = {
	Location: locationNames.map(name => {
		return {
			'name': name,
			'city': 'Nairobi',
			'show': true
		};
	}),
};