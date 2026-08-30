/**
 * ============================================================
 * Learnify AI Assistant — Gemini Service
 * ============================================================
 *
 * Two public functions:
 *   • askAssistant(question, context) — Q&A grounded in live
 *     Supabase school data (fees, students, classes, policy)
 *   • interpretDocument(documentText) — extracts structured JSON
 *     (feeItems, dueDate, lateFeePenalty, notes) from raw text
 *
 * Both use the Google Gemini API (generativelanguage.googleapis.com).
 * Gemini has a free tier that works without billing set up, which
 * is why this backend uses it instead of OpenAI.
 *
 * ── Environment variables needed ──────────────────────────
 *   GEMINI_API_KEY — your Google AI Studio API key
 *                    (get one free at https://aistudio.google.com/apikey)
 *   MOCK_MODE      — set to "true" to skip real API calls
 *                    and return realistic hardcoded / live-data
 *                    responses instead
 *
 * When MOCK_MODE=true, no Gemini calls are made — the service
 * still answers using live Supabase data via schoolContext.js
 * where possible, falling back to generic text otherwise.
 *
 * IMPORTANT: this key lives only on the server (here). It is
 * never sent to or used by the browser — the frontend calls
 * this backend instead, which is what keeps the key safe.
 */

const { getLiveSchoolContext, tryDirectAnswer } = require("./schoolContext");

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 12000;

// ── Lazy key check so a missing key doesn't crash startup ──
function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "your_gemini_api_key_here") {
    console.warn("[AI] Gemini API key not configured.");
    return null;
  }
  return key;
}

/**
 * Call the Gemini API with a system-style prompt + user question.
 * Returns the plain text answer, or throws on failure.
 */
async function callGemini(promptText) {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 600 },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini API returned ${res.status}: ${errBody.slice(0, 200)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || !text.trim()) {
      throw new Error("Gemini returned an empty response.");
    }

    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ────────────────────────────────────────────────────────────
// MOCK / FALLBACK RESPONSES — used when MOCK_MODE=true or the
// Gemini key isn't configured, before falling back to Gemini.
// ────────────────────────────────────────────────────────────

const GENERIC_HELP_TEXT =
  `I can help with fee payments, student records, class rosters, and school policies. ` +
  `Try asking things like "who hasn't paid their fees", "how much has been collected", ` +
  `"how many students are enrolled", "students in class 7-B", or "what are the school timings".`;

const MOCK_RESPONSES = {
  interpretDocument: {
    feeItems: [
      { description: "Tuition Fee", amount: 15000 },
      { description: "Transport Fee", amount: 3000 },
      { description: "Lab Fee", amount: 1500 },
      { description: "Library Fee", amount: 500 },
    ],
    dueDate: "2026-09-05",
    lateFeePenalty: 500,
    notes: "Payment can be made via bank transfer or online portal. Late fee applies after due date.",
    source: "mock",
  },
};

// ────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT =
  `You are Learnify AI, a helpful school administrative assistant for Learnify Model Grammar School. ` +
  `Answer questions about school fee policies, challans, payment methods, due dates, late fees, ` +
  `students, classes, and school timings. Be concise, professional, and use markdown formatting ` +
  `(headers, bullet points, bold) where it helps readability. Use the live database snapshot ` +
  `provided below to give accurate, specific, up-to-date answers whenever it's relevant — never ` +
  `invent data that isn't in the snapshot. If the question is outside school administration scope, ` +
  `politely redirect the user.`;

// ────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────

/**
 * Ask the AI assistant a question, grounded in live Supabase data
 * and optional extra context (e.g. conversation history).
 *
 * @param {string} question
 * @param {string} [context] — optional additional context
 * @returns {Promise<{ answer: string, source: "gemini" | "live-data" | "mock" | "error" }>}
 */
