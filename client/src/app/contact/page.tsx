import { Metadata } from "next";
import { FiPhone, FiMail, FiMapPin, FiClock } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Dial A Drink Kenya. Call +254 723 688 108, WhatsApp us, or send a message. We deliver alcohol across Nairobi daily 10AM-10PM.",
  alternates: {
    canonical: "/contact",
  },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  mainEntity: {
    "@type": "Organization",
    name: "Dial A Drink Kenya",
    telephone: "+254723688108",
    email: "order@dialadrinkkenya.com",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+254723688108",
      contactType: "customer service",
      areaServed: "KE",
      availableLanguage: ["English", "Swahili"],
    },
  },
};

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Contact Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Have a question, feedback, or need assistance? We&apos;re here to help!
            Reach out to us through any of the channels below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Contact */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6">Quick Contact</h2>

              <div className="space-y-4">
                <a href="tel:+254723688108" className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiPhone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Phone</p>
                    <p className="text-gray-600">+254 723 688 108</p>
                  </div>
                </a>

                <a href="https://wa.me/254723688108" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FaWhatsapp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">WhatsApp</p>
                    <p className="text-gray-600">Chat with us</p>
                  </div>
                </a>

                <a href="mailto:order@dialadrinkkenya.com" className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-12 bg-teal/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiMail className="w-5 h-5 text-teal" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Email</p>
                    <p className="text-gray-600">order@dialadrinkkenya.com</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Business Hours</h2>
              <div className="flex items-start gap-4">
                <FiClock className="w-5 h-5 text-teal mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Daily: 10:00 AM - 10:00 PM</p>
                  <p className="text-gray-600 text-sm">Including weekends & holidays</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Location</h2>
              <div className="flex items-start gap-4">
                <FiMapPin className="w-5 h-5 text-primary mt-1" />
                <div>
                  <p className="text-gray-800 font-medium">Nairobi, Kenya</p>
                  <p className="text-gray-600 text-sm">We deliver across Nairobi and major cities</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <ContactForm />
          </div>
        </div>
      </div>
    </div>
  );
}
