import { Loader2 } from 'lucide-react'

export default function LoadingState({ text = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <Loader2 className="w-6 h-6 text-primary animate-spin mb-2" />
      <p className="text-sm text-ink-secondary">{text}</p>
    </div>
  )
}
