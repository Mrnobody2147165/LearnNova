// AI Assistant service — mock implementation
// Replace with Node.js/Express AI backend later.
// The interface (askAssistant, generateFeeSummary, analyzeCollection)
// should remain the same so the frontend doesn't need changes.

const delay = (ms = 800) => new Promise(r => setTimeout(r, ms))

const mockResponses = {
  'who hasn\'t paid this month': {
    text: 'I found 213 students with outstanding fees for August 2026.\n\nTotal outstanding: PKR 2,710,000\n\nTop classes with outstanding fees:\n• Class 8-B — PKR 384,000\n• Class 9-A — PKR 326,000\n• Class 7-C — PKR 281,000',
    actions: [
      { label: 'View Students', link: '/students?feeStatus=Pending' },
      { label: 'Generate Report', link: '/reports' },
    ],
  },
  'show overdue students': {
    text: 'There are currently 87 students with overdue fees (past due date).\n\nTotal overdue amount: PKR 1,200,000\n\nBreakdown by class:\n• Class 8-C — PKR 198,000 (14 students)\n• Class 9-B — PKR 167,000 (12 students)\n• Class 7-C — PKR 145,000 (11 students)',
    actions: [
      { label: 'View Overdue', link: '/students?feeStatus=Overdue' },
      { label: 'Send Reminders', link: '/challans' },
    ],
  },
  'how much fee is outstanding': {
    text: 'As of today, the total outstanding fee amount is PKR 2,710,000.\n\nThis represents 14.7% of the total generated fees (PKR 18,400,000).\n\nOf this outstanding amount:\n• PKR 1,200,000 is overdue (past due date)\n• PKR 1,510,000 is pending (due but not yet overdue)',
    actions: [
      { label: 'View Fee Dashboard', link: '/fees' },
      { label: 'Download Report', link: '/reports' },
    ],
  },
  'generate a fee collection report': {
    text: 'I\'ve prepared a fee collection summary for August 2026.\n\nTotal Generated: PKR 18,400,000\nCollected: PKR 15,700,000 (85.3%)\nOutstanding: PKR 2,710,000 (14.7%)\nOverdue: PKR 1,200,000\n\nCollection improved by 12.4% compared to last month.\n\nThe report is ready for download.',
    actions: [
      { label: 'Download Report', link: '/reports' },
      { label: 'View Details', link: '/fees' },
    ],
  },
  'which class has the highest outstanding fees': {
    text: 'Class 8-B has the highest outstanding fees at PKR 384,000.\n\nThis is followed by:\n• Class 9-A — PKR 326,000\n• Class 7-C — PKR 281,000\n• Class 10-B — PKR 245,000\n• Class 6-C — PKR 198,000\n\nClass 8-B has 42 students with unpaid fees out of 64 total students.',
    actions: [
      { label: 'View Class 8-B', link: '/students?class=8-B' },
      { label: 'Send Reminders', link: '/challans' },
    ],
  },
}

const defaultResponse = {
  text: 'I can help you with questions about fees, students, attendance, and school performance. Try asking about unpaid fees, outstanding amounts, overdue students, or collection reports.',
  actions: [],
}

export const aiService = {
  async askAssistant(question) {
    await delay()
    const normalized = question.toLowerCase().trim()
    for (const [key, response] of Object.entries(mockResponses)) {
      if (normalized.includes(key) || key.includes(normalized.slice(0, 20))) {
        return { ...response, question }
      }
    }
    return { ...defaultResponse, question }
  },

  async generateFeeSummary() {
    await delay()
    return {
      text: 'Fee Summary for August 2026:\n\nTotal Generated: PKR 18,400,000\nCollected: PKR 15,700,000\nOutstanding: PKR 2,710,000\nCollection Rate: 85.3%\n\nTop performing classes: Class 6-A (96%), Class 10-A (94%), Class 9-A (91%)',
      actions: [{ label: 'View Fee Dashboard', link: '/fees' }],
    }
  },

  async analyzeCollection() {
    await delay()
    return {
      text: 'Collection Analysis:\n\nThis month\'s collection rate of 85.3% is above the 80% target.\n\nTrends:\n• Collection improved 12.4% month-over-month\n• Online payments now account for 42% of collections\n• Cash payments decreased to 28%\n\nRecommendation: Send reminders to the 213 students with pending fees to push collection rate above 90%.',
      actions: [{ label: 'Send Reminders', link: '/challans' }],
    }
  },
}

export default aiService
