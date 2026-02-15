import nodemailer from "nodemailer";

// ─── Email Transport ──────────────────────────────────────────────────────────

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.zoho.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

// ─── Send Email ───────────────────────────────────────────────────────────────

export async function sendEmail(to: string, subject: string, html: string) {
  if (!to || !process.env.SMTP_USER) {
    console.warn("[Notifications] Skipping email — no recipient or SMTP not configured");
    return;
  }

  const from = process.env.EMAIL_FROM || `Dial A Drink Kenya <${process.env.SMTP_USER}>`;
  const cc = process.env.NODE_ENV === "production" ? "simonkimari@gmail.com" : undefined;

  if (process.env.NODE_ENV === "development") {
    subject = "(Testing) " + subject;
  }

  try {
    const info = await getTransporter().sendMail({ from, to, cc, subject, html });
    console.log(`[Notifications] Email sent to ${to}: ${info.messageId}`);
  } catch (err) {
    console.error(`[Notifications] Email failed to ${to}:`, err);
  }
}

// ─── Send SMS (MoveSMS) ──────────────────────────────────────────────────────

function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\s+/g, "");
  if (cleaned.startsWith("0")) {
    cleaned = "+254" + cleaned.slice(1);
  } else if (cleaned.startsWith("254") && !cleaned.startsWith("+254")) {
    cleaned = "+" + cleaned;
  }
  return cleaned;
}

export async function sendSMS(to: string, message: string) {
  const phone = cleanPhoneNumber(to);
  const username = process.env.MOVESMS_USERNAME;
  const apiKey = process.env.MOVESMS_APIKEY;
  const sender = process.env.MOVESMS_SENDER || "SMARTLINK";

  if (!username || !apiKey) {
    console.warn("[Notifications] Skipping SMS — MoveSMS not configured");
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    console.log(`[Notifications] SMS (dev mode, not sent):\n  To: ${phone}\n  Message: ${message}`);
    return;
  }

  const url = `https://sms.movesms.co.ke/api/compose?username=${username}&api_key=${apiKey}&sender=${sender}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        to: phone,
        message: message.replace(/\s{2,}/g, " "),
        msgtype: "5",
        dlr: "0",
      }),
    });
    const text = await res.text();
    console.log(`[Notifications] SMS sent to ${phone}: ${text}`);
  } catch (err) {
    console.error(`[Notifications] SMS failed to ${phone}:`, err);
  }
}

// ─── Order Types ─────────────────────────────────────────────────────────────

interface OrderForNotification {
  orderNumber: number;
  key: string;
  total: number;
  subtotal?: number;
  deliveryFee?: number;
  paymentMethod?: string;
  delivery: {
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    location?: string;
  };
  items?: Array<{
    name?: string;
    quantity?: string;
    pieces?: number;
    price?: number;
    currency?: string;
  }>;
}

// ─── Notify: Order Placed ────────────────────────────────────────────────────

export async function notifyOrderPlaced(order: OrderForNotification) {
  const { delivery, orderNumber, total, paymentMethod, items } = order;
  const name = `${delivery.firstName} ${delivery.lastName}`;
  const phone = delivery.phoneNumber;
  const formattedTotal = `KES ${total.toLocaleString()}`;

  // --- Customer SMS ---
  const paymentNote =
    paymentMethod === "pesapal"
      ? `Please proceed to pay ${formattedTotal} online to confirm.`
      : paymentMethod === "cash"
        ? `You will be required to pay ${formattedTotal} cash on delivery.`
        : `You will be required to pay ${formattedTotal} ${paymentMethod || "on delivery"}.`;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dialadrinkkenya.com";
  const paymentLink = `${siteUrl}/checkout/payment?order=${order.key}`;
  const shortPayLink = `${siteUrl}/pay/${order.key}`;

  const customerSms =
    `DIALADRINK: Your order #W${orderNumber} has been received. ${paymentNote} ` +
    `Pay online: ${shortPayLink} ` +
    `Thank you for using dialadrinkkenya.com`;

  const smsPromise = sendSMS(phone, customerSms);

  // --- Customer Email ---
  let emailPromise: Promise<void> | undefined;
  if (delivery.email) {
    const itemsHtml = (items || [])
      .map(
        (item) =>
          `<tr>
            <td style="padding:8px;border-bottom:1px solid #eee">${item.name || "Product"} ${item.quantity ? `(${item.quantity})` : ""}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${item.pieces || 1}</td>
            <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${item.currency || "KES"} ${((item.price || 0) * (item.pieces || 1)).toLocaleString()}</td>
          </tr>`
      )
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2f93a3;padding:20px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Order Confirmed!</h1>
        </div>
        <div style="padding:20px">
          <p>Hi ${delivery.firstName},</p>
          <p>Thank you for your order! Here are your order details:</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#f7f7f7">
              <td style="padding:8px"><strong>Order #</strong></td>
              <td style="padding:8px">${orderNumber}</td>
            </tr>
            <tr>
              <td style="padding:8px"><strong>Payment</strong></td>
              <td style="padding:8px">${paymentMethod || "Cash on Delivery"}</td>
            </tr>
            <tr style="background:#f7f7f7">
              <td style="padding:8px"><strong>Phone</strong></td>
              <td style="padding:8px">${phone}</td>
            </tr>
            <tr>
              <td style="padding:8px"><strong>Delivery To</strong></td>
              <td style="padding:8px">${delivery.address || ""}${delivery.location ? ", " + delivery.location : ""}</td>
            </tr>
          </table>
          <h3 style="margin-top:20px">Order Items</h3>
          <table style="width:100%;border-collapse:collapse">
            <thead>
              <tr style="background:#f7f7f7">
                <th style="padding:8px;text-align:left">Item</th>
                <th style="padding:8px;text-align:center">Qty</th>
                <th style="padding:8px;text-align:right">Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="margin-top:16px;padding:12px;background:#f7f7f7;border-radius:8px">
            ${order.subtotal ? `<p style="margin:4px 0">Subtotal: <strong>KES ${order.subtotal.toLocaleString()}</strong></p>` : ""}
            ${order.deliveryFee ? `<p style="margin:4px 0">Delivery: <strong>KES ${order.deliveryFee.toLocaleString()}</strong></p>` : ""}
            <p style="margin:4px 0;font-size:18px">Total: <strong style="color:#f44336">${formattedTotal}</strong></p>
          </div>
          <div style="margin-top:20px;text-align:center">
            <a href="${paymentLink}" style="display:inline-block;padding:14px 32px;background:#f44336;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">Pay Now Online</a>
          </div>
          <p style="margin-top:20px">We'll have your order delivered shortly. For any queries, call us at ${process.env.NEXT_PUBLIC_CONTACT_PHONE || "+254723688108"}.</p>
        </div>
        <div style="background:#f7f7f7;padding:16px;text-align:center;font-size:12px;color:#666">
          Dial A Drink Kenya — Fast Alcohol Delivery in Nairobi
        </div>
      </div>
    `;

    emailPromise = sendEmail(
      delivery.email,
      `Order #${orderNumber} Confirmed — Dial A Drink Kenya`,
      html
    );
  }

  // --- Vendor SMS ---
  const itemsSummary = (items || [])
    .map((i) => `${i.pieces || 1}*${i.name || "Product"}`)
    .join(", ");

  const vendorSms =
    `${paymentMethod || "Cash"} order:${delivery.firstName} ${phone}, ` +
    `Amount:${total}, Drinks:${itemsSummary || "N/A"}.`;

  const vendorPhone = process.env.CONTACT_PHONE_NUMBER;
  const vendorPromise = vendorPhone ? sendSMS(vendorPhone, vendorSms) : Promise.resolve();

  await Promise.allSettled([smsPromise, emailPromise, vendorPromise].filter(Boolean));
}

