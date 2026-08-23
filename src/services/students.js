// Students service — mock implementation
// Replace with Supabase queries later.

import { students as mockStudents, teachers as mockTeachers, classes as mockClasses } from '../data/students'

let studentList = [...mockStudents]
let teacherList = [...mockTeachers]
let classList = [...mockClasses]

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

export const studentService = {
  async getAll() {
    await delay()
    return [...studentList]
  },

  async getById(id) {
    await delay()
    return studentList.find(s => s.id === id) || null
  },

  async create(data) {
    await delay()
    const newStudent = {
      id: data.studentId || 'STU-2026-' + String(150 + studentList.length).padStart(5, '0'),
      ...data,
      feeStatus: data.feeStatus || 'Pending',
      status: data.status || 'Active',
    }
    studentList = [newStudent, ...studentList]
    return newStudent
  },

  async update(id, data) {
    await delay()
    const idx = studentList.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Student not found')
    studentList[idx] = { ...studentList[idx], ...data }
    return studentList[idx]
  },

  async remove(id) {
    await delay()
    studentList = studentList.filter(s => s.id !== id)
    return { success: true }
  },

  // Teachers
  async getTeachers() {
    await delay()
    return [...teacherList]
  },

  async createTeacher(data) {
    await delay()
    const newTeacher = {
      id: 'EMP-' + String(teacherList.length + 1).padStart(3, '0'),
      ...data,
      status: 'Active',
    }
    teacherList = [...teacherList, newTeacher]
    return newTeacher
  },

  async updateTeacher(id, data) {
    await delay()
    const idx = teacherList.findIndex(t => t.id === id)
    if (idx === -1) throw new Error('Teacher not found')
    teacherList[idx] = { ...teacherList[idx], ...data }
    return teacherList[idx]
  },

  async removeTeacher(id) {
    await delay()
    teacherList = teacherList.filter(t => t.id !== id)
    return { success: true }
  },

  // Classes
  async getClasses() {
    await delay()
    return [...classList]
  },
}

export default studentService
