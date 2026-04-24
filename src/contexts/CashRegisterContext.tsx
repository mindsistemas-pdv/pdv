import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { CashRegister } from '../types'

interface CashRegisterContextValue {
  cashRegister: CashRegister | null
  setCashRegister: (cr: CashRegister | null) => void
  loadActiveCashRegister: (userId: number) => Promise<void>
}

const CashRegisterContext = createContext<CashRegisterContextValue | null>(null)

export function CashRegisterProvider({ children }: { children: ReactNode }) {
  const [cashRegister, setCashRegisterState] = useState<CashRegister | null>(() => {
    const stored = sessionStorage.getItem('pdv_cash_register')
    return stored ? JSON.parse(stored) : null
  })

  const setCashRegister = useCallback((cr: CashRegister | null) => {
    setCashRegisterState(cr)
    if (cr) {
      sessionStorage.setItem('pdv_cash_register', JSON.stringify(cr))
    } else {
      sessionStorage.removeItem('pdv_cash_register')
    }
  }, [])

  const loadActiveCashRegister = useCallback(async (userId: number) => {
    const res = await window.api.getActiveCashRegister(userId)
    if (res.success && res.data) {
      setCashRegister(res.data)
    }
  }, [setCashRegister])

  return (
    <CashRegisterContext.Provider value={{ cashRegister, setCashRegister, loadActiveCashRegister }}>
      {children}
    </CashRegisterContext.Provider>
  )
}

export function useCashRegister() {
  const ctx = useContext(CashRegisterContext)
  if (!ctx) throw new Error('useCashRegister deve ser usado dentro de CashRegisterProvider')
  return ctx
}
