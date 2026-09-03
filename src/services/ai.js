/**
 * ============================================================
 * LearnNova AI Service — Frontend Client
 * ============================================================
 *
 * All AI questions are handled by the Express backend at
 * VITE_BACKEND_URL/api/ai/ask, which:
 *   1. Fetches a fresh live snapshot from Supabase (students,
 *      classes, challans, payments) using the service-role key.
 *   2. Builds a rich, detailed RAG context document.
 *   3. Calls Gemini with that context + conversation history.
 *   4. Falls back to keyword pattern matching when Gemini is
 *      unavailable, still using the live DB data.
 *
 * This file is intentionally thin — no DB queries, no Gemini
 * calls, no in-browser RAG. All of that lives on the server
 * where the key is secure and the data access is reliable.
 *
 * ── Public API ────────────────────────────────────────────
 *   aiService.isConfigured()           → always true (backend handles it)
 *   aiService.askAssistant(q, history) → { text, actions, source }
 *   aiService.interpretDocument(text)  → { text, feeItems, ... }
 *   aiService.generateFeeSummary()
 *   aiService.analyzeCollection()
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3005'

// ── Shared fetch wrapper ────────────────────────────────────

async function backendPost(path, body) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err.errors?.[0]) || `Backend error ${res.status}`)
  }

  return res.json()
}

// ── Default quick-action buttons returned with every answer ──

const DEFAULT_ACTIONS = [
  { label: 'View E-Challans',   link: '/challans'  },
  { label: 'Student Directory', link: '/students'  },
  { label: 'Fee Management',    link: '/fees'      },
  { label: 'Dashboard',         link: '/dashboard' },
]

// ── Map conversation history to the shape the backend expects ──
// AIAssistant.jsx stores messages as { type: 'user'|'assistant', text }
// The backend expects { role: 'user'|'assistant', text }

function mapHistory(messages = []) {
  return messages
    .filter(m => m && typeof m.text === 'string')
    .map(m => ({
      role: m.type === 'user' ? 'user' : 'assistant',
      text: m.text,
    }))
}

// =========================================================================
// PUBLIC AI SERVICE
// =========================================================================

export const aiService = {
  /**
   * Always returns true — the backend decides whether Gemini is
   * active based on the server-side GEMINI_API_KEY. The frontend
   * UI badge is updated separately via the /health or first response.
   */
  isConfigured() {
    return true
  },

  /**
   * Ask a question. The backend fetches live DB data, builds the
   * RAG context, and calls Gemini — then returns the answer here.
   *
   * @param {string} question
   * @param {Array}  conversationHistory — prior messages from the chat UI
   * @returns {Promise<{ text, actions, source }>}
   */
  async askAssistant(question, conversationHistory = []) {
    try {
      const data = await backendPost('/api/ai/ask', {
        question,
        history: mapHistory(conversationHistory),
      })

      return {
        text:    data.answer  || 'No response received.',
        actions: data.actions?.length ? data.actions : DEFAULT_ACTIONS,
        source:  data.source  || 'backend',
      }
    } catch (err) {
      console.error('[AI] askAssistant error:', err.message)

      // Surface a clear error message in the chat rather than a silent fail
      return {
        text: [
          '### ⚠️ Connection Error',
          '',
          `Could not reach the LearnNova backend at \`${BACKEND_URL}\`.`,
          '',
          '**To fix this:**',
          '1. Make sure the backend server is running: `cd backend && npm run dev`',
          '2. Check that `VITE_BACKEND_URL` in your `.env` matches the backend port.',
        ].join('\n'),
        actions: DEFAULT_ACTIONS,
        source:  'error',
      }
    }
  },

  /**
   * Parse a raw fee document and extract structured data.
   * Proxied to POST /api/ai/interpret-document on the backend.
   *
   * @param {string} documentText
   * @returns {Promise<{ text, feeItems, dueDate, lateFeePenalty, notes, source }>}
   */
  async interpretDocument(documentText) {
    try {
      const result = await backendPost('/api/ai/interpret-document', { documentText })
      return {
        text:           result.notes || 'Document parsed successfully.',
        feeItems:       result.feeItems       || [],
        dueDate:        result.dueDate        || null,
        lateFeePenalty: result.lateFeePenalty || 0,
        notes:          result.notes          || '',
        source:         result.source         || 'backend',
      }
    } catch (err) {
      console.error('[AI] interpretDocument error:', err.message)
      return {
        text:           '### Document Parsing Error\n\nCould not process the document. Please check the backend connection.',
        feeItems:       [],
        dueDate:        null,
        lateFeePenalty: 0,
        notes:          err.message,
        source:         'error',
      }
    }
  },

  // ── Convenience helpers used elsewhere in the app ──────────

  async generateFeeSummary() {
    return this.askAssistant('Who has unpaid fees and what is the total outstanding amount?')
  },

  async analyzeCollection() {
    return this.askAssistant('Analyze fee collection: how much has been collected vs outstanding?')
  },

  async analyzeStudentPerformance(studentId) {
    return this.askAssistant(
      `Analyze fee status and records for student${studentId ? ` with ID ${studentId}` : 's'}.`
    )
  },

  async analyzeFeeCollection() {
    return this.askAssistant('Give me a detailed fee collection breakdown by class.')
  },

  async generateReport(type = 'general') {
    return this.askAssistant(`Generate a detailed ${type} administrative report for the school.`)
  },
}

export default aiService
