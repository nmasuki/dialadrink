import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { notifyPaymentFailed } from "@/lib/notifications";

// Initialize PesaPal
const PesaPal = require("pesapaljs").init({
  key: process.env.PESAPAL_KEY,
  secret: process.env.PESAPAL_SECRET,
  debug: false,
});

const PesaPalStatusMap: Record<string, string> = {
  COMPLETED: "Paid",
  PENDING: "Pending",
  INVALID: "Cancelled",
  FAILED: "Cancelled",
};

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { pesapal_transaction_tracking_id, pesapal_merchant_reference, pesapal_notification_type } = body;

    console.log("PesaPal IPN received:", {
      transactionId: pesapal_transaction_tracking_id,
      reference: pesapal_merchant_reference,
      notificationType: pesapal_notification_type,
    });

    if (!pesapal_merchant_reference) {
      return new NextResponse(
        `pesapal_notification_type=${pesapal_notification_type}&pesapal_transaction_tracking_id=${pesapal_transaction_tracking_id}&pesapal_merchant_reference=${pesapal_merchant_reference}`,
        { status: 200 }
      );
    }

    // Find order by key
    const order = await Order.findOne({ key: pesapal_merchant_reference });

    if (order && pesapal_transaction_tracking_id) {
      try {
        const paymentDetails = await PesaPal.getPaymentDetails({
          reference: pesapal_merchant_reference,
          transaction: pesapal_transaction_tracking_id,
        });

        if (paymentDetails) {
          order.payment = order.payment || {};
          order.payment.transactionId = paymentDetails.transaction;
          order.payment.referenceId = paymentDetails.reference;
          order.payment.method = paymentDetails.method?.split("_")[0] || "pesapal";
          order.payment.state = PesaPalStatusMap[paymentDetails.status] || `unexpected_${paymentDetails.status}`;

          if (paymentDetails.status === "COMPLETED") {
            order.state = "paid";
          }

          await order.save();
          console.log("Order updated:", order.key, order.payment.state);

          // Notify customer on failed/invalid payment
          if (paymentDetails.status === "FAILED" || paymentDetails.status === "INVALID") {
            notifyPaymentFailed({
              orderNumber: order.orderNumber,
              key: order.key,
              total: order.total,
              delivery: order.delivery,
              items: order.items,
            }).catch((err) => console.error("Payment failure notification error:", err));
          }
        }
      } catch (err) {
        console.error("Error getting payment details:", err);
      }
    }

    // Respond to PesaPal
    return new NextResponse(
      `pesapal_notification_type=${pesapal_notification_type}&pesapal_transaction_tracking_id=${pesapal_transaction_tracking_id}&pesapal_merchant_reference=${pesapal_merchant_reference}`,
      { status: 200 }
    );
  } catch (error) {
    console.error("PesaPal IPN Error:", error);
    return NextResponse.json(
      { response: "error", message: "IPN processing failed" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests for IPN as well (PesaPal sometimes uses GET)
  const { searchParams } = new URL(request.url);
  const pesapal_transaction_tracking_id = searchParams.get("pesapal_transaction_tracking_id");
  const pesapal_merchant_reference = searchParams.get("pesapal_merchant_reference");
  const pesapal_notification_type = searchParams.get("pesapal_notification_type");

  if (pesapal_merchant_reference) {
    await connectDB();

    const order = await Order.findOne({ key: pesapal_merchant_reference });

    if (order && pesapal_transaction_tracking_id) {
      try {
        const paymentDetails = await PesaPal.getPaymentDetails({
          reference: pesapal_merchant_reference,
          transaction: pesapal_transaction_tracking_id,
        });

        if (paymentDetails) {
          order.payment = order.payment || {};
          order.payment.transactionId = paymentDetails.transaction;
          order.payment.state = PesaPalStatusMap[paymentDetails.status] || `unexpected_${paymentDetails.status}`;

          if (paymentDetails.status === "COMPLETED") {
            order.state = "paid";
          }

          await order.save();

          // Notify customer on failed/invalid payment
          if (paymentDetails.status === "FAILED" || paymentDetails.status === "INVALID") {
            notifyPaymentFailed({
              orderNumber: order.orderNumber,
              key: order.key,
              total: order.total,
              delivery: order.delivery,
              items: order.items,
            }).catch((err) => console.error("Payment failure notification error:", err));
          }
        }
      } catch (err) {
        console.error("Error getting payment details:", err);
      }
    }
  }

  return new NextResponse(
    `pesapal_notification_type=${pesapal_notification_type}&pesapal_transaction_tracking_id=${pesapal_transaction_tracking_id}&pesapal_merchant_reference=${pesapal_merchant_reference}`,
    { status: 200 }
  );
}
