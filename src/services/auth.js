// Authentication service — mock implementation
// Replace with Supabase Auth later without changing the interface.

const _LEGACY_STORAGE_KEY = 'learnify_auth_user'
const STORAGE_KEY = 'learnnova_auth_user'
const _LEGACY_STUDENTS_KEY = 'learnify_registered_students'
const STUDENTS_KEY = 'learnnova_registered_students'

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

const ADMIN_EMAIL = 'admin@learnnova.com'
const ADMIN_PASSWORD = 'learnify'

const getRegisteredStudents = () => {
  const stored = localStorage.getItem(STUDENTS_KEY) || localStorage.getItem(_LEGACY_STUDENTS_KEY)
  return stored ? JSON.parse(stored) : []
}

const saveRegisteredStudents = (students) => {
  localStorage.setItem(STUDENTS_KEY, JSON.stringify(students))
}

export const authService = {
  async login(email, password) {
    await delay()
    if (!email || !password) throw new Error('Email and password are required')
    if (!email.includes('@')) throw new Error('Invalid email format')

    // Check admin credentials
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const user = {
        id: 'usr_admin',
        name: 'Admin',
        email: ADMIN_EMAIL,
        role: 'admin',
        schoolName: 'LearnNova',
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      return user
    }

    // Check registered student credentials
    const students = getRegisteredStudents()
    const student = students.find(s => s.email === email && s.password === password)
    if (!student) throw new Error('Invalid email or password.')

    const user = {
      id: student.id,
      name: student.name,
      email: student.email,
      role: 'student',
      studentId: student.studentId,
      class: student.class,
      section: student.section,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  },

  async signup({ fullName, email, password, studentId, class: studentClass, section }) {
    await delay()
    if (!fullName || !email || !password || !studentId || !studentClass || !section) {
      throw new Error('All fields are required')
    }

    const students = getRegisteredStudents()
    if (students.some(s => s.email === email)) {
      throw new Error('An account with this email already exists')
    }
    if (students.some(s => s.studentId === studentId)) {
      throw new Error('This Student ID is already registered')
    }

    const newStudent = {
      id: 'usr_stu_' + Date.now(),
      name: fullName,
      email,
      password,
      studentId,
      class: studentClass,
      section,
      role: 'student',
    }
    students.push(newStudent)
    saveRegisteredStudents(students)

    const user = {
      id: newStudent.id,
      name: newStudent.name,
      email: newStudent.email,
      role: 'student',
      studentId: newStudent.studentId,
      class: newStudent.class,
      section: newStudent.section,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  },

  async logout() {
    await delay(100)
    localStorage.removeItem(STORAGE_KEY)
  },

  getCurrentUser() {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(_LEGACY_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  },

  async resetPassword(email) {
    await delay()
    if (!email || !email.includes('@')) throw new Error('Invalid email')
    return { success: true, message: 'Password reset link sent to your email' }
  },
}

export default authService
