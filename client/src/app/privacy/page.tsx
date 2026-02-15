import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Learn how Dial A Drink Kenya collects, uses, and protects your personal information.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-sm p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: February 2026</p>

          <div className="prose prose-gray max-w-none">
            <h2>1. Introduction</h2>
            <p>
              Dial A Drink Kenya (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects your privacy and is committed
              to protecting your personal data. This Privacy Policy explains how we collect, use,
              store, and protect your information when you use our website and services.
            </p>

            <h2>2. Information We Collect</h2>
            <p>We may collect the following types of information:</p>
            <h3>Personal Information</h3>
            <ul>
              <li>Name and contact details (phone number, email address)</li>
              <li>Delivery address</li>
              <li>Payment information (processed securely through payment gateways)</li>
              <li>Order history</li>
            </ul>
            <h3>Technical Information</h3>
            <ul>
              <li>IP address and browser type</li>
              <li>Device information</li>
              <li>Cookies and usage data</li>
            </ul>

            <h2>3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Process and deliver your orders</li>
              <li>Communicate with you about your orders and our services</li>
              <li>Verify your age and identity for legal compliance</li>
              <li>Improve our website and services</li>
              <li>Send promotional offers and updates (with your consent)</li>
              <li>Prevent fraud and ensure security</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>4. Information Sharing</h2>
            <p>We may share your information with:</p>
            <ul>
              <li><strong>Delivery Partners:</strong> To fulfill and deliver your orders</li>
              <li><strong>Payment Processors:</strong> To process your payments securely</li>
              <li><strong>Service Providers:</strong> Who assist us in operating our business</li>
              <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
            </ul>
            <p>
              We do not sell your personal information to third parties for marketing purposes.
            </p>

            <h2>5. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your
              personal data against unauthorized access, alteration, disclosure, or destruction.
              These measures include encryption, secure servers, and access controls.
            </p>

            <h2>6. Cookies</h2>
            <p>
              Our website uses cookies to enhance your browsing experience. Cookies are small
              files stored on your device that help us:
            </p>
            <ul>
              <li>Remember your preferences and cart items</li>
              <li>Analyze website traffic and usage patterns</li>
              <li>Provide personalized content</li>
            </ul>
            <p>
              You can manage cookie preferences through your browser settings. Note that
              disabling cookies may affect website functionality.
            </p>

            <h2>7. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data (subject to legal requirements)</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
              <li><strong>Portability:</strong> Request transfer of your data</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the details provided below.
            </p>

            <h2>8. Data Retention</h2>
            <p>
              We retain your personal data only for as long as necessary to fulfill the purposes
              for which it was collected, comply with legal obligations, resolve disputes, and
              enforce our agreements. Order records are typically retained for 7 years for tax
              and legal compliance purposes.
            </p>

            <h2>9. Children&apos;s Privacy</h2>
            <p>
              Our services are not intended for individuals under 18 years of age. We do not
              knowingly collect personal information from minors. If we become aware that we
              have collected data from a minor, we will take steps to delete that information.
            </p>

            <h2>10. Third-Party Links</h2>
            <p>
              Our website may contain links to third-party websites. We are not responsible for
              the privacy practices of these external sites. We encourage you to review their
              privacy policies before providing any personal information.
            </p>

            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on
              this page with an updated revision date. We encourage you to review this policy
              periodically.
            </p>

            <h2>12. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or how we handle your data,
              please contact us at:
            </p>
            <ul>
              <li>Email: order@dialadrinkkenya.com</li>
              <li>Phone: +254 723 688 108</li>
              <li>Address: Nairobi, Kenya</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
