/**
 * ============================================================
 * LearnNova PDF Generator — Fee Challan & Payment Receipt
 * ============================================================
 *
 * Reusable module that produces professional, print-ready PDFs
 * using pdfkit (vector-based, no headless browser needed).
 *
 * Two public functions:
 *   • generateChallanPDF(data) — fee demand slip for bank/payment
 *   • generateReceiptPDF(data) — post-payment confirmation with
 *                                a "PAID" watermark overlay
 *
 * Both return a Buffer (raw PDF bytes) so the caller can:
 *   – upload to Supabase Storage and share a public link
 *   – stream it as a download
 *   – save to disk
 *
 * ── Branding knobs ──────────────────────────────────────────
 * All colours, fonts, and sizes live in the BRAND constant
 * below — tweak them once to re-skin every PDF.
 */

const PDFDocument = require("pdfkit");
const QRCode = require("qrcode");

// ────────────────────────────────────────────────────────────
// BRANDING / THEME — edit these to match your school identity
// ────────────────────────────────────────────────────────────
const BRAND = {
  primary:    "#1a5276",   // deep blue — header & total bar
  accent:     "#27ae60",   // green — "PAID" stamp
  danger:     "#c0392b",   // red — due-date highlight
  lightBg:    "#eaf2f8",   // pale blue — table header row
  totalBg:    "#1a5276",   // dark bar behind total
  textDark:   "#222222",
  textLight:  "#ffffff",
  textMuted:  "#555555",
  borderColor:"#cccccc",
  fontFamily: "Helvetica",        // built-in pdfkit font
  fontBold:   "Helvetica-Bold",   // built-in pdfkit font
};

// ────────────────────────────────────────────────────────────
// PAGE CONSTANTS (A4 portrait)
// ────────────────────────────────────────────────────────────
const PAGE_W   = 595;
const PAGE_H   = 842;
const MARGIN   = 50;
const USABLE_W = PAGE_W - MARGIN * 2; // 495 pts

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

/** Draw a horizontal rule. */
function drawLine(doc, y, color = BRAND.borderColor) {
  doc.moveTo(MARGIN, y).lineTo(MARGIN + USABLE_W, y).strokeColor(color).lineWidth(0.8).stroke();
}

/** Draw a filled rectangle. */
function drawFilledRect(doc, x, y, w, h, fill) {
  doc.rect(x, y, w, h).fill(fill);
}

/** Generate a QR code PNG buffer for the given text. */
async function makeQR(text) {
  return QRCode.toBuffer(text, { width: 100, margin: 1, color: { dark: BRAND.primary } });
}

// ────────────────────────────────────────────────────────────
// SECTION RENDERERS — each writes to `doc` and returns the
// new Y cursor so the next section knows where to start.
// ────────────────────────────────────────────────────────────

/**
 * Header: School name (centered) + document type subtitle + divider.
 */
function renderHeader(doc, data, type) {
  let y = MARGIN;

  // School name — large, bold, centred
  doc.font(BRAND.fontBold).fontSize(20).fillColor(BRAND.primary)
     .text(data.schoolName, MARGIN, y, { width: USABLE_W, align: "center" });
  y = doc.y + 4;

  // Subtitle
  const subtitle = type === "receipt" ? "PAYMENT RECEIPT" : "FEE CHALLAN";
  doc.fontSize(11).fillColor(BRAND.textMuted)
     .text(subtitle, MARGIN, y, { width: USABLE_W, align: "center" });
  y = doc.y + 8;

  // Divider
  drawLine(doc, y, BRAND.primary);
  y += 14;

  return y;
}

/**
 * Student / challan meta block — two columns.
 */
