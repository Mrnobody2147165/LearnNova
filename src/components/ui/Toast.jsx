import { create } from 'zustand'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react'
import { cn } from '../../utils/format'

const useToastStore = create((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Date.now() + Math.random()
    set((state) => ({
      toasts: [...state.toasts, { id, ...toast }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id),
      }))
    }, 4000)
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }))
  },
}))

export const useToast = () => {
  const addToast = useToastStore(s => s.addToast)
  return {
    success: (message) => addToast({ message, type: 'success' }),
    error: (message) => addToast({ message, type: 'error' }),
    info: (message) => addToast({ message, type: 'info' }),
    warning: (message) => addToast({ message, type: 'warning' }),
  }
}

const toastConfig = {
  success: { icon: CheckCircle, bg: 'bg-success', text: 'text-white' },
  error: { icon: XCircle, bg: 'bg-danger', text: 'text-white' },
  warning: { icon: AlertCircle, bg: 'bg-warning', text: 'text-white' },
  info: { icon: Info, bg: 'bg-info', text: 'text-white' },
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(toast => {
        const config = toastConfig[toast.type] || toastConfig.info
        const Icon = config.icon
        return (
          <div
            key={toast.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-card shadow-dropdown pointer-events-auto',
              'animate-[slideIn_0.2s_ease-out]'
            )}
            style={{ backgroundColor: config.bg, color: config.text }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 hover:opacity-70 transition-opacity"
              aria-label="Dismiss notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>,
    document.body
  )
}