// ─── Notify: Payment Failed ──────────────────────────────────────────────────

export async function notifyPaymentFailed(order: OrderForNotification) {
  const { delivery, orderNumber, total } = order;
  const formattedTotal = `KES ${total.toLocaleString()}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.dialadrinkkenya.com";
  const paymentLink = `${siteUrl}/checkout/payment?order=${order.key}`;
  const shortPayLink = `${siteUrl}/pay/${order.key}`;

  // --- Customer SMS ---
  const customerSms =
    `DIALADRINK: Payment for your order #W${orderNumber} (${formattedTotal}) was unsuccessful. ` +
    `Try again: ${shortPayLink} ` +
    `Or call ${process.env.NEXT_PUBLIC_CONTACT_PHONE || "+254723688108"} for help.`;

  const smsPromise = sendSMS(delivery.phoneNumber, customerSms);

  // --- Customer Email ---
  let emailPromise: Promise<void> | undefined;
  if (delivery.email) {
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#f44336;padding:20px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">Payment Unsuccessful</h1>
        </div>
        <div style="padding:20px">
          <p>Hi ${delivery.firstName},</p>
          <p>Unfortunately, the payment for your order <strong>#${orderNumber}</strong> (${formattedTotal}) was not successful.</p>
          <div style="margin:20px 0;text-align:center">
            <a href="${paymentLink}" style="display:inline-block;padding:14px 32px;background:#2f93a3;color:#fff;text-decoration:none;border-radius:8px;font-weight:bold;font-size:16px">Try Again — Pay Now</a>
          </div>
          <p>Or choose Cash on Delivery / M-Pesa on Delivery instead.</p>
          <p>Call us at <strong>${process.env.NEXT_PUBLIC_CONTACT_PHONE || "+254723688108"}</strong> if you need help.</p>
        </div>
        <div style="background:#f7f7f7;padding:16px;text-align:center;font-size:12px;color:#666">
          Dial A Drink Kenya — Fast Alcohol Delivery in Nairobi
        </div>
      </div>
    `;

    emailPromise = sendEmail(
      delivery.email,
      `Payment Failed for Order #${orderNumber} — Dial A Drink Kenya`,
      html
    );
  }

  await Promise.allSettled([smsPromise, emailPromise].filter(Boolean));
}
