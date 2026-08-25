import { supabase } from './supabase'

export const dashboardService = {
  async getStats() {
    if (!supabase) return {
      totalStudents: 0,
      activeStudents: 0,
      newStudents: 0,
      totalCollected: 0,
      totalOutstanding: 0,
      collectionRate: 0,
      attendance: { presentPct: 0, absentPct: 0, latePct: 0 },
    }

    try {
      // 1. Total Students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })

      // 2. Active Students
      const { count: activeStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Active')

      // 3. Fee Collected from payments table
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('amount_paid')
        .eq('status', 'Completed')

      const totalCollected = paymentsData?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0

      // 4. Outstanding Challans from challans table
      const { data: pendingChallans } = await supabase
        .from('challans')
        .select('total_amount, status')
        .in('status', ['Pending', 'Overdue'])

      const totalOutstanding = pendingChallans?.reduce((sum, c) => sum + Number(c.total_amount || 0), 0) || 0

      // 5. Attendance Summary
      const { data: attendanceData } = await supabase
        .from('attendance_records')
        .select('status')

      let presentPct = 0
      let absentPct = 0
      let latePct = 0

      if (attendanceData && attendanceData.length > 0) {
        const total = attendanceData.length
        const present = attendanceData.filter(a => a.status === 'Present').length
        const absent = attendanceData.filter(a => a.status === 'Absent').length
        const late = attendanceData.filter(a => a.status === 'Late').length
        presentPct = Number(((present / total) * 100).toFixed(1))
        absentPct = Number(((absent / total) * 100).toFixed(1))
        latePct = Number(((late / total) * 100).toFixed(1))
      }

      const totalTarget = (totalCollected + totalOutstanding)
      const collectionRate = totalTarget > 0 ? Number(((totalCollected / totalTarget) * 100).toFixed(1)) : 0

      return {
        totalStudents: totalStudents || 0,
        activeStudents: activeStudents || 0,
        newStudents: 0,
        totalCollected,
        totalOutstanding,
        collectionRate,
        attendance: {
          presentPct,
          absentPct,
          latePct,
        },
      }
    } catch (err) {
      console.warn('Dashboard getStats error:', err)
      return {
        totalStudents: 0,
        activeStudents: 0,
        newStudents: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        collectionRate: 0,
        attendance: { presentPct: 0, absentPct: 0, latePct: 0 },
      }
    }
  },

  async getRecentAdmissions(limit = 5) {
    if (!supabase) return []
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, student_id_code, name, admission_date, roll_number, email')
        .order('admission_date', { ascending: false })
        .limit(limit)

      if (error || !data) return []
      return data.map(s => {
        const roll = parseInt(s.roll_number || '1')
        return {
          id: s.student_id_code || s.id,
          name: s.name,
          class: `Class ${Math.floor(roll % 5 + 6)}-A`,
          date: s.admission_date,
          guardian: s.email ? s.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Guardian',
        }
      })
    } catch (err) {
      return []
    }
  },

  async getRecentPayments(limit = 5) {
    if (!supabase) return []
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          id, transaction_code, amount_paid, payment_date, payment_method, status,
          students:student_id(name)
        `)
        .order('payment_date', { ascending: false })
        .limit(limit)

      if (error || !data) return []
      return data.map(p => ({
        id: p.transaction_code || p.id,
        student: p.students?.name || 'Student',
        amount: Number(p.amount_paid),
        date: p.payment_date,
        method: p.payment_method,
        status: p.status,
      }))
    } catch (err) {
      return []
    }
  },

  async getMonthlyCollectionChart() {
    if (!supabase) return []
    try {
      const { data } = await supabase
        .from('payments')
        .select('amount_paid, payment_date')
        .eq('status', 'Completed')

      const total = data?.reduce((sum, p) => sum + Number(p.amount_paid || 0), 0) || 0
      return [
        { month: 'Mar', collected: 0, target: 0 },
        { month: 'Apr', collected: 0, target: 0 },
        { month: 'May', collected: 0, target: 0 },
        { month: 'Jun', collected: 0, target: 0 },
        { month: 'Jul', collected: 0, target: 0 },
        { month: 'Aug', collected: total, target: total },
      ]
    } catch (err) {
      return []
    }
  },
}

export default dashboardService
