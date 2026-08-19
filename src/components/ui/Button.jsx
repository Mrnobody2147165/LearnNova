import { cn } from '../../utils/format'

export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    ghost: 'btn-ghost',
    danger: 'btn-danger',
  }
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: '',
    lg: 'px-5 py-2.5 text-base',
  }
  return (
    <button
      className={cn(variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