function renderDetails(doc, data, y, type) {
  const colW   = USABLE_W / 2;
  const lineH  = 17;

  // ── Left column ─────────────────────────────────────────
  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textMuted);
  doc.text("CHALLAN NO.", MARGIN, y);
  doc.font(BRAND.fontBold).fontSize(11).fillColor(BRAND.textDark);
  doc.text(data.challanNumber, MARGIN, y + lineH);

  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textMuted);
  doc.text("STUDENT NAME", MARGIN, y + lineH * 2.5);
  doc.font(BRAND.fontBold).fontSize(11).fillColor(BRAND.textDark);
  doc.text(data.studentName, MARGIN, y + lineH * 3.5);

  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textMuted);
  doc.text("STUDENT ID", MARGIN, y + lineH * 5);
  doc.font(BRAND.fontBold).fontSize(11).fillColor(BRAND.textDark);
  doc.text(data.studentId, MARGIN, y + lineH * 6);

  // ── Right column ────────────────────────────────────────
  const rx = MARGIN + colW;

  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textMuted);
  doc.text("CLASS", rx, y);
  doc.font(BRAND.fontBold).fontSize(11).fillColor(BRAND.textDark);
  doc.text(data.className, rx, y + lineH);

  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textMuted);
  doc.text("ISSUE DATE", rx, y + lineH * 2.5);
  doc.font(BRAND.fontBold).fontSize(11).fillColor(BRAND.textDark);
  doc.text(formatDate(data.issueDate), rx, y + lineH * 3.5);

  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textMuted);
  doc.text("DUE DATE", rx, y + lineH * 5);
  doc.font(BRAND.fontBold).fontSize(11).fillColor(BRAND.danger);
  doc.text(formatDate(data.dueDate), rx, y + lineH * 6);

  return y + lineH * 7.5;
}

/**
 * Fee items table with alternating row shading.
 */
function renderTable(doc, data, y) {
  const rowH    = 22;
  const headerH = 24;
  const colDesc = USABLE_W * 0.65;
  const colAmt  = USABLE_W * 0.35;

  // ── Table header row ────────────────────────────────────
  drawFilledRect(doc, MARGIN, y, USABLE_W, headerH, BRAND.lightBg);
  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.primary);
  doc.text("DESCRIPTION", MARGIN + 8, y + 7);
  doc.text("AMOUNT", MARGIN + colDesc + 8, y + 7, { width: colAmt, align: "right" });
  y += headerH;

  // ── Data rows ───────────────────────────────────────────
  doc.font(BRAND.fontFamily).fontSize(10).fillColor(BRAND.textDark);
  data.feeItems.forEach((item, i) => {
    // Alternating row background
    if (i % 2 === 0) {
      drawFilledRect(doc, MARGIN, y, USABLE_W, rowH, "#f9f9f9");
    }
    doc.fillColor(BRAND.textDark);
    doc.text(item.description, MARGIN + 8, y + 6);
    doc.text(formatCurrency(item.amount), MARGIN + colDesc + 8, y + 6, {
      width: colAmt,
      align: "right",
    });
    y += rowH;
  });

  // ── Total row — dark bar with white text ────────────────
  y += 4; // small gap
  drawFilledRect(doc, MARGIN, y, USABLE_W, 28, BRAND.totalBg);
  doc.font(BRAND.fontBold).fontSize(12).fillColor(BRAND.textLight);
  doc.text("TOTAL", MARGIN + 8, y + 8);
  doc.text(formatCurrency(data.totalAmount), MARGIN + 8, y + 8, {
    width: USABLE_W - 16,
    align: "right",
  });
  y += 36;

  return y;
}

/**
 * QR code (challan number) + payment instructions side-by-side.
 */
async function renderFooter(doc, data, y) {
  const qrSize = 80;
  const qrX    = MARGIN;
  const textX  = MARGIN + qrSize + 16;
  const textW  = USABLE_W - qrSize - 16;

  // Generate and embed QR code
  try {
    const qrBuf = await makeQR(data.challanNumber);
    doc.image(qrBuf, qrX, y, { width: qrSize, height: qrSize });
  } catch {
    // Fallback: draw a placeholder box if QR generation fails
    doc.rect(qrX, y, qrSize, qrSize).strokeColor(BRAND.borderColor).stroke();
    doc.font(BRAND.fontFamily).fontSize(7).fillColor(BRAND.textMuted)
       .text("QR", qrX + 30, y + 35);
  }

  // Payment instructions beside the QR code
  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.primary);
  doc.text("PAYMENT INSTRUCTIONS", textX, y);
  doc.font(BRAND.fontFamily).fontSize(9).fillColor(BRAND.textMuted);
  doc.text(
    data.paymentInstructions || "Please pay before the due date.",
    textX,
    doc.y + 4,
    { width: textW }
  );

  // Bank details placeholder — replace with real bank info
  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textDark);
  doc.text("Bank: ", textX, doc.y + 10, { continued: true });
  doc.font(BRAND.fontFamily).text("Ask your administrator for bank account details.");

  y = Math.max(y + qrSize, doc.y) + 16;

  // ── Bottom notice ───────────────────────────────────────
  drawLine(doc, y, BRAND.borderColor);
  y += 8;
  doc.font(BRAND.fontFamily).fontSize(7).fillColor(BRAND.textMuted)
     .text(
       `Generated by LearnNova  •  Challan: ${data.challanNumber}  •  ${formatDate(data.issueDate)}`,
       MARGIN,
       y,
       { width: USABLE_W, align: "center" }
     );

  return doc.y;
}

