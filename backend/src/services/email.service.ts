import nodemailer, { Transporter } from "nodemailer";
import fs from "fs";
import path from "path";

export interface RegistrationEmailPayload {
  participantName: string;
  email: string;
  eventTitle: string;
  eventSlug: string;
  registrationCode: string;
  college: string;
  amountPaid: number;
  paymentId: string;
}

const EMAILS_DIR = path.join(process.cwd(), "data", "emails");

function ensureEmailsDir(): void {
  if (!fs.existsSync(EMAILS_DIR)) {
    fs.mkdirSync(EMAILS_DIR, { recursive: true });
  }
}

/**
 * Creates a nodemailer transport.
 * Supports custom SMTP, Gmail, or automatic Ethereal test inbox fallback.
 */
async function getEmailTransporter(): Promise<{
  transporter: Transporter;
  fromAddress: string;
  isTestInbox: boolean;
}> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const from = process.env.SMTP_FROM || `"Praxis 2026" <registrations@praxis.in>`;

  if (host && user && pass) {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
    return { transporter, fromAddress: from, isTestInbox: false };
  }

  // Fallback to ethereal test account for realistic email testing without SMTP configuration
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    return {
      transporter,
      fromAddress: `"Praxis 2026 Test Team" <${testAccount.user}>`,
      isTestInbox: true,
    };
  } catch (etherealErr) {
    console.warn("[Email Service] Ethereal test account creation fallback:", etherealErr);
    // Return mock transport if offline
    const transporter = nodemailer.createTransport({
      jsonTransport: true,
    });
    return { transporter, fromAddress: from, isTestInbox: true };
  }
}

/**
 * Generates an aesthetic, responsive HTML email template for Praxis event confirmations.
 */
