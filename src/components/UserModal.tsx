import { useState, type FormEvent } from 'react'
import { X, Eye, EyeOff } from 'lucide-react'
import type { User } from '../types'

interface Props {
  user: User | null
  onClose: () => void
  onSaved: (message: string) => void
}

export default function UserModal({ user, onClose, onSaved }: Props) {
  const isEditing = !!user
  const [form, setForm] = useState({
    name:     user?.name ?? '',
    username: user?.username ?? '',
    role:     user?.role ?? 'operator' as 'admin' | 'manager' | 'operator',
    password: '',
    confirm:  '',
  })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.name.trim())     { setError('Nome é obrigatório.'); return }
    if (!form.username.trim()) { setError('Usuário é obrigatório.'); return }
    if (!isEditing && !form.password) { setError('Senha é obrigatória.'); return }
    if (form.password && form.password !== form.confirm) { setError('As senhas não coincidem.'); return }
    if (form.password && form.password.length < 4) { setError('Senha deve ter ao menos 4 caracteres.'); return }

    setLoading(true)
    const data = {
      name:     form.name.trim(),
      username: form.username.trim(),
      role:     form.role,
      ...(form.password ? { password: form.password } : {}),
    }

    const res = isEditing
      ? await window.api.updateUser(user!.id, data)
      : await window.api.createUser(data)

    if (res.success) {
      onSaved(isEditing ? 'Usuário atualizado.' : 'Usuário criado.')
    } else {
      setError(res.error ?? 'Erro ao salvar.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-fadeIn">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h3 className="font-semibold text-white">{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Nome completo" autoFocus />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Login *</label>
              <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="usuario" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Perfil</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value as typeof form.role }))}
              className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option value="operator">Operador de Caixa</option>
              <option value="manager">Gerente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              {isEditing ? 'Nova Senha (deixe em branco para manter)' : 'Senha *'}
            </label>
            <div className="relative">
              <input
                type={showPass ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPass(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {form.password && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">Confirmar Senha</label>
              <input type={showPass ? 'text' : 'password'} value={form.confirm}
                onChange={e => setForm(p => ({ ...p, confirm: e.target.value }))}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="••••••••" />
            </div>
          )}

          {error && <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">{error}</div>}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 bg-surface-input hover:bg-slate-600 text-slate-300 font-medium py-2 rounded-lg transition-colors text-sm">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors text-sm">
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
