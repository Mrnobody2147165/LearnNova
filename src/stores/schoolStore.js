import { create } from 'zustand'

const STORAGE_KEY = 'saas_school_data'

const defaultSchool = {
  name: 'Greenfield Academy',
  logo: null,
  address: '123 Education Road, Gulshan-e-Iqbal, Karachi',
  phone: '+92 21 3456 7890',
  email: 'info@greenfieldacademy.edu.pk',
  session: '2026-2027',
  classes: ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  sections: ['A', 'B', 'C'],
  fees: {
    tuition: 8000,
    transport: 2000,
    exam: 500,
    other: 1000,
    dueDate: 10,
    lateFee: 200,
  },
  setupComplete: true,
}

const loadSchool = () => {
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored ? { ...defaultSchool, ...JSON.parse(stored) } : defaultSchool
}

export const useSchoolStore = create((set) => ({
  school: loadSchool(),

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
