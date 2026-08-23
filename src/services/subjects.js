// Subjects service — mock implementation
// Replace with Supabase queries later.

import { subjects as mockSubjects } from '../data/academics'

let subjectList = [...mockSubjects]

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

export const subjectService = {
  async getAll() {
    await delay()
    return [...subjectList]
  },

  async getById(id) {
    await delay()
    return subjectList.find(s => s.id === id) || null
  },

  async create(data) {
    await delay()
    const newSubject = {
      id: 'SUB-' + (subjectList.length + 1),
      ...data,
    }
    subjectList = [...subjectList, newSubject]
    return newSubject
  },

  async update(id, data) {
    await delay()
    const idx = subjectList.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Subject not found')
    subjectList[idx] = { ...subjectList[idx], ...data }
    return subjectList[idx]
  },

  async remove(id) {
    await delay()
    subjectList = subjectList.filter(s => s.id !== id)
    return { success: true }
  },

  async getByClass(classId) {
    await delay()
    return subjectList.filter(s => s.classes.includes(classId))
  },
}

export default subjectService
