/**
 * Local Content Optimizer
 * Enhances product descriptions and content with local Nairobi keywords
 */

class LocalContentOptimizer {
    constructor() {
        this.localKeywords = {
            // Location-based
            nairobi: ['Nairobi', 'CBD', 'Central Business District'],
            areas: ['Westlands', 'Karen', 'Kilimani', 'Kileleshwa', 'Lavington', 'Upperhill'],
            
            // Payment methods
            payment: ['M-Pesa', 'cash on delivery', 'mobile money'],
            
            // Local context
            culture: ['Kenyan', 'Kenya', 'East African', 'Swahili'],
            
            // Service context
            delivery: ['home delivery', 'office delivery', 'doorstep delivery', 'same-day delivery'],
            
            // Social context
            occasions: ['house party', 'nyama choma', 'weekend', 'celebration', 'corporate event']
        };
        
        this.productEnhancements = {
            beer: {
                local: 'Popular in Nairobi bars and clubs',
                delivery: 'Perfect for house parties and nyama choma gatherings',
                payment: 'Order online or pay with M-Pesa on delivery'
            },
            wine: {
                local: 'Loved by Nairobi wine enthusiasts in Karen and Lavington',
                delivery: 'Elegant wine delivery to your Nairobi residence',
                payment: 'Premium wines delivered across Nairobi with secure payment'
            },
            whisky: {
                local: 'Premium whisky selection for Nairobi connoisseurs',
                delivery: 'Fast whisky delivery to offices and homes in Nairobi',
                payment: 'Authentic whisky brands with M-Pesa or card payment'
            },
            spirits: {
                local: 'Top spirits brands popular in Nairobi nightlife',
                delivery: 'Quick spirits delivery across all Nairobi neighborhoods',
                payment: 'Quality spirits with flexible payment options'
            }
        };
    }

    // Enhanced product title with local context
    enhanceProductTitle(product) {
        let enhanced = product.name;
        
        // Add delivery context for high-demand items
        if (product.popularity && product.popularity > 100) {
            enhanced += ' - Fast Delivery in Nairobi';
        }
        
        // Add payment context for premium items
        if (product.salePrice > 5000) {
            enhanced += ' | M-Pesa & Card Accepted';
        }
        
        return enhanced;
    }

    // Enhanced product description with local keywords
    enhanceProductDescription(product) {
        let description = product.description || '';
        let category = this.getProductCategory(product);
        let enhancement = this.productEnhancements[category];
        
        if (!enhancement) {
            enhancement = this.productEnhancements.beer; // Default
        }
        
        // Build enhanced description
        let enhancedDescription = description;
        
        // Add local context paragraph
        const localContext = `\n\nDelivered across Nairobi including Westlands, Karen, Kilimani, and CBD. ${enhancement.local} ${enhancement.delivery} ${enhancement.payment}`;
        
        // Add delivery information
        const deliveryInfo = `\n\nFast delivery to your location in Nairobi within 30-60 minutes. Licensed alcohol retailer with age verification. Order online at dialadrinkkenya.com or call +254723688108.`;
        
        // Add payment options
        const paymentInfo = `\n\nFlexible payment: M-Pesa (most popular), cash on delivery, Visa, or Mastercard. Free delivery for orders above KSh 2,000 across Nairobi.`;
        
        enhancedDescription += localContext + deliveryInfo + paymentInfo;
        
        return enhancedDescription;
    }

    // Get product category for enhancement
    getProductCategory(product) {
        if (!product.category) return 'beer';
        
        const categoryName = product.category.name ? product.category.name.toLowerCase() : '';
        
        if (categoryName.includes('beer')) return 'beer';
        if (categoryName.includes('wine')) return 'wine';
        if (categoryName.includes('whisky') || categoryName.includes('whiskey')) return 'whisky';
        if (categoryName.includes('vodka') || categoryName.includes('gin') || categoryName.includes('rum')) return 'spirits';
        
        return 'beer'; // Default
    }

