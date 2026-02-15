import { Metadata } from "next";
import { FiTruck, FiClock, FiMapPin, FiDollarSign, FiCheckCircle } from "react-icons/fi";

export const metadata: Metadata = {
  title: "Delivery Information",
  description: "Learn about our fast alcohol delivery service across Nairobi and Kenya. Free delivery on orders above KES 3,000.",
};

const deliveryAreas = [
  { area: "Nairobi CBD & Surroundings", time: "45 min - 1.5 hours", fee: "KES 200" },
  { area: "Westlands, Kilimani, Lavington", time: "45 min - 2 hours", fee: "KES 200" },
  { area: "Karen, Langata, South B/C", time: "1 - 2 hours", fee: "KES 300" },
  { area: "Kileleshwa, Parklands, Kasarani", time: "1 - 2 hours", fee: "KES 300" },
  { area: "Ruaka, Kikuyu, Rongai", time: "1.5 - 3 hours", fee: "KES 400" },
  { area: "Thika, Juja, Ruiru", time: "2 - 4 hours", fee: "KES 500" },
];

export default function DeliveryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="bg-gradient-to-r from-teal to-teal/80 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FiTruck className="w-16 h-16 mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4">Fast & Reliable Delivery</h1>
          <p className="text-xl text-white/80">
            Get your favorite drinks delivered to your doorstep in as little as 45 minutes
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-14 h-14 bg-teal/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiClock className="w-7 h-7 text-teal" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Fast Delivery</h3>
            <p className="text-gray-600 text-sm">45 minutes to 2 hours within Nairobi</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiDollarSign className="w-7 h-7 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Free Delivery</h3>
            <p className="text-gray-600 text-sm">On orders above KES 3,000</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMapPin className="w-7 h-7 text-primary" />
            </div>
            <h3 className="font-bold text-gray-800 mb-2">Wide Coverage</h3>
            <p className="text-gray-600 text-sm">Nairobi & major cities in Kenya</p>
          </div>
        </div>

        {/* Delivery Areas */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-12">
          <div className="bg-gray-800 px-6 py-4">
            <h2 className="text-xl font-bold text-white">Delivery Areas & Fees</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Area</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Est. Time</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-600">Delivery Fee*</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {deliveryAreas.map((area, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-gray-800">{area.area}</td>
                    <td className="px-6 py-4 text-gray-600">{area.time}</td>
                    <td className="px-6 py-4 text-gray-800 font-medium">{area.fee}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-green-50 text-green-800 text-sm">
            * Delivery is <strong>FREE</strong> for orders above KES 3,000 within Nairobi
          </div>
        </div>

        {/* Delivery Hours */}
        <div className="bg-white rounded-xl shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Delivery Hours</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Regular Hours</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                  Monday - Sunday: 10:00 AM - 10:00 PM
                </li>
                <li className="flex items-center gap-2">
                  <FiCheckCircle className="w-5 h-5 text-green-500" />
                  Public Holidays: 10:00 AM - 10:00 PM
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Important Notes</h3>
              <ul className="space-y-2 text-gray-600 text-sm">
                <li>• Delivery times may vary during peak hours and bad weather</li>
                <li>• Last orders accepted at 9:30 PM for same-day delivery</li>
                <li>• We may call to confirm your order and delivery details</li>
              </ul>
            </div>
          </div>
        </div>

        {/* What to Expect */}
        <div className="bg-white rounded-xl shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">What to Expect</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-teal text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">1</div>
              <div>
                <h3 className="font-semibold text-gray-800">Order Confirmation</h3>
                <p className="text-gray-600 text-sm">You&apos;ll receive an SMS/email confirming your order details</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-teal text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">2</div>
              <div>
                <h3 className="font-semibold text-gray-800">Order Dispatch</h3>
                <p className="text-gray-600 text-sm">Your order is picked and dispatched by our delivery team</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-teal text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">3</div>
              <div>
                <h3 className="font-semibold text-gray-800">Delivery Call</h3>
                <p className="text-gray-600 text-sm">Our rider will call you when they&apos;re nearby</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">4</div>
              <div>
                <h3 className="font-semibold text-gray-800">Enjoy!</h3>
                <p className="text-gray-600 text-sm">Receive your order, pay if applicable, and enjoy responsibly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
