import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, Pencil, Trash2, Package } from 'lucide-react'
import type { Product } from '../types'
import { formatCurrency } from '../utils/formatters'
import ProductModal from '../components/ProductModal'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const loadProducts = useCallback(async () => {
    setLoading(true)
    const res = await window.api.getProducts()
    if (res.success && res.data) setProducts(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadProducts() }, [loadProducts])

  const filtered = products.filter(p =>
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.internal_code.includes(search) ||
    (p.barcode ?? '').includes(search)
  )

  function handleNew() {
    setEditingProduct(null)
    setModalOpen(true)
  }

  function handleEdit(product: Product) {
    setEditingProduct(product)
    setModalOpen(true)
  }

  async function handleDelete(product: Product) {
    if (!confirm(`Excluir "${product.description}"?`)) return
    await window.api.deleteProduct(product.id)
    loadProducts()
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-surface-border flex items-center gap-3">
        <Package size={18} className="text-primary-500" />
        <h2 className="text-lg font-bold text-white flex-1">Produtos</h2>

        {/* Busca */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar produto..."
            className="bg-surface-input border border-surface-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 w-64"
          />
        </div>

        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium px-3 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} />
          Novo Produto
        </button>
      </div>

      {/* Tabela */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
            <Package size={32} className="opacity-30" />
            <p className="text-sm">{search ? 'Nenhum produto encontrado.' : 'Nenhum produto cadastrado.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-surface-card border-b border-surface-border">
              <tr>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Código</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Descrição</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Cód. Barras</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Unid.</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Preço</th>
                <th className="text-right px-4 py-3 text-slate-400 font-medium">Estoque</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product, i) => (
                <tr
                  key={product.id}
                  className={`border-b border-surface-border/50 hover:bg-surface-card/50 transition-colors ${
                    i % 2 === 0 ? '' : 'bg-white/[0.02]'
                  }`}
                >
                  <td className="px-4 py-3 text-slate-300 font-mono text-xs">{product.internal_code}</td>
                  <td className="px-4 py-3 text-white font-medium">{product.description}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">{product.barcode ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">{product.unit}</td>
                  <td className="px-4 py-3 text-right text-green-400 font-medium">{formatCurrency(product.sale_price)}</td>
                  <td className="px-4 py-3 text-right text-slate-300">{product.stock_qty}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Editar"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                        title="Excluir"
                      >
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

      {/* Modal de cadastro/edição */}
      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); loadProducts() }}
        />
      )}
    </div>
  )
}
