import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Customer } from '../types'

interface Props {
  customer: Customer | null
  onClose: () => void
  onSaved: (message: string) => void
}

export default function CustomerModal({ customer, onClose, onSaved }: Props) {
  const isEditing = !!customer
  const [form, setForm] = useState({
    name:     customer?.name ?? '',
    cpf_cnpj: customer?.cpf_cnpj ?? '',
    phone:    customer?.phone ?? '',
    email:    customer?.email ?? '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return }
    setError('')
    setLoading(true)

    const data = {
      name:     form.name.trim(),
      cpf_cnpj: form.cpf_cnpj.trim() || null,
      phone:    form.phone.trim() || null,
      email:    form.email.trim() || null,
    }

    const res = isEditing
      ? await window.api.updateCustomer(customer!.id, data)
      : await window.api.createCustomer(data)

    if (res.success) {
      onSaved(isEditing ? 'Cliente atualizado.' : 'Cliente cadastrado.')
    } else {
      setError(res.error ?? 'Erro ao salvar.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-fadeIn">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h3 className="font-semibold text-white">{isEditing ? 'Editar Cliente' : 'Novo Cliente'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Nome *</label>
            <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nome completo" autoFocus required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">CPF / CNPJ</label>
              <input type="text" value={form.cpf_cnpj} onChange={e => setForm(p => ({ ...p, cpf_cnpj: e.target.value }))}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="000.000.000-00" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Telefone</label>
              <input type="text" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="(00) 00000-0000" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="email@exemplo.com" />
          </div>

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
