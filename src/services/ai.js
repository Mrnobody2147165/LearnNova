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
  'attendance below 75': {
    text: 'I found 34 students with attendance below 75%.\n\nBreakdown by class:\n• Class 9-B — 8 students\n• Class 8-C — 7 students\n• Class 7-C — 6 students\n• Class 10-B — 5 students\n• Others — 8 students\n\nThese students may need intervention to improve their attendance.',
    actions: [
      { label: 'View Attendance', link: '/academics/attendance' },
      { label: 'View Students', link: '/students' },
    ],
  },
  'lowest average grade': {
    text: 'Physics has the lowest average grade across all subjects at 78%.\n\nSubject averages:\n• Physics — 78%\n• Mathematics — 82%\n• Urdu — 84%\n• English — 91%\n• Computer Science — 95%\n\nConsider additional support for Physics students, especially in Class 9-B where the average is only 71%.',
    actions: [
      { label: 'View Grades', link: '/academics/grades' },
      { label: 'View Subjects', link: '/subjects' },
    ],
  },
  'which class is performing best': {
    text: 'Class 10-A is the top performing class with an average grade of 89% and 94% attendance.\n\nTop 3 classes:\n• Class 10-A — 89% average, 94% attendance\n• Class 8-A — 87% average, 92% attendance\n• Class 9-A — 85% average, 91% attendance\n\nClass 10-A also has the highest homework completion rate at 96%.',
    actions: [
      { label: 'View Classes', link: '/classes' },
      { label: 'View Reports', link: '/reports' },
    ],
  },
  'fee collection summary': {
    text: 'Fee Collection Summary for August 2026:\n\nTotal Generated: PKR 18,400,000\nCollected: PKR 15,700,000 (85.3%)\nOutstanding: PKR 2,710,000 (14.7%)\nOverdue: PKR 1,200,000\n\nCollection improved by 12.4% compared to last month.',
    actions: [
      { label: 'View Fee Dashboard', link: '/fees' },
      { label: 'Download Report', link: '/reports' },
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

  async analyzeStudentPerformance(studentId) {
    await delay()
    return {
      text: `Student Performance Analysis for ${studentId || 'STU-2026-00124'}:\n\nOverall Progress: 89% (↑ 11% since June)\n\nStrengths:\n• Computer Science — 95%\n• English — 91%\n\nAreas to Improve:\n• Physics — 78%\n• Mathematics — 82%\n\nAttendance: 92% (above school average of 91.4%)\nHomework Completion: 94%\n\nRecommendation: Focus on Physics problem-solving practice. Consider peer tutoring for Mathematics.`,
      actions: [
        { label: 'View Student', link: `/students/${studentId || 'STU-2026-00124'}` },
        { label: 'View Grades', link: '/academics/grades' },
      ],
    }
  },

  async analyzeFeeCollection() {
    await delay()
    return {
      text: 'Fee Collection Analysis for August 2026:\n\nTotal Generated: PKR 18,400,000\nCollected: PKR 15,700,000 (85.3%)\nOutstanding: PKR 2,710,000 (14.7%)\nOverdue: PKR 1,200,000\n\nPayment Methods:\n• Online — 42% (PKR 6.59M)\n• Cash — 28% (PKR 4.40M)\n• Bank Transfer — 20% (PKR 3.14M)\n• Card — 10% (PKR 1.57M)\n\nRecommendation: Send reminders to 213 students with pending fees to push collection above 90%.',
      actions: [
        { label: 'View Fees', link: '/fees' },
        { label: 'Send Reminders', link: '/challans' },
      ],
    }
  },

  async generateReport(type = 'general') {
    await delay()
    const reports = {
      general: 'School Performance Report — August 2026\n\nTotal Students: 1,842\nTotal Teachers: 86\nAverage Attendance: 91.4%\nAverage Grade: 84%\nFee Collection Rate: 85.3%\n\nTop performing class: Class 10-A (89% average)\nSubject needing attention: Physics (78% average)\n\nThe report is ready for download.',
      attendance: 'Attendance Report — August 2026\n\nOverall Attendance: 91.4%\nPresent: 91.4% | Absent: 6.2% | Late: 2.4%\n\n34 students below 75% attendance threshold.\nBest class: Class 10-A (94%)\nNeeds attention: Class 9-B (83%)',
      fees: 'Fee Collection Report — August 2026\n\nTotal Generated: PKR 18,400,000\nCollected: PKR 15,700,000\nOutstanding: PKR 2,710,000\nCollection Rate: 85.3%\n\n213 students with outstanding fees.\n87 students with overdue fees.',
      academic: 'Academic Performance Report — August 2026\n\nSubject Averages:\n• Computer Science — 95%\n• English — 91%\n• Mathematics — 82%\n• Physics — 78%\n\nTop student: Bilal Khan (Class 6-A) — 96% average\n7 exams scheduled, 5 exams completed.',
    }
    return {
      text: reports[type] || reports.general,
      actions: [
        { label: 'View Reports', link: '/reports' },
        { label: 'Download', link: '/reports' },
      ],
    }
  },
}

export default aiService
