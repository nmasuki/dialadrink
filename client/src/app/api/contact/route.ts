import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/notifications";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, subject, message, token } = await request.json();

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 }
      );
    }

    // Verify Turnstile token
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (secretKey && secretKey !== "your-turnstile-secret-key") {
      if (!token) {
        return NextResponse.json(
          { error: "Please complete the CAPTCHA verification." },
          { status: 400 }
        );
      }

      const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: secretKey,
          response: token,
        }),
      });

      const verification = await verifyRes.json();
      if (!verification.success) {
        return NextResponse.json(
          { error: "CAPTCHA verification failed. Please try again." },
          { status: 400 }
        );
      }
    }

    // Build email HTML
    const subjectLabels: Record<string, string> = {
      order: "Order Inquiry",
      delivery: "Delivery Issue",
      product: "Product Question",
      feedback: "Feedback",
      partnership: "Business/Partnership",
      other: "Other",
    };

    const subjectLabel = subjectLabels[subject] || subject;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
        <div style="background:#2f93a3;padding:20px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">New Contact Message</h1>
        </div>
        <div style="padding:20px">
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr style="background:#f7f7f7">
              <td style="padding:10px;font-weight:bold;width:120px">Name</td>
              <td style="padding:10px">${name}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold">Email</td>
              <td style="padding:10px"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr style="background:#f7f7f7">
              <td style="padding:10px;font-weight:bold">Phone</td>
              <td style="padding:10px">${phone || "Not provided"}</td>
            </tr>
            <tr>
              <td style="padding:10px;font-weight:bold">Subject</td>
              <td style="padding:10px">${subjectLabel}</td>
            </tr>
          </table>
          <div style="margin-top:16px;padding:16px;background:#f7f7f7;border-radius:8px;border-left:4px solid #2f93a3">
            <p style="margin:0;white-space:pre-wrap">${message}</p>
          </div>
        </div>
        <div style="background:#f7f7f7;padding:16px;text-align:center;font-size:12px;color:#666">
          Sent from the Contact Form — dialadrinkkenya.com
        </div>
      </div>
    `;

    const recipient = process.env.SMTP_USER || "order@dialadrinkkenya.com";
    await sendEmail(recipient, `Contact: ${subjectLabel} — ${name}`, html);

    return NextResponse.json({ response: "success" });
  } catch (error) {
    console.error("[Contact API] Error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