    // Generate local keywords for SEO
    generateLocalSEOKeywords(product) {
        let keywords = [];
        let category = this.getProductCategory(product);
        
        // Product-specific keywords
        keywords.push(`${product.name} delivery Nairobi`);
        keywords.push(`buy ${product.name} online Kenya`);
        keywords.push(`${product.name} M-Pesa payment`);
        
        // Category keywords
        keywords.push(`${category} delivery Nairobi`);
        keywords.push(`${category} online shopping Kenya`);
        keywords.push(`best ${category} prices Nairobi`);
        
        // Area-specific keywords
        this.localKeywords.areas.forEach(area => {
            keywords.push(`${category} delivery ${area}`);
        });
        
        // Service keywords
        keywords.push(`alcohol delivery Nairobi`);
        keywords.push(`licensed alcohol retailer Kenya`);
        keywords.push(`M-Pesa alcohol payment`);
        keywords.push(`same day alcohol delivery`);
        
        return keywords.join(', ');
    }

    // Generate local meta description
    generateLocalMetaDescription(product) {
        let category = this.getProductCategory(product);
        
        return `Order ${product.name} online with fast delivery across Nairobi. ${this.productEnhancements[category].local} Pay with M-Pesa, cash, or card. Licensed retailer with age verification. Call +254723688108 or order at dialadrinkkenya.com.`;
    }

    // Enhance single product with local content
    enhanceProductData(product) {
        try {
            const enhancements = {
                enhancedTitle: this.enhanceProductTitle(product),
                enhancedDescription: this.enhanceProductDescription(product),
                localKeywords: this.generateLocalSEOKeywords(product),
                localMetaDescription: this.generateLocalMetaDescription(product)
            };
            
            return enhancements;
        } catch (error) {
            console.error('Error enhancing product:', error);
            return null;
        }
    }

    // Generate sample enhanced products for demonstration
    generateSampleEnhancements() {
        const sampleProducts = [
            {
                name: 'Tusker Lager Beer 500ml',
                description: 'Premium Kenyan lager beer with a crisp, refreshing taste.',
                category: { name: 'Beer' },
                salePrice: 250,
                popularity: 150
            },
            {
                name: 'Jameson Irish Whiskey 750ml',
                description: 'Smooth Irish whiskey with notes of vanilla and honey.',
                category: { name: 'Whisky' },
                salePrice: 5500,
                popularity: 80
            },
            {
                name: 'Villa Maria Sauvignon Blanc 750ml',
                description: 'Crisp white wine with tropical fruit flavors.',
                category: { name: 'Wine' },
                salePrice: 3200,
                popularity: 60
            }
        ];
        
        return sampleProducts.map(product => ({
            originalTitle: product.name,
            originalDescription: product.description,
            ...this.enhanceProductData(product)
        }));
    }

    // Generate neighborhood-specific content
    generateNeighborhoodContent(area) {
        const areaData = {
            westlands: {
                context: 'Popular among corporate professionals and hotel guests',
                landmarks: 'Sarit Centre, Westgate Mall, ABC Place',
                specialty: 'Office deliveries and corporate events'
            },
            karen: {
                context: 'Preferred by upmarket residents and luxury estate dwellers',
                landmarks: 'Village Market, Karen Country Club, Galleria Mall',
                specialty: 'Premium wines and luxury spirits'
            },
            kilimani: {
                context: 'Trendy neighborhood with young professionals and students',
                landmarks: 'Yaya Centre, The Mall, Lenana Road',
                specialty: 'Apartment deliveries and house parties'
            },
            kileleshwa: {
                context: 'Family-friendly residential area with established homes',
                landmarks: 'Kasuku Centre, Kileleshwa Shopping Centre',
                specialty: 'Family gatherings and barbecue parties'
            }
        };
        
        return areaData[area] || areaData.westlands;
    }
}

module.exports = LocalContentOptimizer;