import { Metadata } from "next";
import Link from "next/link";
import { FiChevronDown, FiPhone, FiMail } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Frequently Asked Questions",
  description: "Find answers to common questions about ordering, delivery, and payments at Dial A Drink Kenya.",
};

const faqs = [
  {
    category: "Ordering",
    questions: [
      {
        q: "How do I place an order?",
        a: "Simply browse our products, add items to your cart, and proceed to checkout. Fill in your delivery details, select your preferred payment method, and confirm your order. You can also call us directly at +254 723 688 108 to place an order over the phone."
      },
      {
        q: "Is there a minimum order amount?",
        a: "There is no minimum order amount. However, orders above KES 3,000 qualify for free delivery within Nairobi."
      },
      {
        q: "Can I modify or cancel my order?",
        a: "You can modify or cancel your order within 10 minutes of placing it by calling us at +254 723 688 108. Once the order is dispatched, cancellation may not be possible."
      },
      {
        q: "Do you offer bulk or corporate orders?",
        a: "Yes! We offer special pricing for bulk and corporate orders. Contact us at order@dialadrinkkenya.com for a custom quote."
      }
    ]
  },
  {
    category: "Delivery",
    questions: [
      {
        q: "What areas do you deliver to?",
        a: "We deliver across Nairobi and surrounding areas including Westlands, Kilimani, Lavington, Karen, Kileleshwa, Parklands, South B/C, and more. We also deliver to Mombasa, Kisumu, and other major cities."
      },
      {
        q: "How long does delivery take?",
        a: "Within Nairobi CBD and nearby areas, delivery typically takes 45 minutes to 2 hours. For areas further out, it may take 2-4 hours depending on traffic and distance."
      },
      {
        q: "What are your delivery hours?",
        a: "We deliver 24 hours a day, 7 days a week, including weekends and public holidays."
      },
      {
        q: "How much does delivery cost?",
        a: "Delivery is FREE for orders above KES 3,000 within Nairobi. For orders below this amount, a delivery fee of KES 200-500 applies depending on your location."
      }
    ]
  },
  {
    category: "Payment",
    questions: [
      {
        q: "What payment methods do you accept?",
        a: "We accept Cash on Delivery, M-Pesa (on delivery or online via PesaPal), and Card payments (swipe on delivery or online via PesaPal)."
      },
      {
        q: "Is it safe to pay online?",
        a: "Yes, our online payments are processed through PesaPal, a secure and trusted payment gateway in Kenya. Your payment information is encrypted and secure."
      },
      {
        q: "Can I get a receipt?",
        a: "Yes, you will receive an email receipt after your order is confirmed. You can also request a printed receipt from our delivery person."
      }
    ]
  },
  {
    category: "Products",
    questions: [
      {
        q: "Are all your products genuine?",
        a: "Absolutely! We source all our products directly from authorized distributors and importers. Every product is 100% genuine and original."
      },
      {
        q: "What if I receive a damaged product?",
        a: "Please inspect your order upon delivery. If any product is damaged, refuse that item and inform the delivery person. Contact us immediately and we'll arrange a replacement."
      },
      {
        q: "Do you sell products to minors?",
        a: "No. In compliance with Kenyan law, we only sell alcohol to persons aged 18 years and above. Our delivery personnel may ask for ID verification."
      }
    ]
  }
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.flatMap((section) =>
    section.questions.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    }))
  ),
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about ordering, delivery, and payments.
            Can&apos;t find what you&apos;re looking for? Contact us directly.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((section) => (
            <div key={section.category} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-teal px-6 py-4">
                <h2 className="text-xl font-bold text-white">{section.category}</h2>
              </div>
              <div className="divide-y">
                {section.questions.map((faq, idx) => (
                  <details key={idx} className="group">
                    <summary className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50">
                      <span className="font-medium text-gray-800 pr-4">{faq.q}</span>
                      <FiChevronDown className="w-5 h-5 text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </summary>
                    <div className="px-6 pb-6 text-gray-600">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact CTA */}
        <div className="mt-12 bg-white rounded-xl shadow-sm p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Still have questions?</h2>
          <p className="text-gray-600 mb-6">Our customer service team is here to help.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="tel:+254723688108"
              className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <FiPhone className="w-5 h-5" />
              Call Us
            </a>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiMail className="w-5 h-5" />
              Contact Form
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
