// Challans Service with Supabase Reads + Backend Write Proxy
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

const DEFAULT_SCHOOL_ID = 'abc88e49-fa7c-4987-b877-09b05b61d6a6'

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''))

export const challanService = {
  // ── READ OPERATIONS (direct Supabase — low risk, anon key) ───

  async getAll({ month, status, search } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('challans')
          .select(`
            *,
            students:student_id(id, name, student_id_code, roll_number, phone, current_class_id, classes:current_class_id(name))
          `)
          .order('issue_date', { ascending: false })

        if (month && month !== 'all') query = query.eq('billing_month', month)
        if (status && status !== 'all' && status !== 'All') query = query.eq('status', status)

        const { data, error } = await query
        if (error) {
          console.warn('Supabase getAll challans error:', error.message)
        } else if (data) {
          let list = data.map(c => {
            const classText = c.students?.classes?.name || 
              (c.students?.roll_number ? `Class ${c.students.roll_number}` : 'Unassigned')
            return {
              id: c.challan_number || c.id,
              rawId: c.id,
              challanNo: c.challan_number,
              studentId: c.students?.student_id_code || '',
              studentName: c.students?.name || 'Student',
              studentPhone: c.students?.phone || '',
              class: classText,
              month: c.billing_month,
              amount: Number(c.base_amount || 10000),
              total: Number(c.total_amount || 11500),
              discount: Number(c.discount_amount || 0),
              previousBalance: Number(c.previous_balance || 0),
              lateFee: Number(c.late_fee || 0),
              dueDate: c.due_date || '2026-08-30',
              issueDate: c.issue_date || '2026-08-01',
              status: c.status || 'Pending',
              paidDate: c.paid_date,
              paymentMethod: c.payment_method,
            }
          })

          if (search) {
            const q = search.toLowerCase()
            list = list.filter(c =>
              c.challanNo.toLowerCase().includes(q) ||
              c.studentName.toLowerCase().includes(q) ||
              c.studentId.toLowerCase().includes(q) ||
              String(c.studentPhone).toLowerCase().includes(q)
            )
          }

          return list
        }
      } catch (err) {
        console.warn('Supabase getAll challans error:', err)
      }
    }
    return []
  },

  async getById(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('challans')
          .select(`
            *,
            students:student_id(*, classes:current_class_id(name)),
            challan_items(*)
          `)

        if (isUUID(id)) {
          query = query.or(`id.eq.${id},challan_number.eq.${id}`)
        } else {
          query = query.eq('challan_number', id)
        }

        const { data, error } = await query.maybeSingle()

        if (!error && data) {
          const breakdown = (data.challan_items && data.challan_items.length > 0)
            ? data.challan_items.map(i => ({ head: i.item_name || i.fee_head || 'Tuition Fee', amount: Number(i.amount) }))
            : [
                { head: 'Tuition Fee', amount: Number(data.base_amount) || 9000 },
                { head: 'Computer & Science Lab Fee', amount: 1500 },
                { head: 'Facilities & Sports Fee', amount: 1000 },
              ]

          return {
            id: data.challan_number || data.id,
            rawId: data.id,
            challanNo: data.challan_number,
            studentId: data.students?.student_id_code || 'STU-2026-00124',
            studentName: data.students?.name || 'Ahmed Khan',
            studentPhone: data.students?.phone || '',
            class: data.students?.classes?.name || 
              (data.students?.roll_number ? `Class ${data.students.roll_number}` : 'Unassigned'),
            guardian: data.students?.email ? data.students.email.split('@')[0] : 'Guardian',
            rollNo: data.students?.roll_number || '',
            month: data.billing_month,
            amount: Number(data.base_amount),
            total: Number(data.total_amount),
            discount: Number(data.discount_amount || 0),
            previousBalance: Number(data.previous_balance || 0),
            lateFee: Number(data.late_fee || 0),
            dueDate: data.due_date,
            issueDate: data.issue_date,
            status: data.status,
            paidDate: data.paid_date,
            paymentMethod: data.payment_method,
            feeBreakdown: breakdown,
          }
        }
      } catch (err) {
        console.warn('Supabase getById challan error:', err)
      }
    }
    return null
  },

  async getStats() {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from('challans')
          .select('total_amount, status')

        if (!error && data) {
          const total = data.length
          const paid = data.filter(c => c.status === 'Paid').length
          const pending = data.filter(c => c.status === 'Pending').length
          const overdue = data.filter(c => c.status === 'Overdue').length
          const totalAmount = data.reduce((s, c) => s + Number(c.total_amount || 0), 0)
          const paidAmount = data.filter(c => c.status === 'Paid').reduce((s, c) => s + Number(c.total_amount || 0), 0)

          return {
            total,
            paid,
            pending,
            overdue,
            totalAmount,
            paidAmount,
          }
        }
      } catch (err) {
        console.warn('Supabase getStats challans error:', err)
      }
    }

    return { total: 0, paid: 0, pending: 0, overdue: 0, totalAmount: 0, paidAmount: 0 }
  },

  async getStudentChallans(studentId = 'STU-2026-00124') {
    if (isSupabaseConfigured() && supabase) {
      try {
        let stUuid = studentId
        let query = supabase
          .from('students')
          .select('id, student_id_code, name, roll_number')

        if (isUUID(studentId)) {
          query = query.or(`id.eq.${studentId},student_id_code.eq.${studentId}`)
        } else {
          query = query.eq('student_id_code', studentId)
        }

        const { data: stRecord } = await query.maybeSingle()
        if (stRecord) stUuid = stRecord.id

        const { data, error } = await supabase
          .from('challans')
          .select('*')
          .eq('student_id', stUuid)
          .order('issue_date', { ascending: false })

        if (!error && data && data.length > 0) {
          const roll = parseInt(stRecord?.roll_number || '24')
          return data.map(c => ({
            id: c.challan_number || c.id,
            rawId: c.id,
            challanNo: c.challan_number,
            studentId: stRecord?.student_id_code || studentId,
            studentName: stRecord?.name || 'Student',
            class: `Class ${Math.floor(roll % 5 + 6)}-A`,
            month: c.billing_month,
            amount: Number(c.base_amount || 10000),
            total: Number(c.total_amount || 11500),
            discount: Number(c.discount_amount || 0),
            previousBalance: Number(c.previous_balance || 0),
            lateFee: Number(c.late_fee || 0),
            dueDate: c.due_date || '2026-08-30',
            issueDate: c.issue_date || '2026-08-01',
            status: c.status || 'Pending',
            paidDate: c.paid_date,
            paymentMethod: c.payment_method,
            transactionId: c.paid_date ? `TXN-${c.challan_number.replace('CH-', '')}` : null,
            items: [
              { name: 'Tuition Fee', amount: Number(c.base_amount) || 9000 },
              { name: 'Computer Lab Fee', amount: 1200 },
              { name: 'Science Lab Fee', amount: 800 },
              { name: 'Sports & Activities', amount: 500 },
            ],
          }))
        }
      } catch (err) {
        console.warn('Supabase getStudentChallans error:', err)
      }
    }
    return []
  },

  // ── WRITE OPERATIONS (routed through backend) ──────────────
  // These now go through the service-role backend so that:
  //   - Secret credentials stay on the server
  //   - PDFs are generated + uploaded automatically
  //   - Notifications (WhatsApp/SMS/Email) are dispatched

  /**
   * Batch-generate challans for all active students.
   * Calls POST /api/challans/generate on the backend.
   */
  async generate(month = 'August 2026', dueDate = '2026-08-30', targetClass = 'all') {
    try {
      const response = await fetch(`${BACKEND_URL}/api/challans/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, dueDate, targetClass }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.warn('Backend generate failed:', result)
        return []
      }

      await auditService.log({
        actionType: 'CHALLANS_BATCH_GENERATED',
        targetEntity: 'challans',
        details: { month, count: (result.challans || []).length },
      })

      return result.challans || []
    } catch (err) {
      console.warn('Backend generate error:', err)
      return []
    }
  },

  /**
   * Cancel a challan via the backend.
   * Calls PATCH /api/challans/cancel on the backend.
   */
  async cancel(id) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/challans/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanId: id }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.warn('Backend cancel failed:', result)
      }

      await auditService.log({
        actionType: 'CHALLAN_CANCELLED',
        targetEntity: 'challans',
        details: { challan_id: id },
      })

      return { success: result.success || false }
    } catch (err) {
      console.warn('Backend cancel error:', err)
      return { success: false }
    }
  },

  /**
   * Record a payment via the backend.
   * Calls POST /api/challans/pay on the backend, which:
   *   - Marks the challan as Paid
   *   - Inserts a payment record
   *   - Sends a receipt notification (WhatsApp/SMS/Email)
   */
  async payStudentChallan(challanId, paymentDetails = {}) {
    try {
      const response = await fetch(`${BACKEND_URL}/api/challans/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challanId, paymentDetails }),
      })

      const result = await response.json()

      if (!response.ok) {
        console.warn('Backend pay failed:', result)
        return { success: false }
      }

      await auditService.log({
        actionType: 'STUDENT_CHALLAN_PAID',
        targetEntity: 'challans',
        targetId: challanId,
        details: { challanId, ...result },
      })

      return {
        success: true,
        transactionId: result.transactionId,
        paidDate: result.paidDate,
        challanId,
        amount: result.amount,
        method: result.method || paymentDetails.method || 'Online',
      }
    } catch (err) {
      console.warn('Backend pay error:', err)
      return { success: false }
    }
  },
}

export default challanService
