/**
 * ============================================================
 * Learnify AI Assistant — Express Routes
 * ============================================================
 *
 * Two POST endpoints:
 *   POST /api/ai/ask                → Q&A grounded in school policy
 *   POST /api/ai/interpret-document → extract structured fee data
 *
 * Both follow the same flow:
 *   1. Validate request body
 *   2. Call the AI service
 *   3. Return the result as JSON
 *
 * ── Expected request shapes ───────────────────────────────
 *
 * POST /api/ai/ask
 * {
 *   "question": "What is the late fee policy?",
 *   "context": "Optional policy text for grounding..."
 * }
 *
 * POST /api/ai/interpret-document
 * {
 *   "documentText": "Fee notice for Grade 8-A... Tuition 15000..."
 * }
 */

const { Router } = require("express");
const { askAssistant, interpretDocument } = require("../services/aiService");

const router = Router();

// ── POST /api/ai/ask ────────────────────────────────────────
router.post("/ask", async (req, res) => {
  try {
    // Step 1 — Validate
    const errors = [];
    const { question, context } = req.body;

    if (!question || typeof question !== "string" || question.trim() === "") {
      errors.push('"question" is required and must be a non-empty string.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Step 2 — Call AI service
    const result = await askAssistant(question.trim(), context || null);

    // Step 3 — Return result
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("[ai/ask] Error:", err.message);
    return res.status(500).json({
      success: false,
      errors: ["An internal error occurred while processing your question."],
    });
  }
});

// ── POST /api/ai/interpret-document ─────────────────────────
router.post("/interpret-document", async (req, res) => {
  try {
    // Step 1 — Validate
    const errors = [];
    const { documentText } = req.body;

    if (!documentText || typeof documentText !== "string" || documentText.trim() === "") {
      errors.push('"documentText" is required and must be a non-empty string.');
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, errors });
    }

    // Step 2 — Call AI service
    const result = await interpretDocument(documentText.trim());

    // Step 3 — Return result
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("[ai/interpret-document] Error:", err.message);
    return res.status(500).json({
      success: false,
      errors: ["An internal error occurred while interpreting the document."],
    });
  }
});

module.exports = router;
