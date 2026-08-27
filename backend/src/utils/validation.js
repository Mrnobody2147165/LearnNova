/**
 * ============================================================
 * Learnify Notifications — Input Validation Utilities
 * ============================================================
 *
 * Validates notification request payloads before dispatch.
 * Returns structured error messages so the API can respond
 * with clear 400-level feedback.
 *
 * ── Two input modes ──────────────────────────────────────
 *
 * 1. DB-backed mode (preferred):
 *    Send { "challanId": 42 } and the backend fetches all
 *    data + guardian contact from Supabase automatically.
 *
 *    For payments, also include payment-specific fields:
 *    { "challanId": 42, "paymentDate": "...", "paymentMethod": "..." }
 *
 * 2. Full body mode (backward compatible):
 *    Send the complete { recipient, data } objects and the
 *    backend uses them directly without querying the DB.
 *
 * Customize the REQUIRED_FIELDS and rules below to match
 * your data model.
 */

// ── Fields required in the "data" object (full body mode) ──
const CHALLAN_DATA_REQUIRED = [
  "studentName",
  "challanNumber",
  "dueDate",
  "totalAmount",
];

const PAYMENT_DATA_REQUIRED = [
  "studentName",
  "challanNumber",
  "totalAmount",
  "paymentDate",
  "paymentMethod",
];

// ── Payment-specific fields required when using challanId ──
const PAYMENT_EXTRA_REQUIRED = [
  "paymentDate",
  "paymentMethod",
];

/**
 * Validate a challan notification request.
 *
 * Accepts either:
 *   { challanId: 42 }                          → DB-backed
 *   { recipient: {...}, data: {...} }           → full body
 *
 * @param {Object} body — The full request body.
 * @returns {{ valid: boolean, errors: string[], mode: string }}
 *   mode — "db" if challanId was provided, "full" otherwise
 */
function validateChallanRequest(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object."], mode: null };
  }

  // ── DB-backed mode ────────────────────────────────────────
  if (body.challanId !== undefined) {
    if (typeof body.challanId !== "number" && typeof body.challanId !== "string") {
      errors.push('"challanId" must be a number or string.');
    }
    return { valid: errors.length === 0, errors, mode: "db" };
  }

  // ── Full body mode — same validation as before ────────────
  validateRecipient(body, errors);
  validateDataBlock(body, CHALLAN_DATA_REQUIRED, "challan_generated", errors);

  return { valid: errors.length === 0, errors, mode: "full" };
}

/**
 * Validate a payment notification request.
 *
 * Accepts either:
 *   { challanId: 42, paymentDate: "...", paymentMethod: "..." }
 *   { recipient: {...}, data: {...} }
 *
 * @param {Object} body — The full request body.
 * @returns {{ valid: boolean, errors: string[], mode: string }}
 */
function validatePaymentRequest(body) {
  const errors = [];

  if (!body || typeof body !== "object") {
    return { valid: false, errors: ["Request body must be a JSON object."], mode: null };
  }

  // ── DB-backed mode ────────────────────────────────────────
  if (body.challanId !== undefined) {
    if (typeof body.challanId !== "number" && typeof body.challanId !== "string") {
      errors.push('"challanId" must be a number or string.');
    }

    // Payment-specific fields must still come from the request
    for (const field of PAYMENT_EXTRA_REQUIRED) {
      if (body[field] === undefined || body[field] === null || body[field] === "") {
        errors.push(`Missing required field: "${field}".`);
      }
    }

    // Date sanity
    if (body.paymentDate && isNaN(Date.parse(body.paymentDate))) {
      errors.push('"paymentDate" is not a valid date string.');
    }

    return { valid: errors.length === 0, errors, mode: "db" };
  }

  // ── Full body mode ────────────────────────────────────────
  validateRecipient(body, errors);
  validateDataBlock(body, PAYMENT_DATA_REQUIRED, "payment_confirmed", errors);

  return { valid: errors.length === 0, errors, mode: "full" };
}

// ────────────────────────────────────────────────────────────
// SHARED VALIDATION HELPERS (private)
// ────────────────────────────────────────────────────────────

function validateRecipient(body, errors) {
  if (!body.recipient || typeof body.recipient !== "object") {
    errors.push('Missing "recipient" object.');
  } else {
    const hasPhone = typeof body.recipient.phone === "string" && body.recipient.phone.trim() !== "";
    const hasEmail = typeof body.recipient.email === "string" && body.recipient.email.trim() !== "";

    if (!hasPhone && !hasEmail) {
      errors.push('"recipient" must include at least a phone or email address.');
    }

    if (hasPhone && !/^\+?\d{7,15}$/.test(body.recipient.phone.replace(/[\s\-()]/g, ""))) {
      errors.push('"recipient.phone" does not look like a valid phone number.');
    }

    if (hasEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.recipient.email)) {
      errors.push('"recipient.email" does not look like a valid email address.');
    }
  }
}

function validateDataBlock(body, required, type, errors) {
  if (!body.data || typeof body.data !== "object") {
    errors.push('Missing "data" object.');
  } else {
    for (const field of required) {
      if (body.data[field] === undefined || body.data[field] === null || body.data[field] === "") {
        errors.push(`Missing required data field: "${field}".`);
      }
    }

    if (body.data.totalAmount !== undefined) {
      if (typeof body.data.totalAmount !== "number" || body.data.totalAmount <= 0) {
        errors.push('"data.totalAmount" must be a positive number.');
      }
    }

    const dateFields = type === "payment_confirmed"
      ? ["dueDate", "paymentDate"]
      : ["dueDate"];

    for (const field of dateFields) {
      if (body.data[field] && isNaN(Date.parse(body.data[field]))) {
        errors.push(`"data.${field}" is not a valid date string.`);
      }
    }
  }
}

/**
 * Legacy single-function interface (backward compatible).
 * Delegates to the appropriate validator based on type.
 */
function validateNotification(body, type) {
  if (type === "payment_confirmed") {
    return validatePaymentRequest(body);
  }
  return validateChallanRequest(body);
}

module.exports = {
  validateNotification,
  validateChallanRequest,
  validatePaymentRequest,
};
