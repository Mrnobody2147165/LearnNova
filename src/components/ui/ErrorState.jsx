import { AlertTriangle, RefreshCw } from 'lucide-react'
import Button from './Button'

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-danger-bg flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-danger" />
      </div>
      <h3 className="text-base font-semibold text-ink mb-1">Something went wrong</h3>
      <p className="text-sm text-ink-secondary max-w-sm mb-4">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw className="w-4 h-4" />
          Try again
        </Button>
      )}
    </div>
  )
}
