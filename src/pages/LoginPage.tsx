import { useState, type FormEvent, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCashRegister } from '../contexts/CashRegisterContext'

export default function LoginPage() {
  const { login, user } = useAuth()
  const { loadActiveCashRegister } = useCashRegister()
  const navigate = useNavigate()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Se já está logado, redireciona
  useEffect(() => {
    if (user) navigate('/pdv', { replace: true })
  }, [user]) // eslint-disable-line

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await login(username, password)

    if (result.success) {
      // Carrega caixa ativo do operador logo após o login
      // O user ainda não está no estado neste ponto, então buscamos pelo username
      // O AuthContext já setou o user — o useEffect acima vai redirecionar
    } else {
      setError(result.error ?? 'Usuário ou senha incorretos.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fadeIn">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-900/50">
            <span className="text-2xl font-bold text-white">M</span>
          </div>
          <h1 className="text-2xl font-bold text-white">MindSys PDV</h1>
          <p className="text-slate-500 text-sm mt-1">Faça login para continuar</p>
        </div>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="bg-surface-card rounded-2xl p-6 space-y-4 border border-surface-border"
        >
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="admin"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700/60 rounded-lg px-3 py-2.5 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 active:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-4">
          Padrão:{' '}
          <span className="text-slate-500 font-mono">admin</span>
          {' / '}
          <span className="text-slate-500 font-mono">admin123</span>
        </p>
      </div>
    </div>
  )
}
