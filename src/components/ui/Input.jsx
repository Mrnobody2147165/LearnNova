import { forwardRef } from 'react'
import { cn } from '../../utils/format'

const Input = forwardRef(({ label, error, className = '', icon: Icon, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        )}
        <input
          ref={ref}
          className={cn('input', Icon && 'pl-9', error && 'border-danger focus:border-danger focus:ring-danger', className)}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  )
})

Input.displayName = 'Input'
export default Input
