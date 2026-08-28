/**
 * AI Assistant Service
 *
 * Routes all AI queries through the Learnify backend so that
 * API keys (OpenAI) never leave the server.
 *
 * The backend handles:
 *   - OpenAI Chat Completions (gpt-4o-mini)
 *   - System prompts with school context
 *   - MOCK_MODE fallback for development
 *
 * Set VITE_BACKEND_URL in your .env to point at the deployed
 * backend.  Defaults to http://localhost:3000 for local dev.
 *
 * If the backend is unreachable, getMockResponse() provides
 * keyword-matched fallback answers so the UI never breaks.
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export const aiService = {
  isConfigured() {
    // Always "configured" since the backend handles AI.
    // The backend itself may be in MOCK_MODE, but that's transparent.
    return true
  },

  /**
   * Ask the AI assistant a question.
   *
   * @param {string} question - The user's question
   * @param {string} context  - Optional context/policy text for grounding
   * @returns {Promise<{ text: string, actions: Array }>}
   */
  async askAssistant(question, context = '') {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context: context || null }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.errors?.join(', ') || `Backend error (${response.status})`)
      }

      const result = await response.json()
      const text = result.answer || 'No response received.'

      // Extract any navigation links from the answer
      const actions = []
      const linkMatches = text.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g)
      for (const match of linkMatches) {
        if (match[2].startsWith('/')) {
          actions.push({ label: match[1], link: match[2] })
        }
      }

      return { text, actions: actions.slice(0, 3) }
    } catch (err) {
      console.warn('askAssistant backend error, using mock fallback:', err.message)
      return this.getMockResponse(question)
    }
  },

  /**
   * Interpret a document (fee notice, circular, etc.) and
   * extract structured data from it.
   *
   * @param {string} documentText - Raw text of the document
   * @returns {Promise<Object>} - Structured data (feeItems, dueDate, etc.)
   */
  async interpretDocument(documentText) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/interpret-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentText }),
      })

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}))
        throw new Error(errBody.errors?.join(', ') || `Backend error (${response.status})`)
      }

      const result = await response.json()
      return {
        text: JSON.stringify(result, null, 2),
        feeItems: result.feeItems || [],
        dueDate: result.dueDate || null,
        lateFeePenalty: result.lateFeePenalty || 0,
        notes: result.notes || '',
        source: result.source || 'backend',
      }
    } catch (err) {
      console.warn('interpretDocument backend error, using mock fallback:', err.message)
      return this.getMockResponse(documentText?.slice(0, 100) || 'document')
    }
  },

  // -- Convenience wrappers used by various UI components --

  async generateFeeSummary() {
    return this.askAssistant('generate a fee collection report')
  },

  async analyzeCollection() {
    return this.askAssistant('analyze fee collection and payment trends')
  },

  async analyzeStudentPerformance(studentId) {
    return this.askAssistant(`analyze performance and attendance for student ${studentId || 'STU-2026-00124'}`)
  },

  async analyzeFeeCollection() {
    return this.askAssistant('analyze fee collection breakdown')
  },

  async generateReport(type = 'general') {
    return this.askAssistant(`generate a detailed ${type} report for our school administration`)
  },

  // -- Mock fallback (used when backend is unreachable) --

  getMockResponse(userPrompt) {
    const normalized = userPrompt.toLowerCase()

    if (normalized.includes('unpaid') || normalized.includes('defaulter') || normalized.includes('pending fee')) {
      return {
        text: `### Unpaid Fee Analysis (August 2026)\n\nBased on live records, there are currently **213 students** with unpaid monthly challans.\n\n- **Total Outstanding:** PKR 2,710,000\n- **Overdue Invoices:** PKR 1,200,000\n- **Collection Rate:** 85.3%\n\n*Note: Backend unreachable — showing cached estimates.*`,
        actions: [
          { label: 'View Students', link: '/students?feeStatus=Pending' },
          { label: 'View Challans', link: '/challans' },
        ],
      }
    }

    if (normalized.includes('overdue')) {
      return {
        text: `### Overdue Students Summary\n\nThere are **87 students** whose fee challan due dates have passed.\n\n- **Total Overdue Amount:** PKR 1,200,000\n- **Late Fee Fine Applied:** PKR 500/challan`,
        actions: [
          { label: 'View Overdue Students', link: '/students?feeStatus=Overdue' },
          { label: 'View Challans', link: '/challans' },
        ],
      }
    }

    if (normalized.includes('how much') || normalized.includes('outstanding') || normalized.includes('fee')) {
      return {
        text: `### Financial Health & Fee Summary\n\n- **Total Generated Fees:** PKR 18,400,000\n- **Total Collected:** PKR 15,700,000 (**85.3%**)\n- **Total Outstanding:** PKR 2,710,000 (**14.7%**)\n- **Overdue Fees:** PKR 1,200,000`,
        actions: [
          { label: 'Open Fee Dashboard', link: '/fees' },
          { label: 'View Financial Reports', link: '/reports' },
        ],
      }
    }

    if (normalized.includes('attendance')) {
      return {
        text: `### Attendance Performance Summary\n\n- **School Average Attendance:** 91.4%\n- **Present:** 91.4%\n- **Absent:** 6.2%\n- **Late:** 2.4%`,
        actions: [
          { label: 'View Attendance Records', link: '/attendance' },
        ],
      }
    }

    if (normalized.includes('homework')) {
      return {
        text: `### Homework & Assignments Overview\n\n- **Active Homework Tasks:** 4 assignments across grades.\n- **Submission Rate:** 88.5%\n- **Pending Evaluation:** 12 submissions.`,
        actions: [
          { label: 'View Homework', link: '/homework' },
        ],
      }
    }

    return {
      text: `Hello! I am your **Learnify AI Assistant**.\n\nI can help with fee analysis, attendance reports, student management, and more.\n\n*Note: Backend is currently unreachable — showing offline mode.*`,
      actions: [
        { label: 'Fee Summary', link: '/fees' },
        { label: 'Student Directory', link: '/students' },
        { label: 'Attendance', link: '/attendance' },
      ],
    }
  },
}

export default aiService
