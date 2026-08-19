import { AlertTriangle } from 'lucide-react'
import Modal from './Modal'
import Button from './Button'

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirm Action', message = 'Are you sure you want to proceed?', confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = true }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm?.(); onClose?.() }}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex gap-3 items-start">
        <div className="w-10 h-10 rounded-full bg-danger-bg flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-danger" />
        </div>
        <p className="text-sm text-ink-secondary pt-2">{message}</p>
      </div>
    </Modal>
  )
}
