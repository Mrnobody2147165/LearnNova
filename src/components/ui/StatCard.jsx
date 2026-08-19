import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../../utils/format'

export default function StatCard({ label, value, change, trend, icon: Icon }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-btn bg-primary-light flex items-center justify-center">
          {Icon && <Icon className="w-5 h-5 text-primary" />}
        </div>
        {change && (
          <div className={cn(
            'flex items-center gap-1 text-xs font-medium',
            trend === 'up' ? 'text-success' : 'text-danger'
          )}>
            {trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-ink">{value}</p>
      <p className="text-sm text-ink-secondary mt-1">{label}</p>
    </div>
  )
}
