const keystone = require('keystone');

exports = module.exports = function (req, res) {
    const view = new keystone.View(req, res);
    const locals = res.locals;
    
    // Set page data
    locals.section = 'faq';
    locals.pageTitle = 'Frequently Asked Questions | Dial A Drink Kenya';
    locals.metaDescription = 'Get answers to common questions about alcohol delivery in Nairobi. Learn about delivery times, payment methods, M-Pesa, age verification, and more.';
    
    // FAQ data organized by category
    locals.faqCategories = [
        {
            name: 'Delivery & Service Areas',
            icon: '🚚',
            faqs: [
                {
                    question: 'Which areas in Nairobi do you deliver to?',
                    answer: 'We deliver alcohol across Nairobi including Westlands, Karen, Kilimani, Kileleshwa, Lavington, Upperhill, Runda, Gigiri, Muthaiga, Parklands, Hurlingham, Riverside, Spring Valley, and Loresho. Call +254723688108 to confirm delivery to your specific location.'
                },
                {
                    question: 'How long does alcohol delivery take in Nairobi?',
                    answer: 'Delivery times vary by location: Central Nairobi (25-40 minutes), Westlands/Kilimani (30-45 minutes), Karen/Lavington (45-60 minutes). We provide real-time tracking for all orders.'
                },
                {
                    question: 'Do you charge delivery fees in Nairobi?',
                    answer: 'Free delivery for orders above KSh 2,000 anywhere in Nairobi. Orders under KSh 2,000 have a small delivery fee of KSh 200-300 depending on distance.'
                },
                {
                    question: 'Can I track my alcohol delivery order?',
                    answer: 'Yes! You receive SMS updates and can track your order in real-time. Our delivery team will call 10 minutes before arrival.'
                }
            ]
        },
        {
            name: 'Payment Methods',
            icon: '💳',
            faqs: [
                {
                    question: 'Do you accept M-Pesa for alcohol orders?',
                    answer: 'Yes! M-Pesa is our most popular payment method. Simply place your order and pay via M-Pesa. We also accept cash on delivery, Visa, and Mastercard.'
                },
                {
                    question: 'Can I pay cash on delivery for alcohol?',
                    answer: 'Absolutely! Cash on delivery is available for all orders. Have exact change ready as our delivery drivers carry limited change.'
                },
                {
                    question: 'Are online card payments secure?',
                    answer: 'Yes, we use secure payment gateways for all card transactions. Your payment information is encrypted and never stored on our servers.'
                },
                {
                    question: 'Can I split payment between M-Pesa and cash?',
                    answer: 'Currently, we accept one payment method per order. You can choose M-Pesa, cash, or card for each complete order.'
                }
            ]
        },
        {
            name: 'Products & Pricing',
            icon: '🍺',
            faqs: [
                {
                    question: 'What types of alcohol do you deliver in Kenya?',
                    answer: 'We deliver beer (Tusker, Guinness, Corona), wines (red, white, rosé), whisky (Jameson, Jack Daniels, local brands), vodka, gin, rum, and local spirits. All products are from licensed distributors.'
                },
                {
                    question: 'Are your alcohol prices competitive in Nairobi?',
                    answer: 'Yes! Our prices are competitive with local bars and shops. We often have special offers and bulk discounts. Check our website for current promotions.'
                },
                {
                    question: 'Do you have minimum order requirements?',
                    answer: 'No minimum order required, but orders above KSh 2,000 qualify for free delivery across Nairobi.'
                },
                {
                    question: 'Can I return alcohol if I change my mind?',
                    answer: 'Due to Kenyan alcohol regulations, we cannot accept returns of alcohol products. Please review your order carefully before confirming.'
                }
            ]
        },
        {
            name: 'Age Verification & Legal',
            icon: '🆔',
            faqs: [
                {
                    question: 'Do you verify age for alcohol delivery in Kenya?',
                    answer: 'Yes, age verification is mandatory. You must be 18+ to order alcohol in Kenya. Our delivery team will check ID before handing over any alcohol order.'
                },
                {
                    question: 'What ID do you accept for age verification?',
                    answer: 'We accept Kenyan National ID, passport, or valid driver\'s license. The person receiving the order must present valid ID showing they are 18 or older.'
                },
                {
                    question: 'Are you a licensed alcohol retailer in Kenya?',
                    answer: 'Yes, Dial A Drink Kenya is a fully licensed alcohol retailer compliant with all Kenyan alcohol distribution laws and regulations.'
                },
                {
                    question: 'What if someone under 18 tries to receive the order?',
                    answer: 'Our delivery driver will not hand over the order and will return the alcohol to our warehouse. A full refund will be processed within 2-3 business days.'
                }
            ]
        },
        {
            name: 'Ordering Process',
            icon: '📱',
            faqs: [
                {
                    question: 'How do I place an alcohol order online?',
                    answer: 'Visit dialadrinkkenya.com, browse products, add to cart, enter your Nairobi delivery address, choose payment method (M-Pesa, cash, or card), and confirm. You\'ll receive SMS confirmation immediately.'
                },
                {
                    question: 'Can I order alcohol by phone in Nairobi?',
                    answer: 'Yes! Call +254723688108 to place orders by phone. Our team can help you choose products and arrange delivery anywhere in Nairobi.'
                },
                {
                    question: 'What information do I need to provide when ordering?',
                    answer: 'Provide your full name, phone number, complete delivery address in Nairobi, and preferred payment method. Age verification will be done on delivery.'
                },
                {
                    question: 'Can I modify my order after placing it?',
                    answer: 'You can modify orders within 10 minutes of placing them by calling +254723688108. After preparation begins, changes may not be possible.'
                }
            ]
        },
        {
            name: 'Special Services',
            icon: '🎉',
            faqs: [
                {
                    question: 'Do you cater for events and parties in Nairobi?',
                    answer: 'Yes! We offer bulk orders for events, parties, and corporate functions across Nairobi. Contact us for special pricing on large orders.'
                },
                {
                    question: 'Can you deliver alcohol for corporate events?',
                    answer: 'Absolutely! We serve many corporate clients in Nairobi\'s business districts. We can provide invoicing and delivery to office locations during business hours.'
                },
                {
                    question: 'Do you offer gift wrapping for alcohol?',
                    answer: 'Yes, we offer gift wrapping services for special occasions. Add a note during checkout or mention when calling +254723688108.'
                },
                {
                    question: 'Can I schedule alcohol delivery for later?',
                    answer: 'Yes, you can schedule deliveries up to 7 days in advance. Great for parties, events, or ensuring delivery when you\'re home.'
                }
            ]
        }
    ];
    
    // Local SEO structured data
    locals.faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": []
    };
    
    // Build FAQ schema from data
    locals.faqCategories.forEach(category => {
        category.faqs.forEach(faq => {
            locals.faqSchema.mainEntity.push({
                "@type": "Question",
                "name": faq.question,
                "acceptedAnswer": {
                    "@type": "Answer",
                    "text": faq.answer
                }
            });
        });
    });
    
    // Render the view
    view.render('faq');
};