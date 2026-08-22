// Challans service — mock implementation
// Replace with Supabase queries later.

import { challans as mockChallans, challanStats } from '../data/challans'

let challanList = [...mockChallans]

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

export const challanService = {
  async getAll() {
    await delay()
    return [...challanList]
  },

  async getById(id) {
    await delay()
    return challanList.find(c => c.id === id) || null
  },

  async generate(month, classFilter) {
    await delay()
    const newChallans = []
    // Simulate generating challans for students
    const count = Math.floor(Math.random() * 50) + 100
    for (let i = 0; i < Math.min(count, 5); i++) {
      const num = challanList.length + i + 1
      const newChallan = {
        id: `CHL-2026-08-${String(num).padStart(3, '0')}`,
        challanNo: `CHL-2026-08-${String(num).padStart(3, '0')}`,
        studentId: 'STU-2026-00' + String(150 + i),
        studentName: ['New Student ' + (i + 1)],
        class: classFilter || '8-B',
        month: month || 'August 2026',
        amount: 11500,
        dueDate: '2026-08-10',
        issueDate: new Date().toISOString().split('T')[0],
        status: 'Pending',
        feeBreakdown: [{ name: 'Tuition', amount: 8000 }, { name: 'Computer', amount: 1000 }, { name: 'Exam', amount: 500 }, { name: 'Transport', amount: 2000 }],
        previousBalance: 0,
        discount: 0,
        lateFee: 0,
        total: 11500,
      }
      newChallans.push(newChallan)
    }
    challanList = [...newChallans, ...challanList]
    return newChallans
  },

  async sendReminders(ids) {
    await delay()
    let count = 0
    challanList = challanList.map(c => {
      if (ids ? ids.includes(c.id) : c.status === 'Pending') {
        count++
        return { ...c, status: c.status === 'Pending' ? 'Sent' : c.status }
      }
      return c
    })
    return { success: true, sent: count || ids?.length || 47 }
  },

  async cancel(id) {
    await delay()
    const idx = challanList.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Challan not found')
    challanList[idx] = { ...challanList[idx], status: 'Cancelled' }
    return challanList[idx]
  },

  async getStats() {
    await delay()
    return { ...challanStats }
  },
}

export default challanService
