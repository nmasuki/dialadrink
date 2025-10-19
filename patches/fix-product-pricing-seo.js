/**
 * SEO Fix: Product Pricing Consistency
 * This patch ensures products display a single, consistent price for SEO compliance
 */

// Add this method to Product.js schema
Product.schema.virtual('seoPrice').get(function () {
    // Return the most relevant single price for SEO
    const defaultOption = this.defaultOption || this.priceOptions.first() || {};
    return {
        price: defaultOption.offerPrice > 0 && defaultOption.offerPrice < defaultOption.price 
            ? defaultOption.offerPrice 
            : defaultOption.price,
        currency: (defaultOption.currency || "KES").replace('Ksh', "KES"),
        originalPrice: defaultOption.price,
        discount: defaultOption.offerPrice > 0 && defaultOption.offerPrice < defaultOption.price 
            ? Math.round(100 * (defaultOption.price - defaultOption.offerPrice) / defaultOption.price)
            : null
    };
});

// Update toAppObject method for consistent API responses
Product.schema.methods.toSEOObject = function () {
    const seoPrice = this.seoPrice;
    
    return {
        id: this.id,
        name: this.name,
        url: [keystone.get('url'), this.href].map(p => p.trim('/')).join('/'),
        price: seoPrice.price,
        currency: seoPrice.currency,
        availability: this.inStock ? 'InStock' : 'OutOfStock',
        condition: 'NewCondition',
        category: this.category ? this.category.name : null,
        brand: this.brand ? this.brand.name : null,
        image: this.image ? cloudinary.url(this.image.public_id, {
            secure: true,
            fetch_format: "auto",
            transformation: [{ width: 400, height: 400, crop: "fill" }]
        }) : null,
        description: this.description ? this.description.replace(/<[^>]*>/g, '').substring(0, 160) : null
    };
};

module.exports = {
    // Utility function to ensure price consistency
    ensurePriceConsistency: function(product) {
        if (!product.priceOptions || product.priceOptions.length === 0) {
            return product;
        }

        // Find the primary price option (lowest price or default)
        const primaryOption = product.priceOptions
            .filter(opt => opt.inStock)
            .sort((a, b) => (a.offerPrice || a.price) - (b.offerPrice || b.price))[0] 
            || product.priceOptions[0];

        // Set consistent pricing fields
        product.price = primaryOption.price;
        product.offerPrice = primaryOption.offerPrice;
        product.currency = primaryOption.currency;
        product.quantity = primaryOption.option?.quantity;

        return product;
    }
};