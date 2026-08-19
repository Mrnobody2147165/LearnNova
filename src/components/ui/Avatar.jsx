import { initials as getInitials, cn } from '../../utils/format'

export default function Avatar({ name, size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }
  return (
    <div className={cn(
      'rounded-full bg-primary-light text-primary font-semibold flex items-center justify-center flex-shrink-0',
      sizes[size],
      className
    )}>
      {getInitials(name)}
    </div>
  )
}
