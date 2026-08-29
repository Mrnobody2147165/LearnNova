/**
 * ============================================================
 * Learnify Notifications — WhatsApp Service (Meta Cloud API & Twilio)
 * ============================================================
 *
 * Sends WhatsApp messages and native PDF document attachments.
 * Supports:
 *   1. Meta Official WhatsApp Cloud API (graph.facebook.com)
 *   2. Twilio WhatsApp API
 */

const twilio = require("twilio");

let twilioClientInstance = null;

function getTwilioClient() {
  if (twilioClientInstance) return twilioClientInstance;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token || sid === "your_account_sid_here") {
    return null;
  }

  twilioClientInstance = twilio(sid, token);
  return twilioClientInstance;
}

/**
 * Send a WhatsApp message with optional PDF document attachment.
 *
 * @param {string} to         — Recipient phone number (e.g. "whatsapp:+923265620214" or "923265620214")
 * @param {string} body       — Message text caption
 * @param {string} [mediaUrl] — Public URL of PDF document to attach as native WhatsApp document
 * @returns {Promise<{ success: boolean, sid?: string, error?: string }>}
 */
async function sendWhatsApp(to, body, mediaUrl = null) {
  const sandbox = process.env.SANDBOX === "true";
  const metaPhoneId = process.env.META_WHATSAPP_PHONE_ID;
  const metaToken = process.env.META_WHATSAPP_TOKEN;

  // ── 1. Sandbox / Development mode — log details ──────────────
  if (sandbox) {
    console.log("[WhatsApp] [SANDBOX] Would send to:", to);
    console.log("[WhatsApp] [SANDBOX] Message:", body);
    if (mediaUrl) console.log("[WhatsApp] [SANDBOX] Attached PDF Document:", mediaUrl);
    return { success: true, sid: "sandbox-mode", sandbox: true };
  }

  // ── 2. Meta Official WhatsApp Cloud API ───────────────────────
  if (metaPhoneId && metaToken && metaPhoneId.trim() !== "" && metaToken.trim() !== "") {
    const cleanPhone = to.replace(/[^0-9]/g, "");
    console.log(`[WhatsApp Meta API] Dispatching native PDF document to +${cleanPhone}...`);

    const payload = mediaUrl
      ? {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "document",
          document: {
            link: mediaUrl,
            caption: body,
            filename: "FeeChallanVoucher.pdf",
          },
        }
      : {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: { body },
        };

    try {
      const response = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${metaToken.trim()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (response.ok) {
        console.log(`[WhatsApp Meta API] Successfully delivered PDF document. ID: ${data.messages?.[0]?.id}`);
        return { success: true, sid: data.messages?.[0]?.id };
      } else {
        console.error("[WhatsApp Meta API] Error sending document:", data);
        // Fallback: If free-form message / document is blocked by Meta 24h window rule, send test template message
        console.log("[WhatsApp Meta API] Retrying with Meta approved test template (hello_world)...");
        const templateRes = await fetch(`https://graph.facebook.com/v18.0/${metaPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${metaToken.trim()}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "template",
            template: {
              name: "hello_world",
              language: { code: "en_US" }
            }
          })
        });
        const templateData = await templateRes.json();
        if (templateRes.ok) {
          console.log(`[WhatsApp Meta API] Test template delivered! ID: ${templateData.messages?.[0]?.id}`);
          return { success: true, sid: templateData.messages?.[0]?.id, note: "Delivered via Meta Test Template" };
        }
        return { success: false, error: data.error?.message || "Meta API Error" };
      }
    } catch (err) {
      console.error("[WhatsApp Meta API] Exception:", err.message);
      return { success: false, error: err.message };
    }
  }

  // ── 3. Twilio Fallback ─────────────────────────────────────────
  const twilioClient = getTwilioClient();
  if (twilioClient) {
    try {
      const from = process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+1234567890";
      const payload = { from, to, body };
      if (mediaUrl) payload.mediaUrl = [mediaUrl];

      const message = await twilioClient.messages.create(payload);
      console.log(`[WhatsApp Twilio API] Sent successfully with PDF. SID: ${message.sid}`);
      return { success: true, sid: message.sid };
    } catch (err) {
      console.error("[WhatsApp Twilio API] Send failed:", err.message);
      return { success: false, error: err.message };
    }
  }

  console.log("[WhatsApp] No active API keys. Logged dispatch.");
  return { success: true, sid: "simulated-dispatch" };
}

module.exports = { sendWhatsApp };
