/**
 * ============================================================
 * Learnify Notifications — WhatsApp Service (Twilio)
 * ============================================================
 *
 * Sends WhatsApp messages via the Twilio Messaging API.
 *
 * Usage:
 *   const { sendWhatsApp } = require("./whatsappService");
 *   await sendWhatsApp("whatsapp:+923001234567", "Hello!");
 *
 * ── Environment variables needed ──────────────────────────
 *   TWILIO_ACCOUNT_SID     — Twilio account SID
 *   TWILIO_AUTH_TOKEN      — Twilio auth token
 *   TWILIO_WHATSAPP_NUMBER — sender number (whatsapp:+...)
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
    console.warn("[WhatsApp] Twilio credentials not configured.");
    return null;
  }

  client = twilio(sid, token);
  return client;
}

/**
 * Send a WhatsApp message.
 *
 * @param {string} to   — Recipient in "whatsapp:+1234567890" format.
 * @param {string} body — Message text.
 * @returns {Promise<{ success: boolean, sid?: string, error?: string }>}
 */
async function sendWhatsApp(to, body) {
  const sandbox = process.env.SANDBOX === "true";

  // ── Sandbox mode — log only, no API call ──────────────────
  if (sandbox) {
    console.log("[WhatsApp] [SANDBOX] Would send to:", to);
    console.log("[WhatsApp] [SANDBOX] Message:", body);
    return { success: true, sid: "sandbox-mode", sandbox: true };
  }

  const twilioClient = getClient();
  if (!twilioClient) {
    return { success: false, error: "Twilio credentials not configured." };
  }

  try {
    const from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+1234567890";
    const message = await twilioClient.messages.create({
      from,
      to,
      body,
    });

    console.log(`[WhatsApp] Sent successfully. SID: ${message.sid}`);
    return { success: true, sid: message.sid };
  } catch (err) {
    console.error("[WhatsApp] Send failed:", err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendWhatsApp };
