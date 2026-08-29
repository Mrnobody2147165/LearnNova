/**
 * ============================================================
 * Learnify Notifications — Unified Notification Service
 * ============================================================
 *
 * Orchestrates the full notification pipeline:
 *   1. Generate the relevant PDF (challan or receipt)
 *   2. Upload it to Supabase Storage and get a public URL
 *   3. Send the notification (with PDF link) across all
 *      available channels: WhatsApp, SMS, Email
 *
 * Each channel runs independently via Promise.allSettled —
 * one failure never blocks the others.
 *
 * If PDF generation or Supabase upload fails, the notification
 * is still sent — just without the download link.
 *
 * Public API:
 *   sendNotification(type, recipient, data)
 *
 *   type      — "challan_generated" | "payment_confirmed"
 *   recipient — { phone, email, whatsappOptIn }
 *   data      — challan / receipt fields (studentName, etc.)
 *
 * Returns a summary object with per-channel results and the
 * PDF link (if upload succeeded).
 *
 * ── Message templates ─────────────────────────────────────
 * Edit the TEMPLATES object below to reword notifications.
 * Each template function receives (data, pdfLink).
 */

const { generateChallanPDF, generateReceiptPDF } = require("./pdfGenerator");
const { uploadPDFAndGetLink }                    = require("./storageService");
const { sendWhatsApp }                           = require("./whatsappService");
const { sendSMS }                                = require("./smsService");
const { sendEmail }                              = require("./emailService");

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

/** Format a number as Pakistani Rupees (PKR). */
function formatCurrency(n) {
  return "PKR " + Number(n).toLocaleString("en-PK");
}

/** Format an ISO date string into a readable form. */
function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

// ────────────────────────────────────────────────────────────
// MESSAGE TEMPLATES
// ────────────────────────────────────────────────────────────
// Each template function receives (d = data, link = pdfLink).
// If upload failed, `link` will be null — templates handle
// that gracefully by omitting the download line.
// ────────────────────────────────────────────────────────────

const TEMPLATES = {

  // ── Challan generated: tells parent a new fee challan is ready ──
  challan_generated: {
    pdfFilename: (d) => `challan-${d.challanNumber}.pdf`,
    generatePDF: generateChallanPDF,

    whatsapp: (d, link) =>
      `Dear parent,\n\nA new fee challan has been generated for ${d.studentName}.\n\n` +
      `Challan No: ${d.challanNumber}\n` +
      `Total Amount: ${formatCurrency(d.totalAmount)}\n` +
      `Due Date: ${formatDate(d.dueDate)}\n\n` +
      (link ? `View/download your challan: ${link}\n\n` : "") +
      `Please pay before the due date to avoid late fees.\n\n` +
      `— Learnify`,

    sms: (d, link) =>
      `Learnify: Fee challan ${d.challanNumber} for ${d.studentName}. ` +
      `Amount: ${formatCurrency(d.totalAmount)}. Due: ${formatDate(d.dueDate)}. ` +
      (link ? `Download: ${link} ` : "") +
      `Please pay before the due date.`,

    emailSubject: (d) =>
      `New Fee Challan — ${d.studentName} (${d.challanNumber})`,

    emailHtml: (d, link) =>
      `<div style="font-family: Arial, sans-serif; color: #222;">` +
      `<h2 style="color: #1a5276;">Fee Challan Generated</h2>` +
      `<p>Dear Parent,</p>` +
      `<p>A new fee challan has been issued for <strong>${d.studentName}</strong>.</p>` +
      `<table style="border-collapse: collapse; margin: 16px 0;">` +
      `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Challan No.</td>` +
      `<td style="padding: 4px 0;">${d.challanNumber}</td></tr>` +
      `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Total Amount</td>` +
      `<td style="padding: 4px 0;">${formatCurrency(d.totalAmount)}</td></tr>` +
      `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Due Date</td>` +
      `<td style="padding: 4px 0; color: #c0392b; font-weight: bold;">${formatDate(d.dueDate)}</td></tr>` +
      `</table>` +
      (link
        ? `<p><a href="${link}" style="display: inline-block; background: #1a5276; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View / Download Challan PDF</a></p>`
        : `<p style="color: #999;">PDF link unavailable — please contact the school office.</p>`) +
      `<p>Please pay before the due date to avoid late fees.</p>` +
      `<p style="color: #555; font-size: 12px;">— Learnify Fee Management System</p>` +
      `</div>`,
  },

  // ── Payment confirmed: confirms payment received, thanks them ───
  payment_confirmed: {
    pdfFilename: (d) => `receipt-${d.challanNumber}.pdf`,
    generatePDF: generateReceiptPDF,

    whatsapp: (d, link) =>
      `Dear parent,\n\nPayment confirmed for ${d.studentName}.\n\n` +
      `Challan No: ${d.challanNumber}\n` +
      `Amount Paid: ${formatCurrency(d.totalAmount)}\n` +
      `Payment Date: ${formatDate(d.paymentDate)}\n` +
      `Method: ${d.paymentMethod || "N/A"}\n\n` +
      (link ? `View/download your receipt: ${link}\n\n` : "") +
      `Thank you for the timely payment!\n\n` +
      `— Learnify`,

    sms: (d, link) =>
      `Learnify: Payment confirmed for ${d.studentName} (Challan ${d.challanNumber}). ` +
      `Amount: ${formatCurrency(d.totalAmount)} received on ${formatDate(d.paymentDate)}. ` +
      (link ? `Receipt: ${link} ` : "") +
      `Thank you!`,

    emailSubject: (d) =>
      `Payment Confirmed — ${d.studentName} (${d.challanNumber})`,

    emailHtml: (d, link) =>
      `<div style="font-family: Arial, sans-serif; color: #222;">` +
      `<h2 style="color: #27ae60;">Payment Confirmed ✓</h2>` +
      `<p>Dear Parent,</p>` +
      `<p>We have received payment for <strong>${d.studentName}</strong>. Thank you!</p>` +
      `<table style="border-collapse: collapse; margin: 16px 0;">` +
      `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Challan No.</td>` +
      `<td style="padding: 4px 0;">${d.challanNumber}</td></tr>` +
      `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Amount Paid</td>` +
      `<td style="padding: 4px 0; color: #27ae60; font-weight: bold;">${formatCurrency(d.totalAmount)}</td></tr>` +
      `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Payment Date</td>` +
      `<td style="padding: 4px 0;">${formatDate(d.paymentDate)}</td></tr>` +
      `<tr><td style="padding: 4px 12px 4px 0; font-weight: bold;">Method</td>` +
      `<td style="padding: 4px 0;">${d.paymentMethod || "N/A"}</td></tr>` +
      `</table>` +
      (link
        ? `<p><a href="${link}" style="display: inline-block; background: #27ae60; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View / Download Receipt PDF</a></p>`
        : `<p style="color: #999;">PDF link unavailable — please contact the school office.</p>`) +
      `<p>Thank you for the timely payment.</p>` +
      `<p style="color: #555; font-size: 12px;">— Learnify Fee Management System</p>` +
      `</div>`,
  },
};

// ────────────────────────────────────────────────────────────
// UNIFIED SEND FUNCTION
// ────────────────────────────────────────────────────────────

/**
 * Send a notification across all available channels, with an
 * auto-generated PDF uploaded to Supabase Storage.
 *
 * Flow:
 *   1. Generate PDF buffer from data
 *   2. Upload to Supabase Storage → get public URL
 *   3. Fire WhatsApp + SMS + Email concurrently, each
 *      including the PDF download link in its message
 *
 * If step 1 or 2 fails, the notification is still sent
 * (just without the download link) — the failure is logged.
 *
 * @param {string} type       — "challan_generated" | "payment_confirmed"
 * @param {Object} recipient  — { phone, email, whatsappOptIn }
 * @param {Object} data       — challan/receipt fields (studentName, etc.)
 * @returns {Promise<Object>} — per-channel delivery summary + pdfLink
 */
async function sendNotification(type, recipient, data) {
  const template = TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown notification type: "${type}".`);
  }

  // ── Normalise recipient fields ────────────────────────────
  const phone         = (recipient.phone || "").trim();
  const email         = (recipient.email || "").trim();
  const whatsappOptIn = recipient.whatsappOptIn === true;

  // ── Summary object — tracks each channel's outcome ────────
  const summary = {
    pdfLink:  null,
    whatsapp: { attempted: false, success: false, detail: null },
    sms:      { attempted: false, success: false, detail: null },
    email:    { attempted: false, success: false, detail: null },
  };

  // ── Step 1 — Generate PDF ─────────────────────────────────
  let pdfLink = null;
  try {
    console.log(`[Notification] Generating ${type} PDF...`);
    const pdfBuffer = await template.generatePDF(data);
    const filename  = template.pdfFilename(data);

    // ── Step 2 — Upload to Supabase Storage ─────────────────
    console.log(`[Notification] Uploading PDF to Supabase Storage...`);
    const uploadResult = await uploadPDFAndGetLink(pdfBuffer, filename);

    if (uploadResult.success) {
      pdfLink = uploadResult.url;
      summary.pdfLink = pdfLink;
      console.log(`[Notification] PDF link: ${pdfLink}`);
    } else {
      // Upload failed — log but don't block notification
      console.warn(
        `[Notification] PDF upload failed (${uploadResult.error}). ` +
        `Sending notification without download link.`
      );
    }
  } catch (err) {
    // PDF generation or upload crashed — log and continue
    console.error(`[Notification] PDF pipeline error:`, err.message);
    console.warn(`[Notification] Sending notification without download link.`);
  }

  // ── Step 3 — Fire all channels concurrently ───────────────
  // Promise.allSettled ensures one rejection doesn't cancel others
  const tasks = [];

  // WhatsApp — only if opted in AND phone is present
  if (whatsappOptIn && phone) {
    const to = phone.startsWith("whatsapp:") ? phone : `whatsapp:${phone}`;
    tasks.push(
      sendWhatsApp(to, template.whatsapp(data, pdfLink), pdfLink)
        .then((r) => ({ channel: "whatsapp", result: r }))
    );
  }

  // SMS — if phone is present
  if (phone) {
    const to = phone.startsWith("whatsapp:") ? phone.replace("whatsapp:", "") : phone;
    tasks.push(
      sendSMS(to, template.sms(data, pdfLink))
        .then((r) => ({ channel: "sms", result: r }))
    );
  }

  // Email — if email is present
  if (email) {
    tasks.push(
      sendEmail(email, template.emailSubject(data), template.emailHtml(data, pdfLink))
        .then((r) => ({ channel: "email", result: r }))
    );
  }

  // ── Wait for all channels to settle ───────────────────────
  const settled = await Promise.allSettled(tasks);

  for (const outcome of settled) {
    if (outcome.status === "fulfilled") {
      const { channel, result } = outcome.value;
      summary[channel] = {
        attempted: true,
        success: result.success,
        detail: result.success
          ? (result.sid || result.messageId || "sent")
          : result.error,
      };
    } else {
      // Unexpected rejection — shouldn't happen since each
      // service catches its own errors, but guard anyway
      console.error("[Notification] Unexpected channel error:", outcome.reason);
    }
  }

  // ── Log the overall delivery summary ──────────────────────
  const succeeded = Object.entries(summary)
    .filter(([k]) => k !== "pdfLink")
    .filter(([, s]) => s.success).length;
  const attempted = Object.entries(summary)
    .filter(([k]) => k !== "pdfLink")
    .filter(([, s]) => s.attempted).length;

  console.log(
    `[Notification] "${type}" → ${succeeded}/${attempted} channels succeeded` +
    (pdfLink ? ` (PDF: ${pdfLink})` : " (no PDF link)")
  );

  return summary;
}

module.exports = { sendNotification };
