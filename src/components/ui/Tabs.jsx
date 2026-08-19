import { cn } from '../../utils/format'

export default function Tabs({ tabs, activeTab, onChange, className = '' }) {
  return (
    <div className={cn('flex gap-1 border-b border-border overflow-x-auto', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px',
            activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-ink-secondary hover:text-ink hover:border-border'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
