// Authentication service — mock implementation
// Replace with Supabase Auth later without changing the interface.

const STORAGE_KEY = 'saas_auth_user'

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

export const authService = {
  async login(email, password) {
    await delay()
    if (!email || !password) throw new Error('Email and password are required')
    if (!email.includes('@')) throw new Error('Invalid email format')
    const user = {
      id: 'usr_' + Date.now(),
      name: 'Admin User',
      email,
      role: 'admin',
      schoolName: 'Greenfield Academy',
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  },

  async signup({ fullName, schoolName, email, password }) {
    await delay()
    if (!fullName || !schoolName || !email || !password) {
      throw new Error('All fields are required')
    }
    const user = {
      id: 'usr_' + Date.now(),
      name: fullName,
      email,
      role: 'admin',
      schoolName,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    return user
  },

  async logout() {
    await delay(100)
    localStorage.removeItem(STORAGE_KEY)
  },

  getCurrentUser() {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  },

  async resetPassword(email) {
    await delay()
    if (!email || !email.includes('@')) throw new Error('Invalid email')
    return { success: true, message: 'Password reset link sent to your email' }
  },
}

export default authService
