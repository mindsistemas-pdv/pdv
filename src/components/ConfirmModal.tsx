import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  // Fecha com Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onConfirm, onCancel])

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm animate-fadeIn">
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg shrink-0 ${danger ? 'bg-red-900/30' : 'bg-yellow-900/30'}`}>
              <AlertTriangle size={20} className={danger ? 'text-red-400' : 'text-yellow-400'} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{title}</h3>
              <p className="text-sm text-slate-400 mt-1">{message}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 bg-surface-input hover:bg-slate-600 text-slate-300 font-medium py-2 rounded-lg transition-colors text-sm"
              autoFocus
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className={`flex-1 font-semibold py-2 rounded-lg transition-colors text-sm text-white ${
                danger
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
