/**
 * ============================================================
 * LearnNova Notifications — Express Routes
 * ============================================================
 *
 * Two POST endpoints with dual input modes:
 *
 *   POST /api/notify/challan  → triggers "challan_generated" notification
 *   POST /api/notify/payment  → triggers "payment_confirmed" notification
 *
 * ── Input modes ──────────────────────────────────────────
 *
 * 1. DB-backed (preferred) — send { challanId: 42 }:
 *    The route fetches challan data, student, school, and
 *    guardian contact info from Supabase automatically.
 *    After sending notifications, it updates the DB record
 *    with the generated PDF URL.
 *
 * 2. Full body (backward compatible) — send { recipient, data }:
 *    Uses the provided data directly without any DB queries.
 *    No DB updates are performed.
 *
 * Both modes follow the same core flow:
 *   1. Validate request body
 *   2. Resolve data + recipient (from DB or request body)
 *   3. Call sendNotification (PDF → upload → dispatch)
 *   4. Update DB record with PDF URL (DB mode only)
 *   5. Return per-channel delivery summary + PDF link
 *
 * ── DB-backed request shapes ─────────────────────────────
 *
 * POST /api/notify/challan
 * { "challanId": 42 }
 *
 * POST /api/notify/payment
 * {
 *   "challanId": 42,
 *   "paymentDate": "2026-08-25",
 *   "paymentMethod": "Bank Transfer (HBL)",
 *   "paymentId": 101          ← optional, for receipt_url update
 * }
 *
 * ── Full body request shape (backward compatible) ────────
 * {
 *   "recipient": { "phone": "...", "email": "...", "whatsappOptIn": true },
 *   "data": { "schoolName": "...", "studentName": "...", ... }
 * }
 */

const { Router } = require("express");
const { sendNotification } = require("../services/notificationService");
const { validateChallanRequest, validatePaymentRequest } = require("../utils/validation");
const {
  fetchChallanData,
  fetchGuardianForChallan,
  fetchPaymentData,
  updateChallanPdfUrl,
  updatePaymentReceiptUrl,
} = require("../services/dbLookup");

const router = Router();

// ── POST /api/notify/challan ────────────────────────────────
router.post("/challan", async (req, res) => {
  try {
    // Step 1 — Validate
    const { valid, errors, mode } = validateChallanRequest(req.body);
    if (!valid) {
      return res.status(400).json({ success: false, errors });
    }

    let recipient;
    let data;
    let challanId = null;

    if (mode === "db") {
      // ── DB-backed mode ──────────────────────────────────
      challanId = req.body.challanId;
      console.log(`[notify/challan] DB mode — fetching challan ${challanId}...`);

      // Fetch challan data + guardian in parallel
      const [fetchedData, fetchedRecipient] = await Promise.all([
        fetchChallanData(challanId),
        fetchGuardianForChallan(challanId),
      ]);

      if (!fetchedData) {
        return res.status(404).json({
          success: false,
          errors: [`Challan with id ${challanId} not found in the database.`],
        });
      }

      data = fetchedData;

      if (!fetchedRecipient || (!fetchedRecipient.phone && !fetchedRecipient.email)) {
        console.warn(`[notify/challan] No guardian contact found for challan ${challanId} — generating PDF only, skipping notifications.`);
        // Use a dummy recipient so PDF still generates; notifications will gracefully fail
        recipient = { phone: '', email: '', whatsappOptIn: false };
      } else {
        recipient = fetchedRecipient;
      }

      // ── Phone override: if request includes a phone, use it ──
      if (req.body.phone) {
        console.log(`[notify/challan] Using phone override from request: ${req.body.phone}`);
        recipient = { ...recipient, phone: req.body.phone };
      }
    } else {
      // ── Full body mode (backward compatible) ────────────
      recipient = req.body.recipient;
      data = req.body.data;
    }

    // Step 2 — Send notifications (generates PDF → uploads → dispatches)
    const summary = await sendNotification("challan_generated", recipient, data);

    // Step 3 — Update DB with PDF URL (DB mode only)
    if (mode === "db" && summary.pdfLink) {
      const updated = await updateChallanPdfUrl(challanId, summary.pdfLink);
      if (!updated) {
        console.warn(`[notify/challan] Failed to update challan ${challanId} pdf_url.`);
      }
    }

    // Step 4 — Return delivery summary
    return res.json({ success: true, summary });
  } catch (err) {
    console.error("[notify/challan] Error:", err.message);
    return res.status(500).json({
      success: false,
      errors: ["An internal error occurred while sending notifications."],
    });
  }
});

