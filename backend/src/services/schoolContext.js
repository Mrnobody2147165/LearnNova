/**
 * ============================================================
 * LearnNova — Live School Context Helper
 * ============================================================
 *
 * Builds a rich, detailed snapshot of live Supabase data that
 * aiService.js injects into the Gemini prompt as RAG context.
 *
 * getLiveSchoolContext() fetches:
 *   - Every student (name, roll #, class, fee_status, phone)
 *   - All classes
 *   - All challans with student name + class resolved
 *   - All payments
 *
 * buildContextText() converts that into a detailed plain-text
 * RAG document covering:
 *   - Aggregate stats (totals, counts)
 *   - Full class rosters with fee status
 *   - Individual unpaid/overdue challans with amounts & due dates
 *   - Fee collection summary
 *
 * tryDirectAnswer() handles the most common keyword questions
 * directly from the data without calling Gemini at all — used
 * as a fast-path fallback when Gemini is unavailable.
 *
 * ── Public API ────────────────────────────────────────────
 *   getLiveSchoolContext()
 *     → { contextText, students, classes, challans, payments }
 *
 *   tryDirectAnswer(question, liveContext)
 *     → string answer, or null
 */

const { getDb } = require("./db");

const DEFAULT_SCHOOL_ID = process.env.DEFAULT_SCHOOL_ID || "abc88e49-fa7c-4987-b877-09b05b61d6a6";

const SCHOOL_TIMINGS =
  "**School Timings**\n" +
  "- Monday–Thursday & Saturday: 8:00 AM – 2:00 PM\n" +
  "- Friday: 8:00 AM – 12:30 PM (Jumma Break)\n" +
  "- Sunday: Closed\n\n" +
  "Administrative office hours for fee payments: 8:00 AM – 3:00 PM, Monday–Saturday.";

// ────────────────────────────────────────────────────────────
// MAIN DATA FETCH
// ────────────────────────────────────────────────────────────

/**
 * Pull a full snapshot of live data from Supabase.
 * Joins students → classes so every student has a resolved class name.
 * Joins challans → students so every challan has a resolved student name.
 *
 * @returns {Promise<{contextText, students, classes, challans, payments}>}
 */
async function getLiveSchoolContext() {
  const empty = { contextText: "", students: [], classes: [], challans: [], payments: [] };

  const db = getDb();
  if (!db) {
    console.warn("[SchoolContext] No DB client — returning empty context.");
    return empty;
  }

  try {
    const [classesRes, studentsRes, challansRes, paymentsRes] = await Promise.all([
      db.from("classes").select("id, name, numeric_order").eq("school_id", DEFAULT_SCHOOL_ID),
      db.from("students").select("id, name, roll_number, phone, email, fee_status, status, current_class_id").eq("school_id", DEFAULT_SCHOOL_ID),
      db.from("challans").select("id, challan_number, student_id, total_amount, status, due_date, billing_month").eq("school_id", DEFAULT_SCHOOL_ID),
      db.from("payments").select("id, student_id, amount_paid, payment_date, status").eq("school_id", DEFAULT_SCHOOL_ID),
    ]);

    if (classesRes.error)   console.error("[SchoolContext] classes error:",   classesRes.error.message);
    if (studentsRes.error)  console.error("[SchoolContext] students error:",  studentsRes.error.message);
    if (challansRes.error)  console.error("[SchoolContext] challans error:",  challansRes.error.message);
    if (paymentsRes.error)  console.error("[SchoolContext] payments error:",  paymentsRes.error.message);

    const classes  = classesRes.data  || [];
    const students = studentsRes.data || [];
    const challans = challansRes.data || [];
    const payments = paymentsRes.data || [];

    // Build lookup maps for joins
    const classById   = new Map(classes.map(c => [c.id, c.name]));
    const studentById = new Map(students.map(s => [s.id, s]));

    // Enrich students with resolved class name
    const enrichedStudents = students.map(s => ({
      ...s,
      className: classById.get(s.current_class_id) || "Unassigned",
    }));

    // Enrich challans with resolved student name + class
    const enrichedChallans = challans.map(c => {
      const student = studentById.get(c.student_id);
      return {
        ...c,
        studentName:  student?.name        || "Unknown",
        studentPhone: student?.phone       || "",
        className:    classById.get(student?.current_class_id) || "Unassigned",
        rollNumber:   student?.roll_number || "",
      };
    });

    const contextText = buildContextText({
      students: enrichedStudents,
      classes,
      challans: enrichedChallans,
      payments,
    });

    return {
      contextText,
      students: enrichedStudents,
      classes,
      challans: enrichedChallans,
      payments,
    };
  } catch (err) {
    console.error("[SchoolContext] getLiveSchoolContext failed:", err.message);
    return empty;
  }
}

// ────────────────────────────────────────────────────────────
// RICH CONTEXT BUILDER
// ────────────────────────────────────────────────────────────

/**
 * Build a detailed plain-text RAG document from the live data.
 * This is injected verbatim into the Gemini prompt so the model
 * can answer specific questions about individual students and challans.
 */
