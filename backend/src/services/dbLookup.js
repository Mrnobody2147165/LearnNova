/**
 * ============================================================
 * Learnify — Database Lookup Helpers
 * ============================================================
 *
 * Shared functions that query the Supabase database to build
 * the data objects needed by the PDF generator and the
 * notification service.
 *
 * Every function returns null (or a sensible fallback) when
 * the DB client is unavailable or the row doesn't exist, so
 * callers can fall back to request-body data gracefully.
 *
 * ── Public API ────────────────────────────────────────────
 *   fetchChallanData(challanId)
 *     → full challan + items + student + school for PDF gen
 *
 *   fetchGuardianForChallan(challanId)
 *     → { phone, email, whatsappOptIn } from the student's
 *       guardian record
 *
 *   fetchPaymentData(challanId)
 *     → challan + student + school data for receipt PDF
 *       (payment-specific fields come from the request body)
 *
 *   updateChallanPdfUrl(challanId, url)
 *   updatePaymentReceiptUrl(paymentId, url)
 *     → write the generated PDF link back to the DB
 */

const { getDb } = require("./db");

const isUUID = (v) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(v || ''));

/**
 * Build a query filter that matches either the UUID id column
 * or the challan_number column, depending on the input format.
 */
function filterByIdOrNumber(query, idValue) {
  if (isUUID(idValue)) {
    return query.eq("id", idValue);
  }
  return query.eq("challan_number", String(idValue));
}

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

/**
 * Map a raw DB challan row + related data into the shape
 * expected by the PDF generator and notification templates.
 */
function mapChallanToData(challan, items, student, school) {
  return {
    schoolName:        school.name,
    studentName:       student.name,
    studentId:         student.student_id_code,
    className:         student.classes?.name || student.current_class_id || "",
    challanNumber:     challan.challan_number,
    issueDate:         challan.issue_date,
    dueDate:           challan.due_date,
    totalAmount:       challan.total_amount,
    baseAmount:        challan.base_amount,
    discountAmount:    challan.discount_amount || 0,
    lateFee:           challan.late_fee || 0,
    feeItems:          (items || []).map((it) => ({
      description: it.item_name,
      amount:      it.amount,
    })),
    paymentInstructions: "Pay via bank transfer or online portal before due date.",
  };
}

/**
 * Map a guardian row into the recipient shape expected by
 * the notification service.
 */
function mapGuardianToRecipient(guardian) {
  if (!guardian) return null;
  return {
    phone:         guardian.phone || "",
    email:         guardian.email || "",
    whatsappOptIn: true,   // default to true; can be refined later
  };
}

// ────────────────────────────────────────────────────────────
// PUBLIC FUNCTIONS
// ────────────────────────────────────────────────────────────

/**
 * Fetch a challan with all related data needed for PDF generation.
 *
 * Queries: challans → challan_items, students, schools
 *
 * @param {number|string} challanId — primary key from the challans table
 * @returns {Promise<Object|null>} — mapped data object or null on failure
 */
async function fetchChallanData(challanId) {
  const db = getDb();
  if (!db) {
    console.warn("[DB Lookup] No DB client — cannot fetch challan data.");
    return null;
  }

  try {
    // Step 1 — Fetch the chall row (by UUID or challan_number)
    let chQuery = db.from("challans").select("*");
    chQuery = filterByIdOrNumber(chQuery, challanId);
    const { data: challan, error: cErr } = await chQuery.maybeSingle();

    if (cErr || !challan) {
      console.error(`[DB Lookup] Challan ${challanId} not found:`, cErr?.message);
      return null;
    }

    // Step 2 — Fetch related rows in parallel
    const [itemsRes, studentRes, schoolRes] = await Promise.all([
      db.from("challan_items").select("*").eq("challan_id", challanId),
      db.from("students").select("*, classes:current_class_id(name)").eq("id", challan.student_id).single(),
      db.from("schools").select("*").eq("id", challan.school_id).single(),
    ]);

    const items  = itemsRes.data  || [];
    const student = studentRes.data;
    const school  = schoolRes.data;

    if (!student) {
      console.error(`[DB Lookup] Student ${challan.student_id} not found.`);
      return null;
    }
    if (!school) {
      console.error(`[DB Lookup] School ${challan.school_id} not found.`);
      return null;
    }

    // Step 3 — Map to the shape the PDF generator expects
    return mapChallanToData(challan, items, student, school);
  } catch (err) {
    console.error("[DB Lookup] fetchChallanData error:", err.message);
    return null;
  }
}

