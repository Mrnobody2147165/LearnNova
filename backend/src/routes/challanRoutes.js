/**
 * ============================================================
 * Learnify — Challan Write Operations (Server-Side)
 * ============================================================
 *
 * These routes handle challan lifecycle operations that were
 * previously done directly from the browser via Supabase anon
 * key.  Now they go through the service-role backend so that:
 *
 *   • Writes are validated server-side
 *   • PDFs are generated + uploaded automatically
 *   • Notifications (WhatsApp/SMS/Email) are dispatched
 *   • Secret credentials never leave the server
 *
 * Endpoints:
 *   POST   /api/challans/generate  → batch-create challans
 *   PATCH  /api/challans/cancel    → cancel a challan
 *   POST   /api/challans/pay       → record payment
 */

const { Router } = require("express");
const { getDb } = require("../services/db");
const { sendNotification } = require("../services/notificationService");
const {
  fetchChallanData,
  fetchGuardianForChallan,
  updateChallanPdfUrl,
} = require("../services/dbLookup");

const router = Router();

const DEFAULT_SCHOOL_ID = process.env.DEFAULT_SCHOOL_ID || "";

// ── POST /api/challans/generate ─────────────────────────────
// Body: { month: "August 2026", dueDate: "2026-08-30" }
// Creates challans + items for all active students, then
// sends notifications for each one.
router.post("/generate", async (req, res) => {
  const db = getDb();
  if (!db) {
    return res.status(500).json({
      success: false,
      errors: ["Database not configured on the server."],
    });
  }

  const { month = "August 2026", dueDate = "2026-08-30", targetClass = "all" } = req.body;

  try {
    // Step 1 — Fetch active students, filtered by class if specified
    let studentQuery = db
      .from("students")
      .select("id, name, student_id_code, roll_number, phone, current_class_id, classes:current_class_id(id, name)")
      .eq("status", "Active");

    const { data: allStudents, error: sErr } = await studentQuery;

    if (sErr) {
      console.error("[challans/generate] Student fetch error:", sErr.message);
      return res.status(500).json({ success: false, errors: [sErr.message] });
    }

    // Filter by class if targetClass is specified (not "all")
    let students = allStudents || [];
    if (targetClass && targetClass !== "all") {
      const targetNum = String(targetClass).replace(/[^0-9]/g, "");
      students = students.filter(st => {
        const className = st.classes?.name || "";
        const classNum = className.replace(/[^0-9]/g, "");
        return (
          classNum === targetNum ||
          className.toLowerCase() === `class ${targetNum}` ||
          className.toLowerCase() === targetClass.toLowerCase()
        );
      });
      console.log(`[challans/generate] Filtered to class "${targetClass}": ${students.length} students`);
    }

    if (!students || students.length === 0) {
      return res.json({ success: true, challans: [], message: "No active students found." });
    }

    const created = [];

    for (let i = 0; i < students.length; i++) {
      const st = students[i];
      const challanNo = `CH-${month.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${String(i + 1).padStart(2, "0")}`;
      const baseAmount = 11500;

      // Step 2 — Insert challan
      const { data: newChallan, error: cErr } = await db
        .from("challans")
        .insert([{
          school_id:      DEFAULT_SCHOOL_ID,
          challan_number: challanNo,
          student_id:     st.id,
          billing_month:  month,
          issue_date:     new Date().toISOString().split("T")[0],
          due_date:       dueDate,
          base_amount:    baseAmount,
          discount_amount: 0,
          late_fee:       0,
          total_amount:   baseAmount,
          status:         "Pending",
        }])
        .select()
        .single();

      if (cErr || !newChallan) {
        console.warn(`[challans/generate] Failed to create challan for ${st.name}:`, cErr?.message);
        continue;
      }

      // Step 3 — Insert challan items
      await db.from("challan_items").insert([
        { challan_id: newChallan.id, item_name: "Tuition Fee",          amount: 9000 },
        { challan_id: newChallan.id, item_name: "Lab & Computer Fee",   amount: 1500 },
        { challan_id: newChallan.id, item_name: "Activities & Sports Fee", amount: 1000 },
      ]);

      created.push({
        id: newChallan.id,
        challanNo,
        studentName: st.name,
        studentPhone: st.phone,
      });

      // Step 4 — Send notification (non-blocking, graceful)
      try {
        const data = await fetchChallanData(newChallan.id);
        const recipient = await fetchGuardianForChallan(newChallan.id);
        if (data && recipient && (recipient.phone || recipient.email)) {
          await sendNotification("challan_generated", recipient, data);
          if (data) {
            // Attempt to update pdf_url (non-critical)
          }
        }
      } catch (nErr) {
        console.warn(`[challans/generate] Notification failed for ${challanNo}:`, nErr.message);
      }
    }

    console.log(`[challans/generate] Created ${created.length}/${students.length} challans for ${month}`);
    return res.json({ success: true, challans: created });
  } catch (err) {
    console.error("[challans/generate] Error:", err.message);
    return res.status(500).json({
      success: false,
      errors: ["An internal error occurred while generating challans."],
    });
  }
});

