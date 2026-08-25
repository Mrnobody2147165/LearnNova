// Payments Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

const DEFAULT_SCHOOL_ID = '14bdc5cf-93da-4ee6-9e07-d4378a8cae84'

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''))

export const paymentService = {
  async getAll({ search, method, status } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('payments')
          .select(`
            *,
            students:student_id(name, student_id_code, roll_number),
            challans:challan_id(challan_number, billing_month)
          `)
          .order('payment_date', { ascending: false })

        if (status && status !== 'all' && status !== 'All') query = query.eq('status', status)
        if (method && method !== 'all') query = query.eq('payment_method', method)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          let list = data.map(p => ({
            id: p.transaction_code || p.id,
            rawId: p.id,
            transactionId: p.transaction_code,
            studentName: p.students?.name || 'Student',
            studentId: p.students?.student_id_code || '',
            challanNo: p.challans?.challan_number || 'Direct Payment',
            month: p.challans?.billing_month || 'August 2026',
            amount: Number(p.amount_paid),
            date: p.payment_date,
            method: p.payment_method,
            status: p.status,
            referenceNo: p.reference_number,
          }))

          if (search) {
            const q = search.toLowerCase()
            list = list.filter(p =>
              p.transactionId.toLowerCase().includes(q) ||
              p.studentName.toLowerCase().includes(q) ||
              p.challanNo.toLowerCase().includes(q)
            )
          }

          return list
        }
      } catch (err) {
        console.warn('Supabase getAll payments error:', err)
      }
    }
    return []
  },

  async getStats() {
    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Fetch completed payments
        const { data: paymentsData } = await supabase
          .from('payments')
          .select('amount_paid, payment_date, status')

        // 2. Fetch pending challans count
        const { data: pendingChallans } = await supabase
          .from('challans')
          .select('total_amount, status')
          .in('status', ['Pending', 'Overdue'])

        const today = new Date().toISOString().split('T')[0]
        const totalCollected = (paymentsData || [])
          .filter(p => p.status === 'Completed')
          .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)

        const todayCollection = (paymentsData || [])
          .filter(p => p.status === 'Completed' && p.payment_date === today)
          .reduce((sum, p) => sum + Number(p.amount_paid || 0), 0)

        const pendingCount = (pendingChallans || []).length
        const pendingAmount = (pendingChallans || []).reduce((sum, c) => sum + Number(c.total_amount || 0), 0)
        const failed = (paymentsData || []).filter(p => p.status === 'Failed').length

        return {
          totalCollected,
          todayCollection,
          pending: pendingCount,
          pendingAmount,
          failed,
        }
      } catch (err) {
        console.warn('Supabase getStats payments error:', err)
      }
    }

    return { totalCollected: 0, todayCollection: 0, pending: 0, pendingAmount: 0, failed: 0 }
  },

  async getCollectionChart() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.from('payments').select('amount_paid, payment_date').eq('status', 'Completed')
        if (data && data.length > 0) {
          const total = data.reduce((s, p) => s + Number(p.amount_paid || 0), 0)
          return [
            { month: 'Mar', collected: 0, target: 0 },
            { month: 'Apr', collected: 0, target: 0 },
            { month: 'May', collected: 0, target: 0 },
            { month: 'Jun', collected: 0, target: 0 },
            { month: 'Jul', collected: 0, target: 0 },
            { month: 'Aug', collected: total, target: total },
          ]
        }
      } catch (e) {}
    }

    return [
      { month: 'Mar', collected: 0, target: 0 },
      { month: 'Apr', collected: 0, target: 0 },
      { month: 'May', collected: 0, target: 0 },
      { month: 'Jun', collected: 0, target: 0 },
      { month: 'Jul', collected: 0, target: 0 },
      { month: 'Aug', collected: 0, target: 0 },
    ]
  },

  async recordPayment(data) {
    const txnCode = 'TXN-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000)
    const paymentDate = data.date || new Date().toISOString().split('T')[0]

    if (isSupabaseConfigured() && supabase) {
      try {
        let challanId = data.challanId
        let studentId = data.studentId

        // If challanId is provided, resolve and update it safely
        if (challanId) {
          let chQuery = supabase
            .from('challans')
            .select('id, student_id, total_amount')

          if (isUUID(challanId)) {
            chQuery = chQuery.or(`id.eq.${challanId},challan_number.eq.${challanId}`)
          } else {
            chQuery = chQuery.eq('challan_number', challanId)
          }

          const { data: ch } = await chQuery.maybeSingle()

          if (ch) {
            challanId = ch.id
            studentId = ch.student_id

            // Update challan to Paid
            await supabase
              .from('challans')
              .update({
                status: 'Paid',
                paid_date: paymentDate,
                payment_method: data.method || 'Cash',
              })
              .eq('id', ch.id)

            // Update student fee status to Paid
            await supabase
              .from('students')
              .update({ fee_status: 'Paid' })
              .eq('id', ch.student_id)
          }
        }

        // Insert payment transaction record
        const { data: inserted, error } = await supabase
          .from('payments')
          .insert([{
            school_id: DEFAULT_SCHOOL_ID,
            transaction_code: txnCode,
            challan_id: challanId || null,
            student_id: studentId || null,
            amount_paid: Number(data.amount || 0),
            payment_date: paymentDate,
            payment_method: data.method || 'Cash',
            reference_number: data.referenceNo || `REF-${Math.floor(1000 + Math.random() * 9000)}`,
            status: data.status || 'Completed',
          }])
          .select()
          .single()

        if (!error && inserted) {
          await auditService.log({
            actionType: 'PAYMENT_RECORDED',
            targetEntity: 'payments',
            targetId: inserted.id,
            details: { transaction_code: txnCode, amount: data.amount, method: data.method },
          })
          return {
            id: txnCode,
            transactionId: txnCode,
            ...inserted,
          }
        }
      } catch (err) {
        console.warn('Supabase recordPayment error:', err)
      }
    }

    return {
      id: txnCode,
      transactionId: txnCode,
      date: paymentDate,
      status: 'Completed',
      ...data,
    }
  },

  async verifyPayment(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('payments')
          .update({ status: 'Completed' })

        if (isUUID(id)) {
          query = query.or(`id.eq.${id},transaction_code.eq.${id}`)
        } else {
          query = query.eq('transaction_code', id)
        }

        await query
      } catch (err) {
        console.warn('Supabase verifyPayment error:', err)
      }
    }

    await auditService.log({
      actionType: 'PAYMENT_VERIFIED',
      targetEntity: 'payments',
      details: { payment_id: id },
    })
    return { success: true }
  },

  async verify(id) {
    return this.verifyPayment(id)
  },
}

export default paymentService
