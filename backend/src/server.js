/**
 * ============================================================
 * Learnify — Unified Backend Server
 * ============================================================
 *
 * Single Express server combining Notifications + AI Assistant.
 *
 *   npm start        → starts on PORT (default 3000)
 *   npm run dev      → same, with --watch auto-reload
 *
 * Notification endpoints:
 *   POST /api/notify/challan   → sends challan_generated notification
 *   POST /api/notify/payment   → sends payment_confirmed notification
 *
 * AI Assistant endpoints:
 *   POST /api/ai/ask                → Q&A grounded in school policy
 *   POST /api/ai/interpret-document → extract structured fee data
 *
 * Shared:
 *   GET  /health
 */

require("dotenv").config();

const express = require("express");
const cors    = require("cors");
const notificationRoutes = require("./routes/notificationRoutes");
const aiRoutes = require("./routes/aiRoutes");

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors());            // allow all origins during development
app.use(express.json());

// ── Health check ────────────────────────────────────────────
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "learnify-backend", uptime: process.uptime() });
});

// ── API routes ──────────────────────────────────────────────
app.use("/api/notify", notificationRoutes);
app.use("/api/ai", aiRoutes);

// ── 404 fallback ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, errors: ["Endpoint not found."] });
});

// ── Start ───────────────────────────────────────────────────
app.listen(PORT, () => {
  const sandbox = process.env.SANDBOX === "true" ? " [SANDBOX MODE]" : "";
  const mock    = process.env.MOCK_MODE === "true" ? " [MOCK AI]" : "";
  console.log(`[Learnify] Server running on http://localhost:${PORT}${sandbox}${mock}`);
  console.log(`  POST /api/notify/challan`);
  console.log(`  POST /api/notify/payment`);
  console.log(`  POST /api/ai/ask`);
  console.log(`  POST /api/ai/interpret-document`);
  console.log(`  GET  /health`);
});

module.exports = app; // export for testing
