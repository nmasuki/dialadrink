import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Read our terms and conditions for using Dial A Drink Kenya services.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Terms & Conditions</h1>
          <p className="text-gray-500 mb-8">Last updated: February 2026</p>

          <div className="prose prose-gray max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Welcome to Dial A Drink Kenya (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). These Terms and Conditions
              govern your use of our website and services. By accessing or using our services, you
              agree to be bound by these terms.
            </p>

            <h2>2. Eligibility</h2>
            <p>
              You must be at least 18 years of age to use our services. By placing an order, you
              confirm that you are of legal drinking age in Kenya. We reserve the right to request
              identification to verify your age upon delivery.
            </p>

            <h2>3. Products and Pricing</h2>
            <p>
              All products displayed on our website are subject to availability. Prices are quoted
              in Kenyan Shillings (KES) and include applicable taxes. We reserve the right to modify
              prices without prior notice. Any promotional offers are valid for a limited time and
              subject to specific terms.
            </p>

            <h2>4. Orders</h2>
            <p>
              When you place an order, you are making an offer to purchase the selected products.
              We may accept or decline your order at our discretion. An order is confirmed only when
              you receive an order confirmation from us. We reserve the right to cancel orders due to
              stock unavailability, pricing errors, or suspected fraudulent activity.
            </p>

            <h2>5. Payment</h2>
            <p>
              We accept various payment methods including cash on delivery, M-Pesa, and card payments.
              For online payments, transactions are processed through secure payment gateways. All
              payment information is encrypted and handled securely.
            </p>

            <h2>6. Delivery</h2>
            <p>
              We strive to deliver orders within the estimated timeframes. However, delivery times
              are not guaranteed and may vary due to factors beyond our control such as traffic,
              weather, or high order volumes. Free delivery is available for orders meeting the
              minimum threshold within specified areas.
            </p>

            <h2>7. Returns and Refunds</h2>
            <p>
              Due to the nature of our products, we cannot accept returns once delivery is completed
              and the products are accepted. If you receive damaged or incorrect products, please
              contact us immediately. We will arrange for replacement or refund as appropriate.
              Refunds will be processed within 7-14 business days.
            </p>

            <h2>8. Responsible Drinking</h2>
            <p>
              We promote responsible drinking. We reserve the right to refuse service to anyone who
              appears intoxicated or is purchasing alcohol for someone who is intoxicated or underage.
              Please drink responsibly and never drink and drive.
            </p>

            <h2>9. Intellectual Property</h2>
            <p>
              All content on our website including text, images, logos, and graphics is the property
              of Dial A Drink Kenya and is protected by copyright laws. You may not reproduce,
              distribute, or use any content without our written permission.
            </p>

            <h2>10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Dial A Drink Kenya shall not be liable for any
              indirect, incidental, special, or consequential damages arising from your use of our
              services or products.
            </p>

            <h2>11. Changes to Terms</h2>
            <p>
              We may update these Terms and Conditions from time to time. Changes will be posted on
              this page with an updated revision date. Your continued use of our services after any
              changes constitutes acceptance of the new terms.
            </p>

            <h2>12. Governing Law</h2>
            <p>
              These Terms and Conditions are governed by the laws of the Republic of Kenya. Any
              disputes shall be subject to the exclusive jurisdiction of Kenyan courts.
            </p>

            <h2>13. Contact Us</h2>
            <p>
              If you have any questions about these Terms and Conditions, please contact us at:
            </p>
            <ul>
              <li>Email: order@dialadrinkkenya.com</li>
              <li>Phone: +254 723 688 108</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
