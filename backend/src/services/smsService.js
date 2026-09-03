/**
 * ============================================================
 * LearnNova Notifications — SMS Service (Twilio)
 * ============================================================
 *
 * Sends SMS text messages via the Twilio Messaging API.
 *
 * Usage:
 *   const { sendSMS } = require("./smsService");
 *   await sendSMS("+923001234567", "Your challan is ready.");
 *
 * ── Environment variables needed ──────────────────────────
 *   TWILIO_ACCOUNT_SID  — Twilio account SID
 *   TWILIO_AUTH_TOKEN   — Twilio auth token
 *   TWILIO_SMS_NUMBER   — sender phone number (+...)
 *
 * When SANDBOX=true, messages are logged but NOT sent.
 */

const twilio = require("twilio");

// ── Twilio client (lazy-init so missing creds don't crash startup) ──
let client = null;

function getClient() {
  if (client) return client;

  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token || sid === "your_account_sid_here") {
    console.warn("[SMS] Twilio credentials not configured.");
    return null;
  }

  client = twilio(sid, token);
  return client;
}

/**
 * Send an SMS message.
 *
 * @param {string} to   — Recipient phone number in "+1234567890" format.
 * @param {string} body — Message text.
 * @returns {Promise<{ success: boolean, sid?: string, error?: string }>}
 */
async function sendSMS(to, body) {
  const sandbox = process.env.SANDBOX === "true";

  // ── Sandbox mode — log only, no API call ──────────────────
  if (sandbox) {
    console.log("[SMS] [SANDBOX] Would send to:", to);
    console.log("[SMS] [SANDBOX] Message:", body);
    return { success: true, sid: "sandbox-mode", sandbox: true };
  }

  const twilioClient = getClient();
  if (!twilioClient) {
    return { success: false, error: "Twilio credentials not configured." };
  }

  try {
    const from = process.env.TWILIO_SMS_NUMBER || "+1234567890";
    const message = await twilioClient.messages.create({
      from,
      to,
      body,
    });

    console.log(`[SMS] Sent successfully. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error("[SMS] Send failed:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendSMS };
