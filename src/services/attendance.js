// Attendance service — mock implementation
// Replace with Supabase queries later.

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

let attendanceRecords = {}

export const attendanceService = {
  async getByDate(classId, section, date) {
    await delay()
    const key = `${classId}-${section}-${date}`
    return attendanceRecords[key] || null
  },

  async save(classId, section, date, records) {
    await delay()
    const key = `${classId}-${section}-${date}`
    attendanceRecords[key] = { classId, section, date, records, savedAt: new Date().toISOString() }
    return { success: true, count: records.length }
  },

  async getStats() {
    await delay()
    return {
      averageAttendance: 92.5,
      presentToday: 1720,
      absentToday: 122,
      lateToday: 45,
    }
  },
}

export default attendanceService
