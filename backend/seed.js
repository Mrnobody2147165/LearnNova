/**
 * ============================================================
 * Learnify — Supabase Database Seeder
 * ============================================================
 *
 * Seeds test data into Supabase so the notification endpoints
 * can be exercised in DB-backed mode (challanId-based flow).
 *
 *   node seed.js
 *
 * Uses SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY from .env.
 * Inserts in dependency order:
 *   schools → guardians → students → challans → challan_items
 *
 * Each insert is wrapped in error handling — on failure it
 * logs the table name and exits immediately.
 *
 * At the end it prints a ready-to-use curl / fetch example
 * for POST /api/notify/challan with the created challanId.
 *
 * ── Note ─────────────────────────────────────────────────
 * Run this once to populate test data.  Re-running will
 * create duplicate rows — if you need a clean slate, delete
 * existing rows from the tables first (or recreate them).
 */

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

// ── Supabase client (service role — bypasses RLS) ───────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes("your-project-ref")) {
  console.error("[Seed] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// ────────────────────────────────────────────────────────────
// SEED DATA — edit to match your test scenario
// ────────────────────────────────────────────────────────────

const SCHOOL = {
  code:    "GVS-001",
  name:    "Green Valley School",
  address: "123 Main Street, Lahore",
  phone:   "+92-42-35761234",
};

const CLASS = {
  name:         "Grade 8-A",
  numeric_order: 8,
};

const GUARDIAN = {
  name:  "Muhammad Hassan",
  phone: "+923001234567",
  email: "parent@example.com",
};

const STUDENT = {
  student_id_code:  "STU-2026-001",
  name:             "Ali Hassan",
  roll_number:      "12",
  phone:            "+923009876543",
  email:            "ali.student@example.com",
  admission_date:   "2025-04-01",
};

const CHALLAN = {
  challan_number:  "CH-000123",
  billing_month:   "2026-09",
  issue_date:      "2026-08-19",
  due_date:        "2026-09-05",
  base_amount:     19500,
  discount_amount: 0,
  late_fee:        500,
  total_amount:    19500,
  pdf_url:         null,
};

const CHALLAN_ITEMS = [
  { item_name: "Tuition Fee",    amount: 15000 },
  { item_name: "Transport Fee",  amount: 3000  },
  { item_name: "Lab Fee",        amount: 1500  },
];

// ────────────────────────────────────────────────────────────
// INSERT HELPERS
// ────────────────────────────────────────────────────────────

/**
 * Insert a row into `table` and return the created row.
 * On error, logs the table name and exits.
 */
async function insertRow(table, row) {
  const { data, error } = await db.from(table).insert(row).select().single();

  if (error) {
    console.error(`[Seed] FAILED to insert into "${table}":`, error.message);
    process.exit(1);
  }

  console.log(`[Seed] ✓ ${table} → id = ${data.id}`);
  return data;
}

/**
 * Insert multiple rows into `table` and return the created rows.
 * On error, logs the table name and exits.
 */
async function insertRows(table, rows) {
  const { data, error } = await db.from(table).insert(rows).select();

  if (error) {
    console.error(`[Seed] FAILED to insert into "${table}":`, error.message);
    process.exit(1);
  }

  console.log(`[Seed] ✓ ${table} → ${data.length} row(s) inserted (ids: ${data.map((r) => r.id).join(", ")})`);
  return data;
}

// ────────────────────────────────────────────────────────────
// MAIN — sequential inserts respecting foreign keys
// ────────────────────────────────────────────────────────────

(async () => {
  console.log("═══════════════════════════════════════════════════");
  console.log("  Learnify — Database Seeder");
  console.log("═══════════════════════════════════════════════════\n");

  // ── Cleanup existing test data (optional — comment out to keep existing) ──
  console.log("[Seed] Cleaning up existing test data...");
  await db.from("challan_items").delete().eq("item_name", "Tuition Fee");
  await db.from("challans").delete().eq("challan_number", CHALLAN.challan_number);
  await db.from("students").delete().eq("student_id_code", STUDENT.student_id_code);
  await db.from("guardians").delete().eq("email", GUARDIAN.email);
  await db.from("classes").delete().eq("name", CLASS.name);
  await db.from("schools").delete().eq("code", SCHOOL.code);

  // Step 1 — School
  const school = await insertRow("schools", SCHOOL);

  // Step 2 — Class (linked to school)
  const classRow = await insertRow("classes", {
    ...CLASS,
    school_id: school.id,
  });

  // Step 3 — Guardian (linked to school)
  const guardian = await insertRow("guardians", {
    ...GUARDIAN,
    school_id: school.id,
  });

  // Step 4 — Student (linked to school + guardian + class)
  const student = await insertRow("students", {
    ...STUDENT,
    school_id:        school.id,
    guardian_id:      guardian.id,
    current_class_id: classRow.id,
  });

  // Step 4 — Challan (linked to school + student)
  const challan = await insertRow("challans", {
    ...CHALLAN,
    school_id:  school.id,
    student_id: student.id,
  });

  // Step 5 — Challan items (linked to challan)
  const items = await insertRows(
    "challan_items",
    CHALLAN_ITEMS.map((item) => ({
      ...item,
      challan_id: challan.id,
    }))
  );

  // ── Summary ─────────────────────────────────────────────────
  console.log("\n═══════════════════════════════════════════════════");
  console.log("  Seed complete!");
  console.log("═══════════════════════════════════════════════════");
  console.log(`  School ID    : ${school.id}`);
  console.log(`  Guardian ID  : ${guardian.id}`);
  console.log(`  Student ID   : ${student.id}`);
  console.log(`  Challan ID   : ${challan.id}`);
  console.log(`  Challan Items: ${items.length} rows`);

  console.log("\n── Ready-to-use API call ─────────────────────────");
  console.log(`  POST http://localhost:${process.env.PORT || 3000}/api/notify/challan`);
  console.log(`  Body: { "challanId": ${challan.id} }`);
  console.log("");
  console.log(`  curl -X POST http://localhost:${process.env.PORT || 3000}/api/notify/challan \\`);
  console.log(`    -H "Content-Type: application/json" \\`);
  console.log(`    -d '{ "challanId": ${challan.id} }'`);
  console.log("");

  process.exit(0);
})();
