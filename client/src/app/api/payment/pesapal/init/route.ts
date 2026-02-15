import { NextRequest, NextResponse } from "next/server";

// Initialize PesaPal
const PesaPal = require("pesapaljs").init({
  key: process.env.PESAPAL_KEY,
  secret: process.env.PESAPAL_SECRET,
  debug: process.env.NODE_ENV !== "production",
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderKey, amount, email, phone, firstName, lastName, description } = body;

    if (!orderKey || !amount) {
      return NextResponse.json(
        { response: "error", message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create PesaPal customer
    const customer = new PesaPal.Customer(
      email || `${phone}@dialadrinkkenya.com`,
      phone
    );
    customer.firstName = firstName || "Customer";
    customer.lastName = lastName || "";

    // Create PesaPal order
    const order = new PesaPal.Order(
      orderKey,
      customer,
      description || `Order ${orderKey}`,
      amount,
      "KES",
      "MERCHANT"
    );

    // Get the host from request headers
    const host = request.headers.get("origin") || request.headers.get("host") || "https://www.dialadrinkkenya.com";
    const callbackUrl = `${host}/checkout/success?order=${orderKey}`;

    // Generate payment URL
    const paymentUrl = PesaPal.getPaymentURL(order, callbackUrl);

    return NextResponse.json({
      response: "success",
      iframeUrl: paymentUrl,
      orderKey,
    });
  } catch (error) {
    console.error("PesaPal Init Error:", error);
    return NextResponse.json(
      { response: "error", message: "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
