import { create } from 'zustand'
import authService from '../services/auth'

export const useAuthStore = create((set, get) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: !!authService.getCurrentUser(),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null })
    try {
      const user = await authService.login(email, password)
      set({ user, isAuthenticated: true, loading: false })
      return user
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  signup: async (data) => {
    set({ loading: true, error: null })
    try {
      const user = await authService.signup(data)
      set({ user, isAuthenticated: true, loading: false })
      return user
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  logout: async () => {
    await authService.logout()
    set({ user: null, isAuthenticated: false })
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null })
    try {
      const result = await authService.resetPassword(email)
      set({ loading: false })
      return result
    } catch (err) {
      set({ error: err.message, loading: false })
      throw err
    }
  },

  switchRole: (targetRole) => {
    if (targetRole === 'admin') {
      const adminUser = {
        id: 'usr_admin',
        name: 'Admin',
        email: 'admin@learnify.com',
        role: 'admin',
        schoolName: 'Learnify',
      }
      localStorage.setItem('learnify_auth_user', JSON.stringify(adminUser))
      set({ user: adminUser, isAuthenticated: true })
      return adminUser
    } else {
      const studentUser = {
        id: 'usr_stu_001',
        name: 'Ahmed Khan',
        email: 'ahmed.khan@student.learnify.com',
        role: 'student',
        studentId: 'STU-2026-00124',
        class: '8',
        section: 'B',
      }
      localStorage.setItem('learnify_auth_user', JSON.stringify(studentUser))
      set({ user: studentUser, isAuthenticated: true })
      return studentUser
    }
  },
}))
