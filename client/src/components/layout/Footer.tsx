import Link from "next/link";
import { FiFacebook, FiTwitter, FiInstagram, FiYoutube, FiPhone, FiMail, FiMapPin } from "react-icons/fi";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark text-gray-300">
      {/* Main Footer */}
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-4">
              Dial A Drink Kenya
            </h3>
            <p className="text-sm leading-relaxed mb-4">
              Kenya&apos;s leading online alcohol delivery service. Order whisky, beer,
              wine & more with fast delivery across Nairobi and major cities.
            </p>
            <div className="flex gap-3">
              <a
                href="https://facebook.com/drinkdeliverynairobi"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Facebook"
              >
                <FiFacebook className="w-5 h-5" />
              </a>
              <a
                href="https://twitter.com/liqourdelivery"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Twitter"
              >
                <FiTwitter className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com/dial_a_drink_kenya"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="Instagram"
              >
                <FiInstagram className="w-5 h-5" />
              </a>
              <a
                href="https://youtube.com/dialadrink"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center hover:bg-primary transition-colors"
                aria-label="YouTube"
              >
                <FiYoutube className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-primary transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/products?category=whisky" className="hover:text-primary transition-colors">
                  Whisky
                </Link>
              </li>
              <li>
                <Link href="/products?category=wine" className="hover:text-primary transition-colors">
                  Wine
                </Link>
              </li>
              <li>
                <Link href="/products?category=beer" className="hover:text-primary transition-colors">
                  Beer
                </Link>
              </li>
              <li>
                <Link href="/products?onOffer=true" className="hover:text-primary transition-colors">
                  Special Offers
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-4">
              Customer Service
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/delivery" className="hover:text-primary transition-colors">
                  Delivery Info
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white font-heading font-bold text-lg mb-4">
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-3">
                <FiPhone className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <div>
                  <a href="tel:+254723688108" className="hover:text-primary transition-colors">
                    +254 723 688 108
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <FiMail className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <a href="mailto:order@dialadrinkkenya.com" className="hover:text-primary transition-colors">
                  order@dialadrinkkenya.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <FiMapPin className="w-5 h-5 mt-0.5 text-primary flex-shrink-0" />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-black py-4">
        <div className="container text-center text-sm">
          <p>&copy; {currentYear} Dial A Drink Kenya. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