function buildHtmlEmail(payload: RegistrationEmailPayload): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Praxis 2026 Registration Confirmed</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #06080e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #e2e8f0;
    }
    .wrapper {
      width: 100%;
      background-color: #06080e;
      padding: 40px 10px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #0d121f;
      border: 1px solid rgba(0, 255, 156, 0.25);
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #09131d 0%, #031c19 100%);
      padding: 32px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(0, 255, 156, 0.2);
    }
    .badge-praxis {
      display: inline-block;
      font-size: 11px;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: #00ff9c;
      background: rgba(0, 255, 156, 0.1);
      border: 1px solid rgba(0, 255, 156, 0.3);
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .title {
      font-size: 26px;
      font-weight: 800;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 14px;
      color: #94a3b8;
      margin: 0;
    }
    .content {
      padding: 28px 24px;
    }
    .status-card {
      background: rgba(0, 255, 156, 0.05);
      border: 1px solid rgba(0, 255, 156, 0.2);
      border-radius: 8px;
      padding: 16px;
      text-align: center;
      margin-bottom: 24px;
    }
    .status-card .label {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #64748b;
      margin-bottom: 4px;
    }
    .status-card .code {
      font-size: 28px;
      font-weight: 800;
      color: #00ff9c;
      letter-spacing: 0.1em;
      font-family: monospace;
    }
    .detail-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    .detail-table td {
      padding: 12px 8px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      font-size: 14px;
    }
    .detail-table .row-label {
      color: #94a3b8;
      width: 38%;
    }
    .detail-table .row-value {
      color: #ffffff;
      font-weight: 600;
      text-align: right;
    }
    .notes-box {
      background: #090e18;
      border-radius: 6px;
      padding: 16px;
      border-left: 3px solid #38bdf8;
      margin-bottom: 24px;
      font-size: 13px;
      line-height: 1.6;
      color: #cbd5e1;
    }
    .footer {
      background: #070a12;
      padding: 20px 24px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <span class="badge-praxis">PRAXIS 2026 OFFICIAL PASS</span>
        <h1 class="title">Registration Confirmed</h1>
        <p class="subtitle">Thank you for registering, ${payload.participantName}!</p>
      </div>

      <div class="content">
        <div class="status-card">
          <div class="label">Your Official Registration ID</div>
          <div class="code">${payload.registrationCode}</div>
        </div>

        <table class="detail-table">
          <tr>
            <td class="row-label">Event Name</td>
            <td class="row-value">${payload.eventTitle}</td>
          </tr>
          <tr>
            <td class="row-label">Participant</td>
            <td class="row-value">${payload.participantName}</td>
          </tr>
          <tr>
            <td class="row-label">College / Institute</td>
            <td class="row-value">${payload.college}</td>
          </tr>
          <tr>
            <td class="row-label">Registered Email</td>
            <td class="row-value">${payload.email}</td>
          </tr>
          <tr>
            <td class="row-label">Amount Paid</td>
            <td class="row-value">₹${payload.amountPaid}</td>
          </tr>
          <tr>
            <td class="row-label">Payment ID</td>
            <td class="row-value" style="font-family: monospace; font-size: 12px;">${payload.paymentId}</td>
          </tr>
          <tr>
            <td class="row-label">Payment Status</td>
            <td class="row-value" style="color: #00ff9c;">VERIFIED & COMPLETED</td>
          </tr>
        </table>

        <div class="notes-box">
          <strong>Important Instructions for Participants:</strong><br>
          • Please carry your College ID card along with this registration confirmation.<br>
          • Quote your Registration ID <strong>${payload.registrationCode}</strong> at the reporting desk.<br>
          • Check your event rulebook for timing schedules and reporting venue details.
        </div>
      </div>

      <div class="footer">
        <p style="margin: 0 0 6px 0;">Praxis 2026 Annual National Technology Symposium</p>
        <p style="margin: 0;">For queries or assistance, contact support@praxis.in</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send registration confirmation email via Nodemailer.
 * Non-blocking: logs output and saves local copy if in dev or offline.
 */
export async function sendRegistrationConfirmationEmail(
  payload: RegistrationEmailPayload
): Promise<{ success: boolean; messageId?: string; previewUrl?: string; error?: string }> {
  try {
    ensureEmailsDir();
    const htmlContent = buildHtmlEmail(payload);

    // Always save a local HTML copy for immediate inspection
    const localEmailFile = path.join(
      EMAILS_DIR,
      `registration_${payload.registrationCode}_${Date.now()}.html`
    );
    try {
      fs.writeFileSync(localEmailFile, htmlContent, "utf-8");
    } catch (saveErr) {
      console.warn("[Email Service] Could not write local email file:", saveErr);
    }

    console.log(`[Backend Email] Preparing confirmation email for ${payload.email}...`);
    console.log(`=======================================================
PRAXIS 2026 — REGISTRATION CONFIRMED
Event:           ${payload.eventTitle}
Registration ID: ${payload.registrationCode}
Participant:     ${payload.participantName}
Email:           ${payload.email}
College:         ${payload.college}
Amount Paid:     ₹${payload.amountPaid}
Payment ID:      ${payload.paymentId}
=======================================================`);

    // Obtain transporter
    const { transporter, fromAddress, isTestInbox } = await getEmailTransporter();

    const mailOptions = {
      from: fromAddress,
      to: payload.email,
      subject: `[CONFIRMED] Praxis 2026 Registration — ${payload.eventTitle} (${payload.registrationCode})`,
      text: `Hello ${payload.participantName},\n\nYour registration for ${payload.eventTitle} at Praxis 2026 has been successfully confirmed!\n\nRegistration Code: ${payload.registrationCode}\nAmount Paid: ₹${payload.amountPaid}\nPayment ID: ${payload.paymentId}\nCollege: ${payload.college}\n\nPlease present this code at the registration desk on the event day.\n\nBest regards,\nPraxis 2026 Team`,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Backend Email] Dispatched successfully! Message ID: ${info.messageId}`);

    let previewUrl: string | undefined;
    if (isTestInbox) {
      previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
      if (previewUrl) {
        console.log(`[Backend Email] Ethereal Preview URL: ${previewUrl}`);
      }
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Backend Email] Error during email dispatch:", message);
    return { success: false, error: message };
  }
}