async function askAssistant(question, context) {
  const mockMode = process.env.MOCK_MODE === "true";

  // ── Step 1 — Pull live data from Supabase (students, challans) ──
  // Runs regardless of mock mode so answers are grounded in real
  // data whenever the database is configured.
  const liveContext = await getLiveSchoolContext();

  // ── Mock mode — try a direct, data-grounded answer first ────
  if (mockMode) {
    const directAnswer = tryDirectAnswer(question, liveContext);
    if (directAnswer) {
      console.log(`[AI] [MOCK_MODE] askAssistant (live data): "${question}"`);
      return { answer: directAnswer, source: "live-data" };
    }
    console.log(`[AI] [MOCK_MODE] askAssistant (generic): "${question}"`);
    return { answer: GENERIC_HELP_TEXT, source: "mock" };
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    // No Gemini key configured — try a direct data-grounded
    // answer first, then a friendly generic reply.
    const directAnswer = tryDirectAnswer(question, liveContext);
    if (directAnswer) {
      return { answer: directAnswer, source: "live-data" };
    }
    return { answer: GENERIC_HELP_TEXT, source: "mock" };
  }

  try {
    let prompt = SYSTEM_PROMPT + "\n\n";

    // ── Step 2 — Ground the LLM with live Supabase data ──────
    if (liveContext.contextText) {
      prompt += `=== LIVE SCHOOL DATABASE SNAPSHOT ===\n${liveContext.contextText}\n\n`;
    }

    // Add any additional context passed in by the caller (e.g. conversation history)
    if (context) {
      prompt += `=== CONVERSATION CONTEXT ===\n${context}\n\n`;
    }

    prompt += `User question: ${question}`;

    const answer = await callGemini(prompt);
    console.log(`[AI] askAssistant answered via Gemini.`);
    return { answer, source: "gemini" };
  } catch (err) {
    console.error("[AI] askAssistant (Gemini) failed:", err.message);

    // Gemini call failed (rate limit, network, etc.) — fall back
    // to a direct data-grounded answer instead of a hard error.
    const directAnswer = tryDirectAnswer(question, liveContext);
    if (directAnswer) {
      return { answer: directAnswer, source: "live-data" };
    }
    return { answer: GENERIC_HELP_TEXT, source: "mock" };
  }
}

/**
 * Interpret a raw document text and extract structured fee data.
 *
 * @param {string} documentText — Raw text from a fee document / notice.
 * @returns {Promise<Object>} — { feeItems, dueDate, lateFeePenalty, notes, source }
 */
async function interpretDocument(documentText) {
  const mockMode = process.env.MOCK_MODE === "true";

  // ── Mock mode — return hardcoded response, no API call ────
  if (mockMode) {
    console.log(`[AI] [MOCK_MODE] interpretDocument: "${documentText.slice(0, 80)}..."`);
    return MOCK_RESPONSES.interpretDocument;
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    return { feeItems: [], dueDate: null, lateFeePenalty: 0, notes: "AI service not configured.", source: "error" };
  }

  try {
    const prompt =
      `You are a document parser for a school fee management system. ` +
      `Extract structured data from the document text below. ` +
      `Return ONLY a valid JSON object (no markdown fences, no extra text) with these fields:\n` +
      `  - feeItems: array of { "description": string, "amount": number }\n` +
      `  - dueDate: ISO date string (YYYY-MM-DD), or null if not mentioned\n` +
      `  - lateFeePenalty: number (0 if not mentioned)\n` +
      `  - notes: string (any additional relevant info)\n\n` +
      `Document text:\n${documentText}`;

    const raw = await callGemini(prompt);

    // Strip markdown code fences if Gemini wrapped the JSON in them
    const cleaned = raw.replace(/^```json\s*|```\s*$/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      parsed = { feeItems: [], dueDate: null, lateFeePenalty: 0, notes: raw };
    }

    console.log(`[AI] interpretDocument parsed via Gemini.`);
    return { ...parsed, source: "gemini" };
  } catch (err) {
    console.error("[AI] interpretDocument (Gemini) failed:", err.message);
    return { feeItems: [], dueDate: null, lateFeePenalty: 0, notes: `AI error: ${err.message}`, source: "error" };
  }
}

module.exports = { askAssistant, interpretDocument };
