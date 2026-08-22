export const dashboardStats = [
  { label: 'Total Students', value: '1,842', change: '+8.2%', trend: 'up', icon: 'users' },
  { label: 'Fee Collected', value: 'PKR 15.7M', change: '+12.4%', trend: 'up', icon: 'wallet' },
  { label: 'Outstanding', value: 'PKR 2.7M', change: '-4.1%', trend: 'down', icon: 'alert' },
  { label: 'Collection Rate', value: '85.3%', change: '+3.2%', trend: 'up', icon: 'trending' },
]

export const recentPayments = [
  { id: 'TXN-001', student: 'Noor Fatima', amount: 11500, date: '2026-08-08', method: 'Cash', status: 'Completed' },
  { id: 'TXN-002', student: 'Iqra Nadeem', amount: 14200, date: '2026-08-01', method: 'Online', status: 'Completed' },
  { id: 'TXN-003', student: 'Eman Saleem', amount: 9090, date: '2026-08-05', method: 'Card', status: 'Completed' },
  { id: 'TXN-004', student: 'Khadija Aslam', amount: 8500, date: '2026-08-03', method: 'Cash', status: 'Completed' },
  { id: 'TXN-005', student: 'Hira Javed', amount: 10240, date: '2026-08-02', method: 'Bank', status: 'Completed' },
]

export const attentionItems = [
  { id: 'ATT-1', text: '213 students have unpaid fees', action: 'View Students', link: '/students?feeStatus=Pending' },
  { id: 'ATT-2', text: '47 challans haven\'t been sent', action: 'Send Now', link: '/challans' },
  { id: 'ATT-3', text: '12 payments need verification', action: 'Verify', link: '/payments?status=Pending' },
]

export const recentAdmissions = [
  { id: 'STU-2026-00148', name: 'Bilal Khan', class: '6-A', date: '2026-08-15', guardian: 'Khan Zaman' },
  { id: 'STU-2026-00147', name: 'Anum Khalid', class: '8-C', date: '2026-08-12', guardian: 'Khalid Mehmood' },
  { id: 'STU-2026-00146', name: 'Omar Farooq', class: '7-C', date: '2026-08-10', guardian: 'Farooq Sheikh' },
  { id: 'STU-2026-00145', name: 'Rabia Ashraf', class: '10-B', date: '2026-08-08', guardian: 'Ashraf Ali' },
]

export const attendanceData = [
  { day: 'Mon', present: 1720, absent: 122 },
  { day: 'Tue', present: 1750, absent: 92 },
  { day: 'Wed', present: 1690, absent: 152 },
  { day: 'Thu', present: 1780, absent: 62 },
  { day: 'Fri', present: 1640, absent: 202 },
]

export const notifications = [
  { id: 'N1', title: 'Unpaid Fees', message: '213 students have unpaid fees for August.', time: '2 hours ago', read: false, type: 'warning' },
  { id: 'N2', title: 'Challans Not Sent', message: '47 challans haven\'t been sent yet.', time: '5 hours ago', read: false, type: 'info' },
  { id: 'N3', title: 'Fee Cycle Complete', message: 'September fee cycle has been completed.', time: '1 day ago', read: false, type: 'success' },
  { id: 'N4', title: 'New Student', message: 'Bilal Khan registered in Class 6-A.', time: '2 days ago', read: true, type: 'info' },
  { id: 'N5', title: 'Payment Verified', message: 'PKR 14,200 payment from Ayesha Malik verified.', time: '3 days ago', read: true, type: 'success' },
]
