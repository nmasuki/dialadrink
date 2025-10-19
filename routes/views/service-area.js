const keystone = require('keystone');
const QueryOptimizer = require('../../helpers/QueryOptimizer');

// Service Area Data for Nairobi
const serviceAreas = {
    westlands: {
        name: 'Westlands',
        description: 'Premium alcohol delivery to Westlands, Nairobi. Fast service to offices, hotels, and residential areas.',
        landmarks: ['Sarit Centre', 'Westgate Mall', 'ABC Place', 'Chiromo'],
        deliveryTime: '30-45 minutes',
        popular: ['Corporate events', 'Hotel deliveries', 'Residential orders']
    },
    karen: {
        name: 'Karen',
        description: 'Luxury alcohol delivery to Karen estates. Premium wines, whisky, and spirits delivered to your doorstep.',
        landmarks: ['Karen Country Club', 'Village Market', 'Galleria Mall'],
        deliveryTime: '45-60 minutes',
        popular: ['Premium wines', 'Luxury spirits', 'House parties']
    },
    kilimani: {
        name: 'Kilimani',
        description: 'Fast alcohol delivery to Kilimani apartments and offices. Beer, wine, and spirits with M-Pesa payment.',
        landmarks: ['Yaya Centre', 'The Mall', 'Lenana Road'],
        deliveryTime: '30-45 minutes',
        popular: ['Apartment deliveries', 'Office parties', 'Weekend orders']
    },
    kileleshwa: {
        name: 'Kileleshwa',
        description: 'Reliable alcohol delivery to Kileleshwa estates. Quality drinks delivered fast to residential areas.',
        landmarks: ['Kasuku Centre', 'Kileleshwa Shopping Centre'],
        deliveryTime: '35-50 minutes',
        popular: ['Home deliveries', 'Family gatherings', 'BBQ parties']
    },
    lavington: {
        name: 'Lavington',
        description: 'Premium alcohol delivery to Lavington. Serving upmarket residential areas with quality service.',
        landmarks: ['Lavington Mall', 'Valley Arcade'],
        deliveryTime: '40-55 minutes',
        popular: ['Premium brands', 'Home entertainment', 'Special occasions']
    },
    upperhill: {
        name: 'Upperhill',
        description: 'Corporate alcohol delivery to Upperhill offices and residential towers. Professional service guaranteed.',
        landmarks: ['UAP Tower', 'CBA Towers', 'Britam Tower'],
        deliveryTime: '25-40 minutes',
        popular: ['Corporate events', 'High-rise deliveries', 'Business lunches']
    }
};

exports = module.exports = function (req, res) {
    const view = new keystone.View(req, res);
    const locals = res.locals;
    
    // Get the area from URL parameter
    const areaSlug = req.params.area;
    const areaData = serviceAreas[areaSlug];
    
    if (!areaData) {
        return res.status(404).render('errors/404');
    }
    
    // Set page data
    locals.section = 'delivery';
    locals.areaData = areaData;
    locals.areaSlug = areaSlug;
    
    // SEO optimizations for local area
    locals.pageTitle = `Alcohol Delivery in ${areaData.name} | Dial A Drink Kenya`;
    locals.metaDescription = `Fast alcohol delivery to ${areaData.name}, Nairobi. Order beer, wine, whisky & spirits online. ${areaData.deliveryTime} delivery time. M-Pesa, cash & card accepted.`;
    locals.canonicalUrl = `https://www.dialadrinkkenya.com/delivery/${areaSlug}`;
    
    // Local business structured data
    locals.localBusiness = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "Dial A Drink Kenya",
        "description": areaData.description,
        "serviceArea": {
            "@type": "Place",
            "name": `${areaData.name}, Nairobi, Kenya`
        },
        "areaServed": areaData.name,
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": `Alcohol Delivery ${areaData.name}`,
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Product",
                        "name": "Beer Delivery"
                    }
                },
                {
                    "@type": "Offer", 
                    "itemOffered": {
                        "@type": "Product",
                        "name": "Wine Delivery"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "Product", 
                        "name": "Whisky & Spirits Delivery"
                    }
                }
            ]
        },
        "telephone": "+254723688108",
        "url": `https://www.dialadrinkkenya.com/delivery/${areaSlug}`,
        "deliveryLeadTime": areaData.deliveryTime
    };
    
    // Get popular products for this area
    view.on('init', function (next) {
        QueryOptimizer.getPopularProducts(20, (err, products) => {
            if (err) {
                console.error('Error fetching popular products:', err);
                locals.products = [];
            } else {
                locals.products = products || [];
            }
            next();
        });
    });
    
    // Get categories for navigation
    view.on('init', function (next) {
        QueryOptimizer.getCategoriesWithProducts((err, categories) => {
            if (err) {
                console.error('Error fetching categories:', err);
                locals.categories = [];
            } else {
                locals.categories = categories || [];
            }
            next();
        });
    });
    
    // Render the view
    view.render('service-areas/area-landing', {
        pageTitle: locals.pageTitle,
        metaDescription: locals.metaDescription
    });
};