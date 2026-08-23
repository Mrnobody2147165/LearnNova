// Exams service — mock implementation
// Replace with Supabase queries later.

import { exams as mockExams, grades as mockGrades } from '../data/academics'

let examList = [...mockExams]
let gradeList = [...mockGrades]

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

const calcGrade = (marks, total) => {
  const pct = (marks / total) * 100
  if (pct >= 90) return 'A+'
  if (pct >= 80) return 'A'
  if (pct >= 70) return 'B+'
  if (pct >= 60) return 'B'
  if (pct >= 50) return 'C'
  return 'F'
}

export const examService = {
  async getAll() {
    await delay()
    return [...examList]
  },

  async getById(id) {
    await delay()
    return examList.find(e => e.id === id) || null
  },

  async create(data) {
    await delay()
    const newExam = {
      id: 'EX-' + (examList.length + 1),
      ...data,
      status: 'Scheduled',
      resultsPublished: false,
    }
    examList = [newExam, ...examList]
    return newExam
  },

  async update(id, data) {
    await delay()
    const idx = examList.findIndex(e => e.id === id)
    if (idx === -1) throw new Error('Exam not found')
    examList[idx] = { ...examList[idx], ...data }
    return examList[idx]
  },

  async remove(id) {
    await delay()
    examList = examList.filter(e => e.id !== id)
    return { success: true }
  },

  async publishResults(examId) {
    await delay()
    const idx = examList.findIndex(e => e.id === examId)
    if (idx === -1) throw new Error('Exam not found')
    examList[idx] = { ...examList[idx], resultsPublished: true, status: 'Completed' }
    return examList[idx]
  },

  // Grades
  async getGrades(examId) {
    await delay()
    return gradeList.filter(g => g.examId === examId)
  },

  async saveGrades(examId, gradesData) {
    await delay()
    gradeList = gradeList.filter(g => g.examId !== examId)
    const newGrades = gradesData.map(g => ({
      id: 'GRD-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
      examId,
      ...g,
      grade: calcGrade(g.marks, g.totalMarks),
    }))
    gradeList = [...gradeList, ...newGrades]
    return newGrades
  },

  async getStudentGrades(studentId) {
    await delay()
    return gradeList.filter(g => g.studentId === studentId)
  },
}

export default examService