/**
 * Draw a diagonal "PAID" watermark across the page centre.
 * This uses a large rotated text stamp in semi-transparent green.
 */
function renderPaidStamp(doc) {
  doc.save();
  // Translate to page centre, rotate, draw text
  doc.translate(PAGE_W / 2, PAGE_H / 2);
  doc.rotate(-35);

  // Solid outline pass
  doc.font(BRAND.fontBold)
     .fontSize(90)
     .fillColor(BRAND.accent);
  doc.text("PAID", -140, -40, { width: 280, align: "center" });

  // Semi-transparent overlay for the "stamp" effect
  doc.fillOpacity(0.25);
  doc.font(BRAND.fontBold)
     .fontSize(90)
     .fillColor(BRAND.accent);
  doc.text("PAID", -140, -40, { width: 280, align: "center" });

  doc.fillOpacity(1);
  doc.restore();
}

/**
 * Render a "Payment Details" block for the receipt layout.
 */
function renderPaymentInfo(doc, data, y) {
  drawFilledRect(doc, MARGIN, y, USABLE_W, 46, "#eafaf1"); // light green bg
  const rx = MARGIN + 12;

  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.accent);
  doc.text("PAYMENT CONFIRMED", rx, y + 6);

  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textMuted);
  doc.text("PAID ON", rx, y + 22);
  doc.font(BRAND.fontFamily).fontSize(10).fillColor(BRAND.textDark);
  doc.text(formatDate(data.paymentDate), rx + 55, y + 21);

  doc.font(BRAND.fontBold).fontSize(9).fillColor(BRAND.textMuted);
  doc.text("METHOD", rx + 170, y + 22);
  doc.font(BRAND.fontFamily).fontSize(10).fillColor(BRAND.textDark);
  doc.text(data.paymentMethod || "—", rx + 225, y + 21);

  return y + 56;
}

// ────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────

/**
 * Generate a fee challan PDF (the demand slip sent before payment).
 *
 * @param {Object} data — See validation.js for the expected shape.
 * @returns {Promise<Buffer>}  Raw PDF bytes.
 */
async function generateChallanPDF(data) {
  // Create an in-memory document (no file path → buffer only)
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });

  // Collect all chunks into a single buffer
  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // ── Draw sections top-to-bottom ─────────────────────────
  let y = renderHeader(doc, data, "challan");
  y = renderDetails(doc, data, y, "challan");
  y += 10;
  y = renderTable(doc, data, y);
  await renderFooter(doc, data, y);

  doc.end();
  return done;
}

/**
 * Generate a payment receipt PDF (issued after payment is confirmed).
 * Uses the same layout as the challan but adds:
 *   • Payment date / method block
 *   • Diagonal "PAID" watermark
 *
 * @param {Object} data — Must include paymentDate & paymentMethod.
 * @returns {Promise<Buffer>}  Raw PDF bytes.
 */
async function generateReceiptPDF(data) {
  const doc = new PDFDocument({ size: "A4", margin: 0, autoFirstPage: true });

  const chunks = [];
  doc.on("data", (chunk) => chunks.push(chunk));
  const done = new Promise((resolve) => doc.on("end", () => resolve(Buffer.concat(chunks))));

  // ── Draw sections ───────────────────────────────────────
  let y = renderHeader(doc, data, "receipt");
  y = renderDetails(doc, data, y, "receipt");
  y += 6;
  y = renderPaymentInfo(doc, data, y);
  y += 6;
  y = renderTable(doc, data, y);
  await renderFooter(doc, data, y);

  // ── "PAID" watermark on top of everything ───────────────
  renderPaidStamp(doc);

  doc.end();
  return done;
}

module.exports = { generateChallanPDF, generateReceiptPDF };
