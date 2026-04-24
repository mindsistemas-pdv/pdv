import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    // Persiste sessão em sessionStorage para sobreviver a hot-reloads em dev
    const stored = sessionStorage.getItem('pdv_user')
    return stored ? JSON.parse(stored) : null
  })

  const login = useCallback(async (username: string, password: string) => {
    const res = await window.api.login(username, password)
    if (res.success && res.data) {
      setUser(res.data)
      sessionStorage.setItem('pdv_user', JSON.stringify(res.data))
      return { success: true }
    }
    return { success: false, error: res.error }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    sessionStorage.removeItem('pdv_user')
    sessionStorage.removeItem('pdv_cash_register')
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
