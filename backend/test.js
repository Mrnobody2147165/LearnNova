/**
 * Quick smoke test — calls all endpoints with dummy data in
 * sandbox/mock mode so no real messages are sent, no real
 * Supabase uploads occur, and no OpenAI API calls are made.
 *
 * Run:  node test.js
 *
 * The server must be running first (npm start) — this script
 * posts to localhost and logs what WOULD be sent, including
 * the mock PDF link from Supabase Storage and mock AI responses.
 */
const http = require("http");

const PORT = process.env.PORT || 3005;

// ── Dummy data matching the PDF module's test fixtures ──────
const CHALLAN_PAYLOAD = {
  recipient: {
    phone: "+923001234567",
    email: "parent@example.com",
    whatsappOptIn: true,
  },
  data: {
    schoolName: "Green Valley School",
    studentName: "Ali Hassan",
    studentId: "STU-2026-001",
    className: "Grade 8-A",
    challanNumber: "CH-000123",
    issueDate: "2026-08-19",
    dueDate: "2026-09-05",
    totalAmount: 19500,
    feeItems: [
      { description: "Tuition Fee", amount: 15000 },
      { description: "Transport Fee", amount: 3000 },
      { description: "Lab Fee", amount: 1500 },
    ],
    paymentInstructions: "Pay via bank transfer or online portal before due date.",
  },
};

const PAYMENT_PAYLOAD = {
  recipient: {
    phone: "+923001234567",
    email: "parent@example.com",
    whatsappOptIn: true,
  },
  data: {
    ...CHALLAN_PAYLOAD.data,
    paymentDate: "2026-08-25",
    paymentMethod: "Bank Transfer (HBL)",
  },
};

const AI_ASK_PAYLOAD = {
  question: "What is the late fee policy for fee challans?",
  context: "Green Valley School charges PKR 500 as late fee after the due date.",
};

const AI_INTERPRET_PAYLOAD = {
  documentText:
    "Fee Notice for Grade 8-A, Academic Year 2026-27.\n" +
    "Tuition Fee: PKR 15,000\n" +
    "Transport Fee: PKR 3,000\n" +
    "Lab Fee: PKR 1,500\n" +
    "Library Fee: PKR 500\n" +
    "Due Date: 5th September 2026\n" +
    "Late fee of PKR 500 will be charged after the due date.\n" +
    "Payment can be made via bank transfer or online portal.",
};

// ── HTTP helper ─────────────────────────────────────────────
function post(path, body) {
  return new Promise((resolve, reject) => {
    const data = Buffer.from(JSON.stringify(body));
    const req = http.request({
      hostname: "localhost",
      port: PORT,
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": data.length,
      },
    }, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString();
        let parsed;
        try { parsed = JSON.parse(raw); } catch { parsed = raw; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

// ── Run tests ───────────────────────────────────────────────
(async () => {
  console.log("═══════════════════════════════════════════════════");
  console.log("  LearnNova Backend — Smoke Test (sandbox/mock)");
  console.log("═══════════════════════════════════════════════════\n");

  // ── Notification tests ──────────────────────────────────────

  // Test 1 — Challan notification (with PDF generation + mock upload)
  console.log("─ Testing POST /api/notify/challan ...");
  const c = await post("/api/notify/challan", CHALLAN_PAYLOAD);
  if (c.status !== 200) {
    console.error("  FAIL:", c.status, JSON.stringify(c.body, null, 2));
  } else {
    const s = c.body.summary;
    console.log("  OK — Delivery summary:");
    console.log(`    PDF Link : ${s.pdfLink || "(none)"}`);
    console.log(`    WhatsApp : ${s.whatsapp.success ? "sent" : "failed"} ${s.whatsapp.detail ? `(${s.whatsapp.detail})` : ""}`);
    console.log(`    SMS      : ${s.sms.success ? "sent" : "failed"} ${s.sms.detail ? `(${s.sms.detail})` : ""}`);
    console.log(`    Email    : ${s.email.success ? "sent" : "failed"} ${s.email.detail ? `(${s.email.detail})` : ""}`);
  }

  console.log("");

  // Test 2 — Payment notification (with receipt PDF + mock upload)
  console.log("─ Testing POST /api/notify/payment ...");
  const p = await post("/api/notify/payment", PAYMENT_PAYLOAD);
  if (p.status !== 200) {
    console.error("  FAIL:", p.status, JSON.stringify(p.body, null, 2));
  } else {
    const s = p.body.summary;
    console.log("  OK — Delivery summary:");
    console.log(`    PDF Link : ${s.pdfLink || "(none)"}`);
    console.log(`    WhatsApp : ${s.whatsapp.success ? "sent" : "failed"} ${s.whatsapp.detail ? `(${s.whatsapp.detail})` : ""}`);
    console.log(`    SMS      : ${s.sms.success ? "sent" : "failed"} ${s.sms.detail ? `(${s.sms.detail})` : ""}`);
    console.log(`    Email    : ${s.email.success ? "sent" : "failed"} ${s.email.detail ? `(${s.email.detail})` : ""}`);
  }

  console.log("");

  // Test 3 — Validation (missing recipient)
  console.log("─ Testing validation (empty body) ...");
  const v = await post("/api/notify/challan", {});
  const errCount = Array.isArray(v.body.errors) ? v.body.errors.length : 0;
  console.log(`  status=${v.status}  errors=${errCount}`);
  if (errCount > 0) {
    v.body.errors.forEach((e) => console.log(`    • ${e}`));
  }

  console.log("");

  // Test 4 — Validation (missing data fields)
  console.log("─ Testing validation (partial data) ...");
  const v2 = await post("/api/notify/payment", {
    recipient: { phone: "+923001234567", email: "test@example.com" },
    data: { studentName: "Ali Hassan" },
  });
  const errCount2 = Array.isArray(v2.body.errors) ? v2.body.errors.length : 0;
  console.log(`  status=${v2.status}  errors=${errCount2}`);
  if (errCount2 > 0) {
    v2.body.errors.forEach((e) => console.log(`    • ${e}`));
  }

  console.log("");

  // ── DB-backed notification tests ──────────────────────────

  // Test 5 — Challan via challanId (DB mode)
  // Expects 404 since there's no real data in Supabase yet,
  // but verifies the DB lookup path doesn't crash.
  console.log("─ Testing POST /api/notify/challan (DB mode, challanId=1) ...");
  const db1 = await post("/api/notify/challan", { challanId: 1 });
  console.log(`  status=${db1.status}`);
  if (db1.status === 404) {
    console.log("  OK — correctly returned 404 (no data in DB yet)");
    if (Array.isArray(db1.body.errors)) {
      db1.body.errors.forEach((e) => console.log(`    • ${e}`));
    }
  } else if (db1.status === 200) {
    console.log("  OK — DB lookup succeeded (real data found!)");
  } else {
    console.error("  UNEXPECTED:", db1.status, JSON.stringify(db1.body, null, 2));
  }

  console.log("");

  // Test 6 — Payment via challanId (DB mode)
  console.log("─ Testing POST /api/notify/payment (DB mode, challanId=1) ...");
  const db2 = await post("/api/notify/payment", {
    challanId: 1,
    paymentDate: "2026-08-25",
    paymentMethod: "Bank Transfer (HBL)",
  });
  console.log(`  status=${db2.status}`);
  if (db2.status === 404) {
    console.log("  OK — correctly returned 404 (no data in DB yet)");
  } else if (db2.status === 200) {
    console.log("  OK — DB lookup succeeded (real data found!)");
  } else {
    console.error("  UNEXPECTED:", db2.status, JSON.stringify(db2.body, null, 2));
  }

  console.log("");

  // Test 7 — DB validation (invalid challanId type)
  console.log("─ Testing DB validation (invalid challanId) ...");
  const db3 = await post("/api/notify/challan", { challanId: "not-a-number" });
  // Should still pass validation since we accept string IDs
  console.log(`  status=${db3.status} (string IDs accepted, DB lookup attempted)`);

  console.log("");

  // Test 8 — DB payment validation (missing paymentDate)
  console.log("─ Testing DB payment validation (missing paymentDate) ...");
  const db4 = await post("/api/notify/payment", { challanId: 1 });
  const errCount4 = Array.isArray(db4.body.errors) ? db4.body.errors.length : 0;
  console.log(`  status=${db4.status}  errors=${errCount4}`);
  if (errCount4 > 0) {
    db4.body.errors.forEach((e) => console.log(`    • ${e}`));
  }

  console.log("");

  // ── AI Assistant tests ──────────────────────────────────────

  // Test 9 — AI ask (mock mode)
  console.log("─ Testing POST /api/ai/ask ...");
  const a = await post("/api/ai/ask", AI_ASK_PAYLOAD);
  if (a.status !== 200) {
    console.error("  FAIL:", a.status, JSON.stringify(a.body, null, 2));
  } else {
    console.log(`  OK — answer source: ${a.body.source || "unknown"}`);
    console.log(`     answer: ${(a.body.answer || "").slice(0, 120)}...`);
  }

  console.log("");

  // Test 10 — AI interpret-document (mock mode)
  console.log("─ Testing POST /api/ai/interpret-document ...");
  const d = await post("/api/ai/interpret-document", AI_INTERPRET_PAYLOAD);
  if (d.status !== 200) {
    console.error("  FAIL:", d.status, JSON.stringify(d.body, null, 2));
  } else {
    console.log(`  OK — source: ${d.body.source || "unknown"}`);
    console.log(`     feeItems: ${(d.body.feeItems || []).length} items`);
    console.log(`     dueDate: ${d.body.dueDate || "(none)"}`);
    console.log(`     lateFeePenalty: ${d.body.lateFeePenalty || 0}`);
    console.log(`     notes: ${(d.body.notes || "").slice(0, 80)}`);
  }

  console.log("");

  // Test 11 — AI validation (empty question)
  console.log("─ Testing AI validation (empty question) ...");
  const a2 = await post("/api/ai/ask", {});
  const errCount3 = Array.isArray(a2.body.errors) ? a2.body.errors.length : 0;
  console.log(`  status=${a2.status}  errors=${errCount3}`);
  if (errCount3 > 0) {
    a2.body.errors.forEach((e) => console.log(`    • ${e}`));
  }

  console.log("\nDone!");
  process.exit(0);
})();
