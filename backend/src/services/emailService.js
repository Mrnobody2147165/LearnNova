/**
 * ============================================================
 * LearnNova Notifications — Email Service (Nodemailer)
 * ============================================================
 *
 * Sends email notifications via Nodemailer SMTP transport.
 *
 * Usage:
 *   const { sendEmail } = require("./emailService");
 *   await sendEmail("parent@example.com", "Fee Challan", "<h1>...</h1>");
 *
 * ── Environment variables needed ──────────────────────────
 *   EMAIL_SMTP_HOST    — SMTP server hostname
 *   EMAIL_SMTP_PORT    — SMTP port (usually 587 for TLS)
 *   EMAIL_SMTP_USER    — SMTP username / login
 *   EMAIL_SMTP_PASS    — SMTP password / app password
 *   EMAIL_FROM_ADDRESS — "From" address for outgoing mail
 *
 * When SANDBOX=true, emails are logged but NOT sent.
 *
 * ── Swap to Resend ────────────────────────────────────────
 * Replace the Nodemailer transport with the Resend SDK:
 *
 *   const resend = new Resend(process.env.EMAIL_SERVICE_API_KEY);
 *   await resend.emails.send({ from, to, subject, html });
 *
 * The function signature stays the same — just swap the
 * transport block below.
 */

const nodemailer = require("nodemailer");

// ── Transport (lazy-init so missing creds don't crash startup) ──
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_SMTP_HOST;
  const port = parseInt(process.env.EMAIL_SMTP_PORT, 10) || 587;
  const user = process.env.EMAIL_SMTP_USER;
  const pass = process.env.EMAIL_SMTP_PASS;

  if (!host || !user || !pass || user === "your_email@gmail.com") {
    console.warn("[Email] SMTP credentials not configured.");
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587
    auth: { user, pass },
  });

  return transporter;
}

/**
 * Send an email.
 *
 * @param {string} to      — Recipient email address.
 * @param {string} subject — Email subject line.
 * @param {string} html    — HTML body content.
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendEmail(to, subject, html) {
  const sandbox = process.env.SANDBOX === "true";

  // ── Sandbox mode — log only, no SMTP call ─────────────────
  if (sandbox) {
    console.log("[Email] [SANDBOX] Would send to:", to);
    console.log("[Email] [SANDBOX] Subject:", subject);
    console.log("[Email] [SANDBOX] Body:", html.replace(/<[^>]*>/g, "").slice(0, 200));
    return { success: true, messageId: "sandbox-mode", sandbox: true };
  }

  const transport = getTransporter();
  if (!transport) {
    return { success: false, error: "SMTP credentials not configured." };
  }

  try {
    const from = process.env.EMAIL_FROM_ADDRESS || "noreply@learnnova.edu";
    const info = await transport.sendMail({ from, to, subject, html });

    console.log(`[Email] Sent successfully. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error("[Email] Send failed:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendEmail };
