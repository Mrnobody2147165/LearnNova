/**
 * ============================================================
 * Learnify AI Assistant — Express Routes
 * ============================================================
 *
 * POST /api/ai/ask
 * {
 *   "question": "Who hasn't paid their fees?",
 *   "history": [                         ← optional, last N turns
 *     { "role": "user",      "text": "..." },
 *     { "role": "assistant", "text": "..." }
 *   ]
 * }
 *
 * POST /api/ai/interpret-document
 * {
 *   "documentText": "Fee notice for Grade 8-A..."
 * }
 */

const { Router } = require("express");
const { askAssistant, interpretDocument } = require("../services/aiService");

const router = Router();

// ── POST /api/ai/ask ────────────────────────────────────────
router.post("/ask", async (req, res) => {
  try {
    const { question, history } = req.body;

    if (!question || typeof question !== "string" || question.trim() === "") {
      return res.status(400).json({
        success: false,
        errors: ['"question" is required and must be a non-empty string.'],
      });
    }

    // Sanitise history: accept array of {role, text} objects, ignore anything else
    const safeHistory = Array.isArray(history)
      ? history
          .filter(m => m && typeof m.text === "string" && (m.role === "user" || m.role === "assistant"))
          .slice(-10) // cap at 10 turns to keep prompt size reasonable
      : [];

    const result = await askAssistant(question.trim(), safeHistory);

    return res.json({
      success: true,
      answer:  result.answer,
      source:  result.source,
      actions: result.actions || [],
    });
  } catch (err) {
    console.error("[ai/ask] Unhandled error:", err.message);
    return res.status(500).json({
      success: false,
      errors:  ["An internal error occurred while processing your question."],
    });
  }
});

// ── POST /api/ai/interpret-document ─────────────────────────
router.post("/interpret-document", async (req, res) => {
  try {
    const { documentText } = req.body;

    if (!documentText || typeof documentText !== "string" || documentText.trim() === "") {
      return res.status(400).json({
        success: false,
        errors:  ['"documentText" is required and must be a non-empty string.'],
      });
    }

    const result = await interpretDocument(documentText.trim());

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error("[ai/interpret-document] Unhandled error:", err.message);
    return res.status(500).json({
      success: false,
      errors:  ["An internal error occurred while interpreting the document."],
    });
  }
});

module.exports = router;