/**
 * Fetch the guardian contact details for the student linked
 * to a given challan.
 *
 * Path: challans → students.guardian_id → guardians
 *
 * @param {number|string} challanId
 * @returns {Promise<Object|null>} — { phone, email, whatsappOptIn } or null
 */
async function fetchGuardianForChallan(challanId) {
  const db = getDb();
  if (!db) {
    console.warn("[DB Lookup] No DB client — cannot fetch guardian.");
    return null;
  }

  try {
    // Step 1 — Get the challan to find student_id (by UUID or challan_number)
    let chQuery = db.from("challans").select("student_id");
    chQuery = filterByIdOrNumber(chQuery, challanId);
    const { data: challan, error: cErr } = await chQuery.maybeSingle();

    if (cErr || !challan) {
      console.error(`[DB Lookup] Challan ${challanId} not found for guardian lookup.`);
      return null;
    }

    // Step 2 — Get the student to find guardian_id
    const { data: student, error: sErr } = await db
      .from("students")
      .select("guardian_id")
      .eq("id", challan.student_id)
      .single();

    if (sErr || !student || !student.guardian_id) {
      // No guardian linked — fall back to student's own contact
      console.warn(`[DB Lookup] No guardian for student ${challan.student_id}, using student contact.`);
      return {
        phone:         student?.phone || "",
        email:         student?.email || "",
        whatsappOptIn: true,
      };
    }

    // Step 3 — Get the guardian
    const { data: guardian, error: gErr } = await db
      .from("guardians")
      .select("*")
      .eq("id", student.guardian_id)
      .single();

    if (gErr || !guardian) {
      console.error(`[DB Lookup] Guardian ${student.guardian_id} not found.`);
      return null;
    }

    return mapGuardianToRecipient(guardian);
  } catch (err) {
    console.error("[DB Lookup] fetchGuardianForChallan error:", err.message);
    return null;
  }
}

/**
 * Fetch challan + student + school data for building a receipt PDF.
 * Payment-specific fields (amount_paid, payment_date, payment_method)
 * come from the request body since they may not be in the DB yet.
 *
 * @param {number|string} challanId
 * @returns {Promise<Object|null>} — mapped data or null
 */
async function fetchPaymentData(challanId) {
  // The receipt uses the same challan data plus payment fields
  return fetchChallanData(challanId);
}

/**
 * Update the pdf_url column on the challans table after
 * a PDF has been generated and uploaded.
 *
 * @param {number|string} challanId
 * @param {string} url — public PDF URL
 * @returns {Promise<boolean>} — true if update succeeded
 */
async function updateChallanPdfUrl(challanId, url) {
  const db = getDb();
  if (!db) return false;

  try {
    let updQuery = db.from("challans").update({ pdf_url: url });
    updQuery = filterByIdOrNumber(updQuery, challanId);
    const { error } = await updQuery;

    if (error) {
      console.error(`[DB] Failed to update challan ${challanId} pdf_url:`, error.message);
      return false;
    }

    console.log(`[DB] Challan ${challanId} pdf_url updated → ${url}`);
    return true;
  } catch (err) {
    console.error("[DB] updateChallanPdfUrl error:", err.message);
    return false;
  }
}

/**
 * Update the receipt_url column on the payments table after
 * a receipt PDF has been generated and uploaded.
 *
 * @param {number|string} paymentId
 * @param {string} url — public receipt URL
 * @returns {Promise<boolean>} — true if update succeeded
 */
async function updatePaymentReceiptUrl(paymentId, url) {
  const db = getDb();
  if (!db) return false;

  try {
    const { error } = await db
      .from("payments")
      .update({ receipt_url: url })
      .eq("id", paymentId);

    if (error) {
      console.error(`[DB] Failed to update payment ${paymentId} receipt_url:`, error.message);
      return false;
    }

    console.log(`[DB] Payment ${paymentId} receipt_url updated → ${url}`);
    return true;
  } catch (err) {
    console.error("[DB] updatePaymentReceiptUrl error:", err.message);
    return false;
  }
}

module.exports = {
  fetchChallanData,
  fetchGuardianForChallan,
  fetchPaymentData,
  updateChallanPdfUrl,
  updatePaymentReceiptUrl,
};
