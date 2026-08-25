// Challans Service with Supabase & Audit Tracking
import { supabase, isSupabaseConfigured } from './supabase'
import { auditService } from './audit'

const DEFAULT_SCHOOL_ID = '14bdc5cf-93da-4ee6-9e07-d4378a8cae84'

const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(str || ''))

export const challanService = {
  async getAll({ month, status, search } = {}) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('challans')
          .select(`
            *,
            students:student_id(id, name, student_id_code, roll_number, phone)
          `)
          .order('issue_date', { ascending: false })

        if (month && month !== 'all') query = query.eq('billing_month', month)
        if (status && status !== 'all' && status !== 'All') query = query.eq('status', status)

        const { data, error } = await query
        if (!error && data && data.length > 0) {
          let list = data.map(c => {
            const roll = parseInt(c.students?.roll_number || '24')
            const classText = `Class ${Math.floor(roll % 5 + 6)}-${roll % 2 === 0 ? 'A' : 'B'}`
            return {
              id: c.challan_number || c.id,
              rawId: c.id,
              challanNo: c.challan_number,
              studentId: c.students?.student_id_code || '',
              studentName: c.students?.name || 'Student',
              studentPhone: c.students?.phone || '+92 300 1234567',
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
            students:student_id(*),
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

          const roll = parseInt(data.students?.roll_number || '24')
          return {
            id: data.challan_number || data.id,
            rawId: data.id,
            challanNo: data.challan_number,
            studentId: data.students?.student_id_code || 'STU-2026-00124',
            studentName: data.students?.name || 'Ahmed Khan',
            studentPhone: data.students?.phone || '+92 300 1234567',
            class: `Class ${Math.floor(roll % 5 + 6)}-A`,
            guardian: data.students?.email ? data.students.email.split('@')[0] : 'Guardian',
            rollNo: data.students?.roll_number || '24',
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

  async generate(month = 'August 2026', dueDate = '2026-08-30') {
    if (isSupabaseConfigured() && supabase) {
      try {
        // Fetch all active students
        const { data: students } = await supabase
          .from('students')
          .select('id, name, student_id_code, roll_number, phone')
          .eq('status', 'Active')

        if (students && students.length > 0) {
          const newChallans = []
          for (let i = 0; i < students.length; i++) {
            const st = students[i]
            const challanNo = `CH-${month.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}-${String(i + 1).padStart(2, '0')}`
            const baseAmount = 11500

            const { data: insChallan, error: insErr } = await supabase
              .from('challans')
              .insert([{
                school_id: DEFAULT_SCHOOL_ID,
                challan_number: challanNo,
                student_id: st.id,
                billing_month: month,
                issue_date: new Date().toISOString().split('T')[0],
                due_date: dueDate,
                base_amount: baseAmount,
                discount_amount: 0,
                previous_balance: 0,
                late_fee: 0,
                total_amount: baseAmount,
                status: 'Pending',
              }])
              .select()
              .single()

            if (!insErr && insChallan) {
              newChallans.push({
                ...insChallan,
                challanNo,
                studentName: st.name,
                studentPhone: st.phone,
              })

              await supabase.from('challan_items').insert([
                { challan_id: insChallan.id, item_name: 'Tuition Fee', amount: 9000 },
                { challan_id: insChallan.id, item_name: 'Lab & Computer Fee', amount: 1500 },
                { challan_id: insChallan.id, item_name: 'Activities & Sports Fee', amount: 1000 },
              ])
            }
          }

          await auditService.log({
            actionType: 'CHALLANS_BATCH_GENERATED',
            targetEntity: 'challans',
            details: { month, count: newChallans.length },
          })

          return newChallans
        }
      } catch (err) {
        console.warn('Supabase generate challans error:', err)
      }
    }
    return []
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

  async cancel(id) {
    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('challans')
          .update({ status: 'Cancelled' })

        if (isUUID(id)) {
          query = query.or(`id.eq.${id},challan_number.eq.${id}`)
        } else {
          query = query.eq('challan_number', id)
        }

        await query
      } catch (err) {
        console.warn('Supabase cancel challan error:', err)
      }
    }

    await auditService.log({
      actionType: 'CHALLAN_CANCELLED',
      targetEntity: 'challans',
      details: { challan_id: id },
    })
    return { success: true }
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

  async payStudentChallan(challanId, paymentDetails = {}) {
    const txnCode = 'TXN-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000)
    const paidDate = new Date().toISOString().split('T')[0]

    if (isSupabaseConfigured() && supabase) {
      try {
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
          // 2. Update Challan
          await supabase
            .from('challans')
            .update({
              status: 'Paid',
              paid_date: paidDate,
              payment_method: paymentDetails.method || 'Online',
            })
            .eq('id', ch.id)

          // 3. Update Student fee status
          await supabase
            .from('students')
            .update({ fee_status: 'Paid' })
            .eq('id', ch.student_id)

          // 4. Insert Payment Record
          await supabase
            .from('payments')
            .insert([{
              school_id: DEFAULT_SCHOOL_ID,
              transaction_code: txnCode,
              challan_id: ch.id,
              student_id: ch.student_id,
              amount_paid: paymentDetails.amount || ch.total_amount,
              payment_date: paidDate,
              payment_method: paymentDetails.method || 'Online',
              reference_number: paymentDetails.referenceNumber || `REF-${Math.floor(10000 + Math.random() * 90000)}`,
              status: 'Completed',
            }])
        }
      } catch (err) {
        console.warn('Supabase payStudentChallan error:', err)
      }
    }

    await auditService.log({
      actionType: 'STUDENT_CHALLAN_PAID',
      targetEntity: 'challans',
      targetId: challanId,
      details: { challanId, transactionId: txnCode, ...paymentDetails },
    })

    return {
      success: true,
      transactionId: txnCode,
      paidDate,
      challanId,
      amount: paymentDetails.amount,
      method: paymentDetails.method || 'Online',
    }
  },
}

export default challanService
