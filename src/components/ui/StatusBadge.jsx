import { cn } from '../../utils/format'

const statusConfig = {
  Paid: { bg: 'bg-success-bg', text: 'text-success', dot: 'bg-success' },
  Pending: { bg: 'bg-warning-bg', text: 'text-warning', dot: 'bg-warning' },
  Overdue: { bg: 'bg-danger-bg', text: 'text-danger', dot: 'bg-danger' },
  Sent: { bg: 'bg-info-bg', text: 'text-info', dot: 'bg-info' },
  Cancelled: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  Completed: { bg: 'bg-success-bg', text: 'text-success', dot: 'bg-success' },
  Failed: { bg: 'bg-danger-bg', text: 'text-danger', dot: 'bg-danger' },
  Active: { bg: 'bg-success-bg', text: 'text-success', dot: 'bg-success' },
  Inactive: { bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  'On Leave': { bg: 'bg-warning-bg', text: 'text-warning', dot: 'bg-warning' },
}

export default function StatusBadge({ status, className = '' }) {
  const config = statusConfig[status] || statusConfig.Pending
  return (
    <span className={cn('badge', config.bg, config.text, className)}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {status}
    </span>
  )
}
