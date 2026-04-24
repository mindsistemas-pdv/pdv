import { useState, type FormEvent } from 'react'
import { X } from 'lucide-react'
import type { Product } from '../types'

interface Props {
  product: Product | null
  onClose: () => void
  onSaved: () => void
}

export default function ProductModal({ product, onClose, onSaved }: Props) {
  const isEditing = !!product

  const [form, setForm] = useState({
    internal_code: product?.internal_code ?? '',
    barcode:       product?.barcode ?? '',
    description:   product?.description ?? '',
    unit:          product?.unit ?? 'UN',
    sale_price:    product?.sale_price?.toString() ?? '',
    cost_price:    product?.cost_price?.toString() ?? '',
    stock_qty:     product?.stock_qty?.toString() ?? '0',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(field: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (!form.internal_code.trim()) { setError('Código interno é obrigatório.'); return }
    if (!form.description.trim())   { setError('Descrição é obrigatória.'); return }
    if (!form.sale_price)           { setError('Preço de venda é obrigatório.'); return }

    setLoading(true)

    const data = {
      internal_code: form.internal_code.trim(),
      barcode:       form.barcode.trim() || null,
      description:   form.description.trim(),
      unit:          form.unit,
      sale_price:    parseFloat(form.sale_price.replace(',', '.')),
      cost_price:    parseFloat(form.cost_price.replace(',', '.')) || 0,
      stock_qty:     parseFloat(form.stock_qty.replace(',', '.')) || 0,
    }

    const res = isEditing
      ? await window.api.updateProduct(product!.id, data)
      : await window.api.createProduct(data)

    if (res.success) {
      onSaved()
    } else {
      setError(res.error ?? 'Erro ao salvar produto.')
    }

    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h3 className="font-semibold text-white">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Código Interno *</label>
              <input
                type="text"
                value={form.internal_code}
                onChange={e => handleChange('internal_code', e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="001"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Código de Barras</label>
              <input
                type="text"
                value={form.barcode}
                onChange={e => handleChange('barcode', e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="7891234567890"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Descrição *</label>
            <input
              type="text"
              value={form.description}
              onChange={e => handleChange('description', e.target.value)}
              className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Nome do produto"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Unidade</label>
              <select
                value={form.unit}
                onChange={e => handleChange('unit', e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="UN">UN</option>
                <option value="KG">KG</option>
                <option value="LT">LT</option>
                <option value="CX">CX</option>
                <option value="PC">PC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Preço Venda *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.sale_price}
                onChange={e => handleChange('sale_price', e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0,00"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Preço Custo</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.cost_price}
                onChange={e => handleChange('cost_price', e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">Estoque Inicial</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={form.stock_qty}
              onChange={e => handleChange('stock_qty', e.target.value)}
              className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="0"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-surface-input hover:bg-slate-600 text-slate-300 font-medium py-2 rounded-lg transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
