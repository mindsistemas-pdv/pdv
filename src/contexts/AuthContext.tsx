import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string; user?: User }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = sessionStorage.getItem('pdv_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (username: string, password: string) => {
    if (!window.api) {
      return { success: false, error: 'API não disponível. Reinicie o aplicativo.' }
    }

    try {
      const res = await window.api.login(username, password)

      if (res.success && res.data) {
        setUser(res.data)
        sessionStorage.setItem('pdv_user', JSON.stringify(res.data))
        return { success: true, user: res.data }
      }

      return { success: false, error: res.error ?? 'Usuário ou senha incorretos.' }
    } catch (err) {
      console.error('[login error]', err)
      return { success: false, error: 'Erro de comunicação com o sistema.' }
    }
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
