import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export type ToastType = 'success' | 'error'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  duration?: number // ms, padrão 3000
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Pequeno delay para acionar a animação de entrada
    const show = setTimeout(() => setVisible(true), 10)
    const hide = setTimeout(() => {
      setVisible(false)
      setTimeout(onClose, 300) // aguarda animação de saída
    }, duration)

    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [duration, onClose])

  return (
    <div className={`
      fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl
      border transition-all duration-300
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      ${type === 'success'
        ? 'bg-green-900/90 border-green-700 text-green-300'
        : 'bg-red-900/90 border-red-700 text-red-300'
      }
    `}>
      {type === 'success'
        ? <CheckCircle size={18} className="shrink-0" />
        : <XCircle size={18} className="shrink-0" />
      }
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={() => { setVisible(false); setTimeout(onClose, 300) }}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X size={14} />
      </button>
    </div>
  )
}

// Hook para gerenciar toasts facilmente
import { useState as useStateHook, useCallback } from 'react'

interface ToastState {
  message: string
  type: ToastType
  id: number
}

export function useToast() {
  const [toast, setToast] = useStateHook<ToastState | null>(null)

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ message, type, id: Date.now() })
  }, [])

  const hideToast = useCallback(() => setToast(null), [])

  return { toast, showToast, hideToast }
}
