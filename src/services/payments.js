// Payments service — mock implementation
// Replace with Supabase queries later.

import { payments as mockPayments, paymentStats, collectionChart } from '../data/payments'

let paymentList = [...mockPayments]

const delay = (ms = 200) => new Promise(r => setTimeout(r, ms))

export const paymentService = {
  async getAll() {
    await delay()
    return [...paymentList]
  },

  async create(data) {
    await delay()
    const newPayment = {
      id: 'TXN-2026-08-' + String(paymentList.length + 1).padStart(3, '0'),
      transactionId: 'TXN-2026-08-' + String(paymentList.length + 1).padStart(3, '0'),
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      status: 'Completed',
    }
    paymentList = [newPayment, ...paymentList]
    return newPayment
  },

  async verify(id) {
    await delay()
    const idx = paymentList.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Payment not found')
    paymentList[idx] = { ...paymentList[idx], status: 'Completed' }
    return paymentList[idx]
  },

  async getStats() {
    await delay()
    return { ...paymentStats }
  },

  async getCollectionChart() {
    await delay()
    return [...collectionChart]
  },
}

export default paymentService
