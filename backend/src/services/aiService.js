/**
 * ============================================================
 * Learnify AI Assistant — OpenAI Service
 * ============================================================
 *
 * Two public functions:
 *   • askAssistant(question, context) — Q&A grounded in
 *     school policy (fee rules, deadlines, late-fee policy, etc.)
 *   • interpretDocument(documentText) — extracts structured JSON
 *     (feeItems, dueDate, lateFeePenalty, notes) from raw text
 *
 * Both use the OpenAI Chat Completions API.
 *
 * ── Environment variables needed ──────────────────────────
 *   OPENAI_API_KEY — your OpenAI platform API key
 *   MOCK_MODE      — set to "true" to skip real API calls
 *                    and return realistic hardcoded responses
 *
 * When MOCK_MODE=true, no OpenAI calls are made — the service
 * returns realistic mock data so the full pipeline can be
 * tested without API costs or credentials.
 */

const OpenAI = require("openai");

// ── OpenAI client (lazy-init so missing creds don't crash startup) ──
let client = null;

function getClient() {
  if (client) return client;

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey || apiKey === "your_openai_api_key_here") {
    console.warn("[AI] OpenAI API key not configured.");
    return null;
  }

  client = new OpenAI({ apiKey });
  return client;
}

// ────────────────────────────────────────────────────────────
// MOCK RESPONSES — returned when MOCK_MODE=true
// ────────────────────────────────────────────────────────────

const MOCK_RESPONSES = {
  askAssistant: (question) => ({
    answer:
      `Based on the school fee policy, fees are due by the 5th of each month. ` +
      `A late fee of PKR 500 is applied after the due date. ` +
      `Fee challans can be downloaded from the parent portal or requested ` +
      `via the school office. For any fee-related queries, please contact ` +
      `the accounts department at accounts@greenvalley.edu.`,
    source: "mock",
  }),

  interpretDocument: {
    feeItems: [
      { description: "Tuition Fee", amount: 15000 },
      { description: "Transport Fee", amount: 3000 },
      { description: "Lab Fee", amount: 1500 },
      { description: "Library Fee", amount: 500 },
    ],
    dueDate: "2026-09-05",
    lateFeePenalty: 500,
    notes: "Payment can be made via bank transfer or online portal. Late fee of PKR 500 applies after due date.",
    source: "mock",
  },
};

// ────────────────────────────────────────────────────────────
// SYSTEM PROMPTS — customize these to adjust AI behaviour
// ────────────────────────────────────────────────────────────

const SYSTEM_PROMPTS = {
  askAssistant:
    `You are Learnify, a helpful school fee management assistant. ` +
    `Answer questions about school fee policies, challans, payment methods, ` +
    `due dates, late fees, and related topics. Be concise and professional. ` +
    `If the question is outside school fee management scope, politely redirect.`,

  interpretDocument:
    `You are a document parser for a school fee management system. ` +
    `Extract structured data from the provided document text. ` +
    `Return a JSON object with these fields:\n` +
    `  - feeItems: array of { description: string, amount: number }\n` +
    `  - dueDate: ISO date string (YYYY-MM-DD)\n` +
    `  - lateFeePenalty: number (0 if not mentioned)\n` +
    `  - notes: string (any additional relevant info)\n` +
    `Return ONLY valid JSON, no extra text.`,
};

// ────────────────────────────────────────────────────────────
// PUBLIC API
// ────────────────────────────────────────────────────────────

/**
 * Ask the AI assistant a question, optionally grounded in school policy context.
 *
 * @param {string} question — The user's question.
 * @param {string} [context] — Optional additional context (e.g. policy text).
 * @returns {Promise<{ answer: string, source: "openai" | "mock" }>}
 */
async function askAssistant(question, context) {
  const mockMode = process.env.MOCK_MODE === "true";

  // ── Mock mode — return hardcoded response, no API call ────
  if (mockMode) {
    console.log(`[AI] [MOCK_MODE] askAssistant: "${question}"`);
    return MOCK_RESPONSES.askAssistant(question);
  }

  const openai = getClient();
  if (!openai) {
    return { answer: "AI service is not configured. Please contact the administrator.", source: "error" };
  }

  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPTS.askAssistant },
    ];

    // Add context if provided
    if (context) {
      messages.push({
        role: "system",
        content: `Additional context:\n${context}`,
      });
    }

    messages.push({ role: "user", content: question });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      max_tokens: 500,
      temperature: 0.3,
    });

    const answer = completion.choices[0]?.message?.content || "No response generated.";
    console.log(`[AI] askAssistant answered (${completion.usage?.total_tokens || "?"} tokens).`);
    return { answer, source: "openai" };
  } catch (err) {
    console.error("[AI] askAssistant failed:", err.message);
    return { answer: `AI error: ${err.message}`, source: "error" };
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

  const openai = getClient();
  if (!openai) {
    return { feeItems: [], dueDate: null, lateFeePenalty: 0, notes: "AI service not configured.", source: "error" };
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPTS.interpretDocument },
        { role: "user", content: documentText },
      ],
      max_tokens: 800,
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content || "{}";

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // If the model returned non-JSON, wrap it in notes
      parsed = { feeItems: [], dueDate: null, lateFeePenalty: 0, notes: raw };
    }

    console.log(`[AI] interpretDocument parsed (${completion.usage?.total_tokens || "?"} tokens).`);
    return { ...parsed, source: "openai" };
  } catch (err) {
    console.error("[AI] interpretDocument failed:", err.message);
    return { feeItems: [], dueDate: null, lateFeePenalty: 0, notes: `AI error: ${err.message}`, source: "error" };
  }
}

module.exports = { askAssistant, interpretDocument };
