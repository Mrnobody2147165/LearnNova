/**
 * ============================================================
 * Learnify AI Assistant — Gemini Service
 * ============================================================
 *
 * Two public functions:
 *   • askAssistant(question, history) — Q&A grounded in live
 *     Supabase school data via a rich RAG context injected into
 *     the Gemini prompt.
 *   • interpretDocument(documentText) — extracts structured JSON
 *     (feeItems, dueDate, lateFeePenalty, notes) from raw text.
 *
 * Uses Google Gemini API (generativelanguage.googleapis.com).
 *
 * ── Environment variables ─────────────────────────────────
 *   GEMINI_API_KEY — Google AI Studio key (server-side only)
 *   MOCK_MODE      — "true" to skip Gemini and use live data
 *                    answers + pattern matching only
 */

const { getLiveSchoolContext, tryDirectAnswer } = require("./schoolContext");

const GEMINI_MODEL       = "gemini-2.5-flash";
const GEMINI_URL         = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const REQUEST_TIMEOUT_MS = 25000; // longer timeout for detailed RAG prompts

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

function getApiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === "" || key === "your_gemini_api_key_here") {
    console.warn("[AI] Gemini API key not configured.");
    return null;
  }
  return key.trim();
}

/**
 * Call the Gemini API.
 * Uses a multi-turn contents array so conversation history is
 * passed natively rather than concatenated into the prompt text.
 *
 * @param {string}   systemPrompt — injected as the first user turn
 * @param {Array}    contents     — [{role, parts:[{text}]}]
 * @param {number}   [maxTokens]  — default 1200
 * @returns {Promise<string>}
 */
async function callGemini(systemPrompt, contents, maxTokens = 1200) {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured.");

  const controller = new AbortController();
  const timeoutId  = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  // Build the full contents array: system prompt + turns + current question
  const fullContents = [
    { role: "user",  parts: [{ text: systemPrompt }] },
    { role: "model", parts: [{ text: "Understood. I will answer using only the live database data provided." }] },
    ...contents,
  ];

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: fullContents,
        generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text?.trim()) throw new Error("Gemini returned an empty response.");
    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

// ────────────────────────────────────────────────────────────
// SYSTEM PROMPT
// ────────────────────────────────────────────────────────────

function buildSystemPrompt(contextText) {
  return (
    `You are Learnify AI, the official administrative assistant for Learnify Model Grammar School.\n` +
    `You have direct access to the school's live database — the snapshot below contains real data pulled right now.\n\n` +
    `RULES:\n` +
    `1. Answer ONLY from the live database snapshot below. Never invent student names, amounts, or facts not present in the data.\n` +
    `2. When listing students with unpaid fees, include their name, class, roll number, challan number, amount due, due date, and phone if available.\n` +
    `3. Use clear markdown formatting: ### headers, **bold**, bullet points, and PKR X,XXX currency format.\n` +
    `4. If asked about students in a specific class, look up the class roster in the snapshot.\n` +
    `5. If asked "who are you", introduce yourself as Learnify AI connected to the live school database.\n` +
    `6. If data for a question is not in the snapshot (e.g. exam marks, timetables), say so clearly.\n\n` +
    `=== LIVE SCHOOL DATABASE SNAPSHOT (fetched in real-time) ===\n` +
    `${contextText || "(No data available — database may not be configured.)"}\n` +
    `=== END OF SNAPSHOT ===`
  );
}

// ────────────────────────────────────────────────────────────
// FALLBACK TEXT
// ────────────────────────────────────────────────────────────

const GENERIC_HELP_TEXT =
  `I'm Learnify AI, your school administrative assistant. I can answer questions about:\n` +
  `- **Fee status** — who hasn't paid, total collected, pending challans\n` +
  `- **Student records** — class rosters, enrollment counts\n` +
  `- **School policy** — timings, late fee rules, payment methods\n\n` +
  `Try asking: *"Who hasn't paid their fees?"*, *"How many students are enrolled?"*, or *"What are the school timings?"*`;

const MOCK_RESPONSES = {
  interpretDocument: {
    feeItems: [
      { description: "Tuition Fee",   amount: 15000 },
      { description: "Transport Fee", amount: 3000  },
      { description: "Lab Fee",       amount: 1500  },
      { description: "Library Fee",   amount: 500   },
    ],
    dueDate:        "2026-09-10",
    lateFeePenalty: 200,
    notes:          "Late fee of PKR 200 applies after the 10th of the month.",
    source:         "mock",
  },
};

// ────────────────────────────────────────────────────────────
// PUBLIC: askAssistant
// ────────────────────────────────────────────────────────────

