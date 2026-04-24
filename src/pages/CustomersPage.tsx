import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Users } from 'lucide-react'
import type { Customer } from '../types'
import CustomerModal from '../components/CustomerModal'
import ConfirmModal from '../components/ConfirmModal'
import Toast, { useToast } from '../components/Toast'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const { toast, showToast, hideToast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.api.getCustomers()
    if (res.success && res.data) setCustomers(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.cpf_cnpj ?? '').includes(search) ||
    (c.phone ?? '').includes(search)
  )

  async function handleDelete() {
    if (!deleting) return
    await window.api.deleteCustomer(deleting.id)
    setDeleting(null)
    showToast('Cliente excluído.', 'success')
    load()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-surface-border flex items-center gap-3">
        <Users size={18} className="text-primary-500" />
        <h2 className="text-lg font-bold text-white flex-1">Clientes</h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar cliente..."
            className="bg-surface-input border border-surface-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true) }}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} /> Novo Cliente
        </button>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
            <Users size={32} className="opacity-30" />
            <p className="text-sm">{search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Nome</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">CPF/CNPJ</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Telefone</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">E-mail</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} className={`border-b border-surface-border/50 hover:bg-surface-card/50 transition-colors ${i % 2 !== 0 ? 'bg-white/[0.02]' : ''}`}>
                  <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{c.cpf_cnpj ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{c.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{c.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => { setEditing(c); setModalOpen(true) }}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Editar">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => setDeleting(c)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors" title="Excluir">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <CustomerModal
          customer={editing}
          onClose={() => setModalOpen(false)}
          onSaved={(msg) => { setModalOpen(false); showToast(msg, 'success'); load() }}
        />
      )}

      {deleting && (
        <ConfirmModal
          title="Excluir cliente"
          message={`Excluir "${deleting.name}"? Esta ação não pode ser desfeita.`}
          confirmLabel="Excluir"
          danger
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
