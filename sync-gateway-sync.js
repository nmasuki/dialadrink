function (doc, oldDoc) {
	var owner = oldDoc ? oldDoc.owner : doc.owner;
	var channelNames = ["ch-" + (doc.type || "unknown").toLowerCase()];

	if (owner == 'none') {
		channelNames.push("!");
		channel(channelNames);
	} else if (owner) {
		// Make sure that only the owner of the document can update the document:
		if (doc.owner && owner != doc.owner)
			throw ({
				forbidden: "Cannot change owner for lists."
			});
			
		if(doc.type == "Product" && doc.categories)
			for(var i in doc.categories)
				channelNames.push(doc.categories[i])
		
		channel(channelNames);
		requireUser(owner);
		access(owner, channelNames);
	} else {
	    var ownedTypes = ["WishlistItem", "CartItem"];
	    // Make sure that the owner propery exists:
		if (ownedTypes.indexOf(doc.type) >= 0 || (doc._deleted && oldDoc && ownedTypes.indexOf(oldDoc.type) >= 0)) {
			if (!owner)
				throw ({
					forbidden: "'" + doc.type + "' must have an owner."
				});

			channel(channelNames);
			requireUser(owner);
			access(owner, channelNames);
		} else {
			channel(doc.channels)
		}
	}
}