// ── POST /api/notify/pdf/challan — Direct PDF download (no Storage needed) ──
router.post("/pdf/challan", async (req, res) => {
  try {
    const { challanId } = req.body;
    if (!challanId) {
      return res.status(400).json({ success: false, errors: ["challanId is required."] });
    }

    console.log(`[pdf/challan] Generating PDF for challan ${challanId}...`);
    const data = await fetchChallanData(challanId);

    if (!data) {
      return res.status(404).json({ success: false, errors: [`Challan ${challanId} not found.`] });
    }

    const { generateChallanPDF } = require("../services/pdfGenerator");
    const pdfBuffer = await generateChallanPDF(data);

    // Return as base64 data URL — works without Storage
    const base64 = pdfBuffer.toString("base64");
    const dataUrl = `data:application/pdf;base64,${base64}`;

    console.log(`[pdf/challan] PDF generated: ${pdfBuffer.length} bytes`);
    return res.json({
      success: true,
      pdfBase64: dataUrl,
      filename: `challan-${data.challanNumber}.pdf`,
    });
  } catch (err) {
    console.error("[pdf/challan] Error:", err.message);
    return res.status(500).json({ success: false, errors: [err.message] });
  }
});

// ── POST /api/notify/payment ────────────────────────────────
router.post("/payment", async (req, res) => {
  try {
    // Step 1 — Validate
    const { valid, errors, mode } = validatePaymentRequest(req.body);
    if (!valid) {
      return res.status(400).json({ success: false, errors });
    }

    let recipient;
    let data;
    let challanId = null;
    let paymentId = null;

    if (mode === "db") {
      // ── DB-backed mode ──────────────────────────────────
      challanId = req.body.challanId;
      paymentId = req.body.paymentId || null;
      console.log(`[notify/payment] DB mode — fetching challan ${challanId}...`);

      // Fetch challan data + guardian in parallel
      const [fetchedData, fetchedRecipient] = await Promise.all([
        fetchPaymentData(challanId),
        fetchGuardianForChallan(challanId),
      ]);

      if (!fetchedData) {
        return res.status(404).json({
          success: false,
          errors: [`Challan with id ${challanId} not found in the database.`],
        });
      }

      // Merge payment-specific fields from the request body
      data = {
        ...fetchedData,
        paymentDate:   req.body.paymentDate,
        paymentMethod: req.body.paymentMethod,
      };

      if (!fetchedRecipient || (!fetchedRecipient.phone && !fetchedRecipient.email)) {
        console.warn(`[notify/payment] No guardian contact found for challan ${challanId} — generating receipt PDF only, skipping notifications.`);
        recipient = { phone: '', email: '', whatsappOptIn: false };
      } else {
        recipient = fetchedRecipient;
      }
    } else {
      // ── Full body mode (backward compatible) ────────────
      recipient = req.body.recipient;
      data = req.body.data;
    }

    // Step 2 — Send notifications (generates PDF → uploads → dispatches)
    const summary = await sendNotification("payment_confirmed", recipient, data);

    // Step 3 — Update DB with receipt URL (DB mode only)
    if (mode === "db" && summary.pdfLink) {
      // Update challan pdf_url as well (the receipt is linked to the challan)
      await updateChallanPdfUrl(challanId, summary.pdfLink);

      // If a paymentId was provided, also update payments.receipt_url
      if (paymentId) {
        const updated = await updatePaymentReceiptUrl(paymentId, summary.pdfLink);
        if (!updated) {
          console.warn(`[notify/payment] Failed to update payment ${paymentId} receipt_url.`);
        }
      }
    }

    // Step 4 — Return delivery summary
    return res.json({ success: true, summary });
  } catch (err) {
    console.error("[notify/payment] Error:", err.message);
    return res.status(500).json({
      success: false,
      errors: ["An internal error occurred while sending notifications."],
    });
  }
});


// ── GET /api/pdf/challan/:challanId — Serve PDF directly ──
router.get("/pdf/challan/:challanId", async (req, res) => {
  try {
    const { challanId } = req.params;
    console.log(`[GET pdf/challan] Generating PDF for ${challanId}...`);

    const data = await fetchChallanData(challanId);
    if (!data) {
      return res.status(404).json({ success: false, errors: ["Challan not found."] });
    }

    const { generateChallanPDF } = require("../services/pdfGenerator");
    const pdfBuffer = await generateChallanPDF(data);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="challan-${data.challanNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error("[GET pdf/challan] Error:", err.message);
    res.status(500).json({ success: false, errors: [err.message] });
  }
});

module.exports = router;