/**
 * Answer a question grounded in live Supabase school data.
 *
 * @param {string}   question        — the user's question
 * @param {Array}    [history]       — prior conversation turns
 *                                    [{ role: 'user'|'assistant', text: string }]
 * @returns {Promise<{answer, source, actions}>}
 */
async function askAssistant(question, history = []) {
  const mockMode = process.env.MOCK_MODE === "true";

  // ── Step 1: Always fetch live data from Supabase ─────────
  const liveContext = await getLiveSchoolContext();
  const { contextText } = liveContext;

  console.log(`[AI] DB snapshot loaded — students: ${liveContext.students.length}, challans: ${liveContext.challans.length}, payments: ${liveContext.payments.length}`);

  // ── Step 2: Mock mode — use live data pattern matching only
  if (mockMode) {
    const directAnswer = tryDirectAnswer(question, liveContext);
    if (directAnswer) {
      console.log(`[AI] [MOCK] Answered directly from live data.`);
      return { answer: directAnswer, source: "live-data", actions: defaultActions() };
    }
    console.log(`[AI] [MOCK] No pattern match — returning help text.`);
    return { answer: GENERIC_HELP_TEXT, source: "mock", actions: defaultActions() };
  }

  // ── Step 3: No API key — fall back to pattern matching ───
  const apiKey = getApiKey();
  if (!apiKey) {
    const directAnswer = tryDirectAnswer(question, liveContext);
    return directAnswer
      ? { answer: directAnswer, source: "live-data", actions: defaultActions() }
      : { answer: GENERIC_HELP_TEXT, source: "mock", actions: defaultActions() };
  }

  // ── Step 4: Call Gemini with full RAG context ─────────────
  try {
    const systemPrompt = buildSystemPrompt(contextText);

    // Convert conversation history to Gemini's content format
    const historyContents = [];
    if (Array.isArray(history) && history.length > 0) {
      // Keep last 8 turns to avoid exceeding token limits
      history.slice(-8).forEach(msg => {
        historyContents.push({
          role:  msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.text || "" }],
        });
      });
    }

    // Append the current question as the final user turn
    historyContents.push({ role: "user", parts: [{ text: question }] });

    const answer = await callGemini(systemPrompt, historyContents);
    console.log(`[AI] Answered via Gemini (source: live DB + Gemini).`);
    return { answer, source: "gemini", actions: defaultActions() };
  } catch (err) {
    console.error("[AI] Gemini call failed:", err.message);
    // Fall back to pattern matching rather than a hard error
    const directAnswer = tryDirectAnswer(question, liveContext);
    return directAnswer
      ? { answer: directAnswer, source: "live-data", actions: defaultActions() }
      : { answer: GENERIC_HELP_TEXT,  source: "mock",      actions: defaultActions() };
  }
}

// ────────────────────────────────────────────────────────────
// PUBLIC: interpretDocument
// ────────────────────────────────────────────────────────────

/**
 * Parse a raw fee document and extract structured data.
 *
 * @param {string} documentText
 * @returns {Promise<{feeItems, dueDate, lateFeePenalty, notes, source}>}
 */
async function interpretDocument(documentText) {
  if (process.env.MOCK_MODE === "true") {
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
      `Return ONLY a valid JSON object (no markdown, no code fences) with these exact fields:\n` +
      `  feeItems: array of { "description": string, "amount": number }\n` +
      `  dueDate: ISO date string (YYYY-MM-DD) or null\n` +
      `  lateFeePenalty: number (0 if not mentioned)\n` +
      `  notes: string\n\n` +
      `Document:\n${documentText}`;

    const raw     = await callGemini(prompt, [{ role: "user", parts: [{ text: prompt }] }], 600);
    const cleaned = raw.replace(/^```json\s*|^```\s*|```\s*$/gm, "").trim();

    let parsed;
    try   { parsed = JSON.parse(cleaned); }
    catch { parsed = { feeItems: [], dueDate: null, lateFeePenalty: 0, notes: raw }; }

    return { ...parsed, source: "gemini" };
  } catch (err) {
    console.error("[AI] interpretDocument failed:", err.message);
    return { feeItems: [], dueDate: null, lateFeePenalty: 0, notes: `Error: ${err.message}`, source: "error" };
  }
}

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────

function defaultActions() {
  return [
    { label: "View E-Challans",    link: "/challans"  },
    { label: "Student Directory",  link: "/students"  },
    { label: "Fee Management",     link: "/fees"      },
    { label: "Dashboard",          link: "/dashboard" },
  ];
}

module.exports = { askAssistant, interpretDocument };