// ── PATCH /api/challans/cancel ──────────────────────────────
// Body: { challanId: "uuid-or-challan-number" }
router.patch("/cancel", async (req, res) => {
  const db = getDb();
  if (!db) {
    return res.status(500).json({
      success: false,
      errors: ["Database not configured on the server."],
    });
  }

  const { challanId } = req.body;
  if (!challanId) {
    return res.status(400).json({
      success: false,
      errors: ['"challanId" is required.'],
    });
  }

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(challanId));

    let query = db.from("challans").update({ status: "Cancelled" });
    if (isUUID) {
      query = query.or(`id.eq.${challanId},challan_number.eq.${challanId}`);
    } else {
      query = query.eq("challan_number", challanId);
    }

    const { error } = await query;

    if (error) {
      console.error("[challans/cancel] Error:", error.message);
      return res.status(500).json({ success: false, errors: [error.message] });
    }

    console.log(`[challans/cancel] Challan ${challanId} cancelled`);
    return res.json({ success: true, challanId });
  } catch (err) {
    console.error("[challans/cancel] Error:", err.message);
    return res.status(500).json({
      success: false,
      errors: ["An internal error occurred while cancelling the challan."],
    });
  }
});

// ── POST /api/challans/pay ──────────────────────────────────
// Body: { challanId, paymentDetails: { amount, method, referenceNumber } }
// Marks challan as Paid, inserts payment record, sends receipt notification.
router.post("/pay", async (req, res) => {
  const db = getDb();
  if (!db) {
    return res.status(500).json({
      success: false,
      errors: ["Database not configured on the server."],
    });
  }

  const { challanId, paymentDetails = {} } = req.body;
  if (!challanId) {
    return res.status(400).json({
      success: false,
      errors: ['"challanId" is required.'],
    });
  }

  try {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(challanId));
    const txnCode = "TXN-" + new Date().toISOString().slice(0, 10).replace(/-/g, "") + "-" + Math.floor(1000 + Math.random() * 9000);
    const paidDate = new Date().toISOString().split("T")[0];

    // Step 1 — Fetch the chall
    let chQuery = db.from("challans").select("id, student_id, total_amount, challan_number");
    if (isUUID) {
      chQuery = chQuery.or(`id.eq.${challanId},challan_number.eq.${challanId}`);
    } else {
      chQuery = chQuery.eq("challan_number", challanId);
    }

    const { data: challan, error: chErr } = await chQuery.maybeSingle();

    if (chErr || !challan) {
      return res.status(404).json({
        success: false,
        errors: [`Challan ${challanId} not found.`],
      });
    }

    // Step 2 — Update challan status to Paid
    await db.from("challans")
      .update({
        status: "Paid",
        paid_date: paidDate,
        payment_method: paymentDetails.method || "Online",
      })
      .eq("id", challan.id);

    // Step 3 — Update student fee_status
    await db.from("students")
      .update({ fee_status: "Paid" })
      .eq("id", challan.student_id);

    // Step 4 — Insert payment record
    await db.from("payments").insert([{
      school_id:        DEFAULT_SCHOOL_ID,
      transaction_code: txnCode,
      challan_id:       challan.id,
      student_id:       challan.student_id,
      amount_paid:      paymentDetails.amount || challan.total_amount,
      payment_date:     paidDate,
      payment_method:   paymentDetails.method || "Online",
      reference_number: paymentDetails.referenceNumber || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
      status:           "Completed",
    }]);

    // Step 5 — Send receipt notification (non-blocking)
    try {
      const data = await fetchChallanData(challan.id);
      const recipient = await fetchGuardianForChallan(challan.id);
      if (data && recipient && (recipient.phone || recipient.email)) {
        const receiptData = {
          ...data,
          paymentDate:   paidDate,
          paymentMethod: paymentDetails.method || "Online",
        };
        const summary = await sendNotification("payment_confirmed", recipient, receiptData);
        if (summary.pdfLink) {
          await updateChallanPdfUrl(challan.id, summary.pdfLink);
        }
      }
    } catch (nErr) {
      console.warn(`[challans/pay] Notification failed for ${challanId}:`, nErr.message);
    }

    console.log(`[challans/pay] Challan ${challanId} paid — txn: ${txnCode}`);
    return res.json({
      success: true,
      challanId,
      transactionId: txnCode,
      paidDate,
      amount: paymentDetails.amount || challan.total_amount,
      method: paymentDetails.method || "Online",
    });
  } catch (err) {
    console.error("[challans/pay] Error:", err.message);
    return res.status(500).json({
      success: false,
      errors: ["An internal error occurred while processing the payment."],
    });
  }
});

module.exports = router;