function buildContextText({ students, classes, challans, payments }) {
  if (!students.length && !classes.length) return "";

  const lines = [];

  // ── 1. Aggregate summary ─────────────────────────────────
  const totalStudents  = students.length;
  const activeStudents = students.filter(s => (s.status || "Active") === "Active").length;
  const unpaidStudents = students.filter(s => s.fee_status === "Pending" || s.fee_status === "Overdue");

  const completedPayments = payments.filter(p => (p.status || "Completed") === "Completed");
  const totalCollected    = completedPayments.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);

  const pendingChallans    = challans.filter(c => c.status === "Pending" || c.status === "Overdue");
  const totalPendingAmount = pendingChallans.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);

  const sortedClasses = [...classes].sort((a, b) => (a.numeric_order || 0) - (b.numeric_order || 0));
  const classNames    = sortedClasses.map(c => c.name).join(", ");

  lines.push("=== SCHOOL OVERVIEW ===");
  lines.push(`Total students enrolled: ${totalStudents} (${activeStudents} active, ${totalStudents - activeStudents} inactive)`);
  lines.push(`Classes available: ${classNames || "none configured"}`);
  lines.push(`Students with unpaid/overdue fees: ${unpaidStudents.length}`);
  lines.push(`Total fees collected (completed payments): PKR ${totalCollected.toLocaleString()}`);
  lines.push(`Pending challans: ${pendingChallans.length} totalling PKR ${totalPendingAmount.toLocaleString()}`);
  lines.push("");

  // ── 2. Per-class rosters ──────────────────────────────────
  lines.push("=== CLASS ROSTERS ===");

  const classGroups = {};
  students.forEach(s => {
    const cls = s.className || "Unassigned";
    if (!classGroups[cls]) classGroups[cls] = [];
    classGroups[cls].push(s);
  });

  sortedClasses.forEach(cls => {
    const roster = classGroups[cls.name] || [];
    lines.push(`\n--- ${cls.name} (${roster.length} students) ---`);
    if (roster.length === 0) {
      lines.push("  No students assigned.");
    } else {
      roster.forEach(s => {
        lines.push(
          `  • ${s.name}` +
          (s.roll_number ? ` (Roll #${s.roll_number})` : "") +
          ` | Fee Status: ${s.fee_status || "N/A"}` +
          (s.phone ? ` | Phone: ${s.phone}` : "")
        );
      });
    }
  });

  const unassigned = classGroups["Unassigned"] || [];
  if (unassigned.length > 0) {
    lines.push(`\n--- Unassigned (${unassigned.length} students) ---`);
    unassigned.forEach(s => {
      lines.push(`  • ${s.name}${s.roll_number ? ` (Roll #${s.roll_number})` : ""} | Fee Status: ${s.fee_status || "N/A"}`);
    });
  }

  lines.push("");

  // ── 3. Unpaid / Overdue challans (full list) ─────────────
  lines.push("=== UNPAID / OVERDUE FEE CHALLANS ===");
  if (pendingChallans.length === 0) {
    lines.push("All challans are currently paid. No outstanding amounts.");
  } else {
    pendingChallans.forEach((c, i) => {
      lines.push(
        `${i + 1}. ${c.studentName}` +
        (c.className ? ` | Class: ${c.className}` : "") +
        (c.rollNumber ? ` | Roll #${c.rollNumber}` : "") +
        ` | Challan #: ${c.challan_number || c.id}` +
        ` | Month: ${c.billing_month || "N/A"}` +
        ` | Amount: PKR ${Number(c.total_amount || 0).toLocaleString()}` +
        ` | Due: ${c.due_date || "N/A"}` +
        ` | Status: ${c.status}` +
        (c.studentPhone ? ` | Phone: ${c.studentPhone}` : "")
      );
    });
    lines.push(`\nTotal outstanding: PKR ${totalPendingAmount.toLocaleString()} across ${pendingChallans.length} challan(s).`);
  }

  lines.push("");

  // ── 4. Fee collection summary ────────────────────────────
  lines.push("=== FEE COLLECTION SUMMARY ===");
  lines.push(`Completed payments: ${completedPayments.length}`);
  lines.push(`Total collected: PKR ${totalCollected.toLocaleString()}`);
  lines.push(`Total outstanding (pending + overdue): PKR ${totalPendingAmount.toLocaleString()}`);
  lines.push("");

  // ── 5. School policy ─────────────────────────────────────
  lines.push("=== SCHOOL POLICY ===");
  lines.push("Fee due date: 10th of every month.");
  lines.push("Late fee fine: PKR 200 per challan after the 10th.");
  lines.push("Accepted payment methods: Cash, HBL/Meezan bank transfer, EasyPaisa, JazzCash.");
  lines.push("Sibling concession: 15% for 2nd child. Merit scholarship: 20%.");
  lines.push(SCHOOL_TIMINGS);

  return lines.join("\n");
}

// ────────────────────────────────────────────────────────────
// FAST-PATH DIRECT ANSWERS (no Gemini call needed)
// ────────────────────────────────────────────────────────────

/**
 * Answer common questions directly from live data without Gemini.
 * Returns null if the question doesn't match, so the caller falls
 * back to Gemini with the full RAG context.
 *
 * @param {string} question
 * @param {Object} liveContext — result of getLiveSchoolContext()
 * @returns {string|null}
 */
function tryDirectAnswer(question, liveContext) {
  if (!question || typeof question !== "string") return null;
  const q = question.toLowerCase();
  const { students = [], classes = [], challans = [], payments = [] } = liveContext || {};

  // ── School timings ──────────────────────────────────────
  if (q.includes("timing") || q.includes("timimg") || q.includes("office hours") || q.includes("what time") || q.includes("open") || q.includes("schedule")) {
    return SCHOOL_TIMINGS;
  }

  // ── Who hasn't paid / pending fees ──────────────────────
  if (
    (q.includes("hasn't paid") || q.includes("haven't paid") || q.includes("not paid") ||
     q.includes("pending fee") || q.includes("unpaid") || q.includes("overdue") ||
     q.includes("defaulter")) && !q.includes("how much")
  ) {
    if (!students.length) return null;
    const unpaid = students.filter(s => s.fee_status === "Pending" || s.fee_status === "Overdue");
    if (!unpaid.length) return "All students currently have their fees marked as paid. 🎉";

    const list = unpaid
      .slice(0, 25)
      .map(s =>
        `- **${s.name}**${s.roll_number ? ` (Roll #${s.roll_number})` : ""} — ${s.className || "Unassigned"} — **${s.fee_status}**` +
        (s.phone ? ` — ${s.phone}` : "")
      )
      .join("\n");
    const more = unpaid.length > 25 ? `\n\n...and ${unpaid.length - 25} more.` : "";
    return `**Students with pending/overdue fees (${unpaid.length}):**\n${list}${more}`;
  }

  // ── How much has been collected ─────────────────────────
  if (q.includes("how much") && (q.includes("collect") || q.includes("received") || q.includes("paid"))) {
    if (!payments.length) return null;
    const totalCollected = payments
      .filter(p => (p.status || "Completed") === "Completed")
      .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0);
    return `**Total fees collected:** PKR ${totalCollected.toLocaleString()} across ${payments.length} payment record(s).`;
  }

  // ── How many students enrolled ───────────────────────────
  if (q.includes("how many student") || q.includes("total student") || q.includes("students enrolled") || q.includes("students are there") || q.includes("strength")) {
    if (!students.length) return null;
    const active = students.filter(s => (s.status || "Active") === "Active").length;

    const classGroups = {};
    students.forEach(s => {
      const cls = s.className || "Unassigned";
      if (!classGroups[cls]) classGroups[cls] = 0;
      classGroups[cls]++;
    });
    const breakdown = Object.entries(classGroups).map(([cls, count]) => `  - ${cls}: ${count}`).join("\n");

    return `**Total enrolled students:** ${students.length} (${active} active).\n\n**Breakdown by class:**\n${breakdown}`;
  }

  // ── Students in a specific class ────────────────────────
  const classMatch = q.match(/class\s+([0-9a-z][\w\-\s]*)/i);
  if (q.includes("student") && classMatch) {
    if (!students.length || !classes.length) return null;
    const target = classMatch[1].trim().toLowerCase().replace(/\s+/g, "-");
    const matchedClass = classes.find(c =>
      c.name.toLowerCase().replace(/\s+/g, "-") === target ||
      c.name.toLowerCase().includes(target)
    );
    if (!matchedClass) {
      return `I couldn't find a class matching "${classMatch[1].trim()}". Available classes: ${classes.map(c => c.name).join(", ")}.`;
    }
    const inClass = students.filter(s => s.current_class_id === matchedClass.id);
    if (!inClass.length) return `No students are currently assigned to **${matchedClass.name}**.`;
    const list = inClass.slice(0, 30).map(s =>
      `- **${s.name}**${s.roll_number ? ` (Roll #${s.roll_number})` : ""} | Fee Status: ${s.fee_status || "N/A"}${s.phone ? ` | ${s.phone}` : ""}`
    ).join("\n");
    const more = inClass.length > 30 ? `\n\n...and ${inClass.length - 30} more.` : "";
    return `**Students in ${matchedClass.name} (${inClass.length}):**\n${list}${more}`;
  }

  // ── Pending challans count/amount ───────────────────────
  if (q.includes("pending challan") || q.includes("outstanding") || q.includes("pending amount")) {
    if (!challans.length) return null;
    const pending = challans.filter(c => c.status === "Pending" || c.status === "Overdue");
    const total   = pending.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);
    return `**Pending challans:** ${pending.length}, totalling PKR ${total.toLocaleString()}.`;
  }

  return null; // let the caller fall back to Gemini
}

module.exports = { getLiveSchoolContext, tryDirectAnswer };
