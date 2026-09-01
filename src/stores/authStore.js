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
}))
