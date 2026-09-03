import { create } from 'zustand'
import { supabase } from '../services/supabase'

const STORAGE_KEY = 'saas_school_data'

const defaultSchool = {
  name: 'LearnNova Model Grammar School',
  logo: null,
  address: 'Main Campus, Block 5, Gulshan-e-Iqbal, Karachi',
  phone: '+92 21 3456 7890',
  email: 'info@learnnova.edu.pk',
  session: '2026-2027',
  classes: ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  sections: ['A', 'B', 'C'],
  fees: {
    tuition: 9000,
    transport: 2000,
    exam: 500,
    other: 1000,
    dueDate: 10,
    lateFee: 500,
  },
  setupComplete: true,
}

const loadSchool = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? { ...defaultSchool, ...JSON.parse(stored) } : defaultSchool
}

export const useSchoolStore = create((set) => ({
  school: loadSchool(),

  fetchSchoolFromDB: async () => {
    if (supabase) {
      try {
        const { data } = await supabase.from('schools').select('*').limit(1).single()
        if (data) {
          const updated = {
            ...defaultSchool,
            name: data.name || defaultSchool.name,
            address: data.address || defaultSchool.address,
            phone: data.phone || defaultSchool.phone,
            email: data.email || defaultSchool.email,
          }
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
          set({ school: updated })
        }
      } catch (e) {}
    }
  },

  updateSchool: (data) => {
    set((state) => {
      const updated = { ...state.school, ...data }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return { school: updated }
    })
  },

  completeSetup: (data) => {
    set((state) => {
      const updated = { ...state.school, ...data, setupComplete: true }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return { school: updated }
    })
  },

  reset: () => {
    localStorage.removeItem(STORAGE_KEY)
    set({ school: defaultSchool })
  },
}))
