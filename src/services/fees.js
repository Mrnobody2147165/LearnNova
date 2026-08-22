// Fees service — mock implementation
// Replace with Supabase queries later.

import { feeStructures, feeOverview, discounts, scholarships } from '../data/fees'

let structures = [...feeStructures]
let discountList = [...discounts]
let scholarshipList = [...scholarships]

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

export const feeService = {
  async getOverview() {
    await delay()
    return { ...feeOverview }
  },

  async getStructures() {
    await delay()
    return [...structures]
  },

  async createStructure(data) {
    await delay()
    const newStructure = {
      id: 'FS-' + (structures.length + 1),
      ...data,
      total: data.items?.reduce((sum, item) => sum + item.amount, 0) || 0,
    }
    structures = [...structures, newStructure]
    return newStructure
  },

  async updateStructure(id, data) {
    await delay()
    const idx = structures.findIndex(s => s.id === id)
    if (idx === -1) throw new Error('Fee structure not found')
    const updated = {
      ...structures[idx],
      ...data,
      total: data.items ? data.items.reduce((sum, item) => sum + item.amount, 0) : structures[idx].total,
    }
    structures[idx] = updated
    return updated
  },

  async removeStructure(id) {
    await delay()
    structures = structures.filter(s => s.id !== id)
    return { success: true }
  },

  async getDiscounts() {
    await delay()
    return [...discountList]
  },

  async getScholarships() {
    await delay()
    return [...scholarshipList]
  },
}

export default feeService
