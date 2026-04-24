import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, UserCheck, UserX, UserCog } from 'lucide-react'
import type { User } from '../types'
import UserModal from '../components/UserModal'
import Toast, { useToast } from '../components/Toast'
import { useAuth } from '../contexts/AuthContext'

const ROLE_LABEL: Record<string, string> = {
  admin:    'Administrador',
  manager:  'Gerente',
  operator: 'Operador',
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const { toast, showToast, hideToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.api.getUsers()
    if (res.success && res.data) setUsers(res.data as User[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleToggle(user: User) {
    const newActive = !user.active
    await window.api.toggleUserActive(user.id, newActive)
    showToast(newActive ? 'Usuário ativado.' : 'Usuário desativado.', 'success')
    load()
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-surface-border flex items-center gap-3">
        <UserCog size={18} className="text-primary-500" />
        <h2 className="text-lg font-bold text-white flex-1">Usuários</h2>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} /> Novo Usuário
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Usuário</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Perfil</th>
                <th className="text-center px-4 py-3 text-slate-400 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} className={`border-b border-surface-border/50 hover:bg-surface-card/50 transition-colors ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
                  <td className="px-4 py-3 text-white font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{u.username}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.role === 'admin' ? 'bg-purple-900/40 text-purple-400' :
                      u.role === 'manager' ? 'bg-blue-900/40 text-blue-400' :
                      'bg-slate-700 text-slate-300'
                    }`}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.active ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
                    }`}>
                      {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(u); setModalOpen(true) }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Editar">
                        <Pencil size={13} />
                      </button>
                      {/* Não permite desativar o próprio usuário */}
                      {u.id !== currentUser?.id && (
                        <button onClick={() => handleToggle(u)}
                          className={`p-1.5 rounded transition-colors ${
                            u.active
                              ? 'text-slate-400 hover:text-red-400 hover:bg-red-900/20'
                              : 'text-slate-400 hover:text-green-400 hover:bg-green-900/20'
                          }`}
                          title={u.active ? 'Desativar' : 'Ativar'}>
                          {u.active ? <UserX size={13} /> : <UserCheck size={13} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <UserModal
          user={editing}
          onClose={() => setModalOpen(false)}
          onSaved={(msg) => { setModalOpen(false); showToast(msg, 'success'); load() }}
        />
      )}

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
