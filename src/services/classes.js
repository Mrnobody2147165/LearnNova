/**
 * Classes Service
 * Manages school class data (CRUD).
 * Uses localStorage (learnnova_classes key) with seed data fallback.
 * Replace with Supabase/REST API calls later without changing the interface.
 */

import { classes as seedClasses, teachers as seedTeachers } from '../data/students'

const _LEGACY_STORAGE_KEY = 'learnify_classes'
const STORAGE_KEY = 'learnnova_classes'

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

const getStoredClasses = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(_LEGACY_STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  // Seed from data file
  const seeded = seedClasses.map((c, i) => ({
    id: c.id || 'CLS-' + (i + 1),
    name: c.name,
    sections: c.sections || ['A', 'B'],
    teacher: c.teacher || '',
    subjects: _defaultSubjectsFor(c.name),
    studentIds: [],
    capacity: c.students || 0,
    studentCount: c.students || 0,
    academicYear: '2025-2026',
    status: 'Active',
  }))
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
  return seeded
}

const _defaultSubjectsFor = (className) => {
  return ['Mathematics', 'English', 'Science', 'Urdu', 'Social Studies']
}

const saveClasses = (classes) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(classes))
}

export const classService = {
  /**
   * Get all classes.
   */
  async getAll() {
    await delay()
    return getStoredClasses()
  },

  /**
   * Get a single class by ID.
   */
  async getById(id) {
    await delay()
    const classes = getStoredClasses()
    return classes.find(c => c.id === id) || null
  },

  /**
   * Create a new class.
   */
  async create(data) {
    await delay(300)
    if (!data.name) throw new Error('Class name is required')

    const classes = getStoredClasses()
    const newClass = {
      id: 'CLS-' + Date.now(),
      name: data.name,
      sections: data.sections || ['A', 'B'],
      teacher: data.teacher || '',
      subjects: data.subjects || _defaultSubjectsFor(data.name),
      studentIds: data.studentIds || [],
      capacity: data.capacity || 0,
      studentCount: 0,
      academicYear: data.academicYear || '2025-2026',
      status: 'Active',
    }
    classes.push(newClass)
    saveClasses(classes)
    return newClass
  },

  /**
   * Update an existing class.
   */
  async update(id, data) {
    await delay(300)
    const classes = getStoredClasses()
    const index = classes.findIndex(c => c.id === id)
    if (index === -1) throw new Error('Class not found')

    classes[index] = {
      ...classes[index],
      ...data,
      id, // prevent ID overwrite
    }
    saveClasses(classes)
    return classes[index]
  },

  /**
   * Delete a class.
   */
  async delete(id) {
    await delay()
    const classes = getStoredClasses().filter(c => c.id !== id)
    saveClasses(classes)
    return { success: true }
  },

  /**
   * Get available teachers list.
   */
  getTeachers() {
    return seedTeachers
  },

  /**
   * Get available subjects list.
   */
  getSubjects() {
    return [
      'Mathematics', 'English', 'Science', 'Physics', 'Chemistry',
      'Biology', 'Urdu', 'Islamic Studies', 'Social Studies', 'History',
      'Computer Science', 'Statistics', 'Literature', 'Physical Education',
      'Art', 'Geography',
    ]
  },
}

export default classService
