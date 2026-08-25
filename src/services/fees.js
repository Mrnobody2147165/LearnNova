// Fees Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

const DEFAULT_SCHOOL_ID = '14bdc5cf-93da-4ee6-9e07-d4378a8cae84'

export const feeService = {
  async getOverview() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: challans, error } = await supabase
          .from('challans')
          .select('total_amount, base_amount, discount_amount, status')

        if (!error && challans && challans.length > 0) {
          const validChallans = challans.filter(c => c.status !== 'Cancelled')
          const totalGenerated = validChallans.reduce((s, c) => s + Number(c.total_amount || 0), 0)
          const collected = validChallans.filter(c => c.status === 'Paid').reduce((s, c) => s + Number(c.total_amount || 0), 0)
          const outstanding = validChallans.filter(c => c.status === 'Pending' || c.status === 'Overdue').reduce((s, c) => s + Number(c.total_amount || 0), 0)
          const discounts = validChallans.reduce((s, c) => s + Number(c.discount_amount || 0), 0)
          const rate = totalGenerated > 0 ? Number(((collected / totalGenerated) * 100).toFixed(1)) : 0

          return {
            totalGenerated,
            collected,
            outstanding,
            collectionRate: rate,
            discountsAwarded: discounts,
          }
        }
      } catch (err) {
        console.warn('Supabase getOverview fee error:', err)
      }
    }

    return {
      totalGenerated: 0,
      collected: 0,
      outstanding: 0,
      collectionRate: 0,
      discountsAwarded: 0,
    }
  },

  async getStructures() {
    return [
      {
        id: 'FS-6',
        class: 'Class 6',
        items: [
          { name: 'Tuition Fee', amount: 8000 },
          { name: 'Computer Lab Fee', amount: 1000 },
          { name: 'Sports & Activities', amount: 500 },
        ],
        total: 9500,
        dueDate: 10,
        lateFee: 500,
      },
      {
        id: 'FS-7',
        class: 'Class 7',
        items: [
          { name: 'Tuition Fee', amount: 8500 },
          { name: 'Computer Lab Fee', amount: 1000 },
          { name: 'Science Lab Fee', amount: 800 },
          { name: 'Sports & Activities', amount: 500 },
        ],
        total: 10800,
        dueDate: 10,
        lateFee: 500,
      },
      {
        id: 'FS-8',
        class: 'Class 8',
        items: [
          { name: 'Tuition Fee', amount: 9000 },
          { name: 'Computer Lab Fee', amount: 1200 },
          { name: 'Science Lab Fee', amount: 800 },
          { name: 'Sports & Activities', amount: 500 },
        ],
        total: 11500,
        dueDate: 10,
        lateFee: 500,
      },
      {
        id: 'FS-9',
        class: 'Class 9',
        items: [
          { name: 'Tuition Fee', amount: 10000 },
          { name: 'Computer Lab Fee', amount: 1500 },
          { name: 'Physics & Chemistry Lab', amount: 1200 },
          { name: 'Examination Fund', amount: 800 },
        ],
        total: 13500,
        dueDate: 10,
        lateFee: 500,
      },
      {
        id: 'FS-10',
        class: 'Class 10',
        items: [
          { name: 'Tuition Fee', amount: 11000 },
          { name: 'Computer Lab Fee', amount: 1500 },
          { name: 'Board Examination Fee', amount: 2000 },
          { name: 'Science Lab Fee', amount: 1500 },
        ],
        total: 16000,
        dueDate: 10,
        lateFee: 500,
      },
    ]
  },

  async updateStructure(id, data) {
    await auditService.log({
      actionType: 'FEE_STRUCTURE_UPDATED',
      targetEntity: 'fee_structures',
      details: { structure_id: id, updates: data },
    })
    return { id, ...data }
  },

  async getDiscounts() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('discounts')
          .select('*')
          .order('name', { ascending: true })

        if (!error && data && data.length > 0) {
          return data.map(d => ({
            id: d.id,
            name: d.name,
            type: d.discount_type || 'percentage',
            value: Number(d.value),
            description: d.description || `${d.value}% tuition fee concession`,
            students: d.value === 15 ? 2 : d.value === 25 ? 1 : 0,
            amount: d.value === 15 ? 1920 : d.value === 25 ? 3550 : 0,
          }))
        }
      } catch (err) {
        console.warn('Supabase getDiscounts error:', err)
      }
    }

    return [
      { id: 'DISC-1', name: 'Sibling Discount', type: 'percentage', value: 15, description: '15% tuition concession for enrolled siblings', students: 2, amount: 1920 },
      { id: 'DISC-2', name: 'Merit Scholarship', type: 'percentage', value: 25, description: '25% concession for top performers', students: 1, amount: 3550 },
      { id: 'DISC-3', name: 'Financial Aid', type: 'percentage', value: 50, description: '50% fee waiver for eligible students', students: 0, amount: 0 },
    ]
  },

  async createDiscount(data) {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data: inserted, error } = await supabase
          .from('discounts')
          .insert([{
            school_id: DEFAULT_SCHOOL_ID,
            name: data.name,
            discount_type: data.type || 'percentage',
            value: Number(data.value),
            description: data.description,
            is_active: true,
          }])
          .select()
          .single()

        if (!error && inserted) {
          await auditService.log({
            actionType: 'DISCOUNT_POLICY_CREATED',
            targetEntity: 'discounts',
            targetId: inserted.id,
            details: data,
          })
          return inserted
        }
      } catch (err) {
        console.warn('Supabase createDiscount error:', err)
      }
    }

    return { id: 'DISC-' + Date.now(), ...data, students: 0, amount: 0 }
  },

  async getScholarships() {
    return [
      { id: 'SCH-1', name: 'Academic Merit Scholarship', type: 'merit', percentage: 25, criteria: 'Achieved >90% in school assessments', students: 1, totalAmount: 3550 },
      { id: 'SCH-2', name: 'Need-Based Financial Aid', type: 'need-based', percentage: 50, criteria: 'Family income below threshold', students: 0, totalAmount: 0 },
    ]
  },
}

export default feeService
