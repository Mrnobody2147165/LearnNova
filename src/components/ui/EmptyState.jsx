import { AlertCircle } from 'lucide-react'

export default function EmptyState({ icon: Icon = AlertCircle, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-hover flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-ink-muted" />
      </div>
      <h3 className="text-base font-semibold text-ink mb-1">{title}</h3>
      {description && <p className="text-sm text-ink-secondary max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
