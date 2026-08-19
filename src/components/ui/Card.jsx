import { cn } from '../../utils/format'

export default function Card({ children, className = '', padding = true }) {
  return (
    <div className={cn('card', padding && 'p-5', className)}>
      {children}
    </div>
  )
}
