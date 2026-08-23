// Homework service — mock implementation
// Replace with Supabase queries later.

import { homework as mockHomework, homeworkSubmissions as mockSubmissions } from '../data/academics'

let homeworkList = [...mockHomework]
let submissionList = [...mockSubmissions]

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

export const homeworkService = {
  async getAll() {
    await delay()
    return [...homeworkList]
  },

  async getById(id) {
    await delay()
    return homeworkList.find(h => h.id === id) || null
  },

  async create(data) {
    await delay()
    const newHomework = {
      id: 'HW-' + (homeworkList.length + 1),
      ...data,
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0],
    }
    homeworkList = [newHomework, ...homeworkList]
    return newHomework
  },

  async update(id, data) {
    await delay()
    const idx = homeworkList.findIndex(h => h.id === id)
    if (idx === -1) throw new Error('Homework not found')
    homeworkList[idx] = { ...homeworkList[idx], ...data }
    return homeworkList[idx]
  },

  async remove(id) {
    await delay()
    homeworkList = homeworkList.filter(h => h.id !== id)
    return { success: true }
  },

  // Submissions
  async getSubmissions(homeworkId) {
    await delay()
    return submissionList.filter(s => s.homeworkId === homeworkId)
  },

  async getStudentSubmissions(studentId) {
    await delay()
    return submissionList.filter(s => s.studentId === studentId)
  },

  async submit(homeworkId, studentId, fileName) {
    await delay()
    const idx = submissionList.findIndex(s => s.homeworkId === homeworkId && s.studentId === studentId)
    if (idx !== -1) {
      submissionList[idx] = { ...submissionList[idx], status: 'Submitted', submittedAt: new Date().toISOString().split('T')[0], fileName }
      return submissionList[idx]
    }
    const newSubmission = {
      id: 'SUB-HW-' + Date.now(),
      homeworkId,
      studentId,
      status: 'Submitted',
      submittedAt: new Date().toISOString().split('T')[0],
      fileName,
    }
    submissionList = [...submissionList, newSubmission]
    return newSubmission
  },
}

export default homeworkService
