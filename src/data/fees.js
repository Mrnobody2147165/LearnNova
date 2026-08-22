export const feeStructures = [
  {
    id: 'FS-8',
    class: 'Class 8',
    items: [
      { name: 'Tuition', amount: 8000 },
      { name: 'Computer', amount: 1000 },
      { name: 'Exam', amount: 500 },
      { name: 'Transport', amount: 2000 },
    ],
    total: 11500,
    dueDate: 10,
    lateFee: 200,
  },
  {
    id: 'FS-9',
    class: 'Class 9',
    items: [
      { name: 'Tuition', amount: 9000 },
      { name: 'Computer', amount: 1000 },
      { name: 'Exam', amount: 800 },
      { name: 'Transport', amount: 2000 },
    ],
    total: 12800,
    dueDate: 10,
    lateFee: 250,
  },
  {
    id: 'FS-10',
    class: 'Class 10',
    items: [
      { name: 'Tuition', amount: 10000 },
      { name: 'Computer', amount: 1200 },
      { name: 'Exam', amount: 1000 },
      { name: 'Transport', amount: 2000 },
    ],
    total: 14200,
    dueDate: 10,
    lateFee: 300,
  },
  {
    id: 'FS-7',
    class: 'Class 7',
    items: [
      { name: 'Tuition', amount: 7000 },
      { name: 'Computer', amount: 800 },
      { name: 'Exam', amount: 500 },
      { name: 'Transport', amount: 1800 },
    ],
    total: 10100,
    dueDate: 10,
    lateFee: 200,
  },
  {
    id: 'FS-6',
    class: 'Class 6',
    items: [
      { name: 'Tuition', amount: 6000 },
      { name: 'Computer', amount: 600 },
      { name: 'Exam', amount: 400 },
      { name: 'Transport', amount: 1500 },
    ],
    total: 8500,
    dueDate: 10,
    lateFee: 150,
  },
]

export const feeOverview = {
  totalGenerated: 18400000,
  collected: 15700000,
  outstanding: 2700000,
  overdue: 1200000,
  collectionRate: 85.3,
  monthlyCollection: [
    { month: 'Mar', collected: 1150000, outstanding: 280000 },
    { month: 'Apr', collected: 1280000, outstanding: 250000 },
    { month: 'May', collected: 1320000, outstanding: 230000 },
    { month: 'Jun', collected: 1190000, outstanding: 310000 },
    { month: 'Jul', collected: 1410000, outstanding: 210000 },
    { month: 'Aug', collected: 1570000, outstanding: 270000 },
  ],
}

export const discounts = [
  { id: 'DISC-1', name: 'Sibling Discount', percentage: 10, students: 45, amount: 125000 },
  { id: 'DISC-2', name: 'Merit Scholarship', percentage: 25, students: 12, amount: 89000 },
  { id: 'DISC-3', name: 'Staff Child', percentage: 50, students: 8, amount: 67000 },
]

export const scholarships = [
  { id: 'SCH-1', name: 'Need-Based Scholarship', percentage: 100, students: 5, amount: 57500 },
  { id: 'SCH-2', name: 'Sports Excellence', percentage: 40, students: 3, amount: 23000 },
]
