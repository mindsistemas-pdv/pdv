import { useState, useEffect, useCallback } from 'react'
import { History, Search, ChevronDown, ChevronUp, Printer, Eye } from 'lucide-react'
import type { Sale, SaleItem } from '../types'
import { formatCurrency, formatDateTime, paymentMethodLabel } from '../utils/formatters'
import { useAuth } from '../contexts/AuthContext'
import Toast, { useToast } from '../components/Toast'

export default function SalesHistoryPage() {
  const { user } = useAuth()
  const { toast, showToast, hideToast } = useToast()

  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [itemsCache, setItemsCache] = useState<Record<number, SaleItem[]>>({})
  const [loadingItems, setLoadingItems] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const res = await window.api.getAllSales()
    if (res.success && res.data) setSales(res.data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = sales.filter(s =>
    String(s.id).includes(search) ||
    paymentMethodLabel(s.payment_method).toLowerCase().includes(search.toLowerCase()) ||
    formatCurrency(s.total_amount).includes(search)
  )

  async function toggleExpand(sale: Sale) {
    if (expandedId === sale.id) {
      setExpandedId(null)
      return
    }

    setExpandedId(sale.id)

    // Carrega os itens se ainda não estão em cache
    if (!itemsCache[sale.id]) {
      setLoadingItems(sale.id)
      const res = await window.api.getSaleById(sale.id)
      if (res.success && res.data?.items) {
        setItemsCache(prev => ({ ...prev, [sale.id]: res.data!.items! }))
      }
      setLoadingItems(null)
    }
  }

  function buildReceiptData(sale: Sale) {
    const items = itemsCache[sale.id] ?? []
    return {
      saleId:        sale.id,
      companyName:   'MindSys PDV',
      date:          formatDateTime(sale.created_at),
      operatorName:  user?.name ?? 'Operador',
      items:         items.map(i => ({
        description: i.description,
        quantity:    i.quantity,
        unitPrice:   i.unit_price,
        totalAmount: i.total_amount,
      })),
      totalAmount:    sale.total_amount,
      discountAmount: sale.discount_amount,
      paymentMethod:  sale.payment_method,
      amountPaid:     sale.amount_paid,
      changeAmount:   sale.change_amount,
    }
  }

  async function handlePrint(sale: Sale) {
    if (!itemsCache[sale.id]) {
      const res = await window.api.getSaleById(sale.id)
      if (res.success && res.data?.items) {
        setItemsCache(prev => ({ ...prev, [sale.id]: res.data!.items! }))
      }
    }
    await window.api.printReceipt(buildReceiptData(sale))
  }

  async function handlePreview(sale: Sale) {
    if (!itemsCache[sale.id]) {
      const res = await window.api.getSaleById(sale.id)
      if (res.success && res.data?.items) {
        setItemsCache(prev => ({ ...prev, [sale.id]: res.data!.items! }))
      }
    }
    await window.api.previewReceipt(buildReceiptData(sale))
  }

  const totalGeral = filtered.reduce((s, v) => s + v.total_amount, 0)

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-surface-border flex items-center gap-3">
        <History size={18} className="text-primary-500" />
        <h2 className="text-lg font-bold text-white flex-1">Histórico de Vendas</h2>

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nº, valor ou pagamento..."
            className="bg-surface-input border border-surface-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 w-72"
          />
        </div>

        <button onClick={load} className="text-xs text-slate-400 hover:text-white transition-colors px-2 py-1">
          Atualizar
        </button>
      </div>

      {/* Resumo */}
      {!loading && filtered.length > 0 && (
        <div className="px-4 py-2 border-b border-surface-border flex items-center gap-6 text-sm">
          <span className="text-slate-400">
            <span className="text-white font-medium">{filtered.length}</span> vendas
          </span>
          <span className="text-slate-400">
            Total: <span className="text-green-400 font-medium">{formatCurrency(totalGeral)}</span>
          </span>
        </div>
      )}

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-slate-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 gap-2">
            <History size={32} className="opacity-30" />
            <p className="text-sm">{search ? 'Nenhuma venda encontrada.' : 'Nenhuma venda registrada.'}</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border/50">
            {filtered.map(sale => (
              <div key={sale.id}>
                {/* Linha principal */}
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => toggleExpand(sale)}
                >
                  {/* Número da venda */}
                  <span className="text-slate-500 text-xs font-mono w-12 shrink-0">#{sale.id}</span>

                  {/* Data */}
                  <span className="text-slate-400 text-xs w-36 shrink-0">
                    {formatDateTime(sale.created_at)}
                  </span>

                  {/* Pagamento */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${
                    sale.payment_method === 'cash'        ? 'bg-green-900/40 text-green-400'  :
                    sale.payment_method === 'pix'         ? 'bg-blue-900/40 text-blue-400'    :
                    sale.payment_method === 'card_debit'  ? 'bg-purple-900/40 text-purple-400':
                    'bg-orange-900/40 text-orange-400'
                  }`}>
                    {paymentMethodLabel(sale.payment_method)}
                  </span>

                  {/* Status */}
                  {sale.status === 'cancelled' && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 font-medium shrink-0">
                      Cancelada
                    </span>
                  )}

                  <span className="flex-1" />

                  {/* Total */}
                  <span className={`font-semibold tabular-nums text-sm ${
                    sale.status === 'cancelled' ? 'text-slate-500 line-through' : 'text-white'
                  }`}>
                    {formatCurrency(sale.total_amount)}
                  </span>

                  {/* Ações rápidas */}
                  <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => handlePreview(sale)}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      title="Visualizar comprovante"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={() => handlePrint(sale)}
                      className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors"
                      title="Imprimir comprovante"
                    >
                      <Printer size={13} />
                    </button>
                  </div>

                  {/* Chevron */}
                  <span className="text-slate-600 ml-1">
                    {expandedId === sale.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                </div>

                {/* Detalhes expandidos */}
                {expandedId === sale.id && (
                  <div className="px-4 pb-4 bg-white/[0.015]">
                    {loadingItems === sale.id ? (
                      <p className="text-xs text-slate-500 py-2">Carregando itens...</p>
                    ) : (
                      <div className="space-y-3">
                        {/* Itens */}
                        <table className="w-full text-xs mt-1">
                          <thead>
                            <tr className="text-slate-500 border-b border-surface-border/50">
                              <th className="text-left py-1.5 font-medium">Produto</th>
                              <th className="text-center py-1.5 font-medium w-16">Qtd</th>
                              <th className="text-right py-1.5 font-medium w-24">Unit.</th>
                              <th className="text-right py-1.5 font-medium w-24">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(itemsCache[sale.id] ?? []).map(item => (
                              <tr key={item.id} className="border-b border-surface-border/20">
                                <td className="py-1.5 text-slate-300">{item.description}</td>
                                <td className="py-1.5 text-center text-slate-400">{item.quantity}</td>
                                <td className="py-1.5 text-right text-slate-400 tabular-nums">{formatCurrency(item.unit_price)}</td>
                                <td className="py-1.5 text-right text-white tabular-nums">{formatCurrency(item.total_amount)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Totais */}
                        <div className="flex justify-end">
                          <div className="space-y-1 text-xs min-w-48">
                            {sale.discount_amount > 0 && (
                              <div className="flex justify-between gap-8">
                                <span className="text-slate-400">Desconto</span>
                                <span className="text-red-400 tabular-nums">- {formatCurrency(sale.discount_amount)}</span>
                              </div>
                            )}
                            <div className="flex justify-between gap-8 font-bold text-sm border-t border-surface-border pt-1">
                              <span className="text-white">Total</span>
                              <span className="text-green-400 tabular-nums">{formatCurrency(sale.total_amount)}</span>
                            </div>
                            <div className="flex justify-between gap-8">
                              <span className="text-slate-400">Pagamento</span>
                              <span className="text-white">{paymentMethodLabel(sale.payment_method)}</span>
                            </div>
                            <div className="flex justify-between gap-8">
                              <span className="text-slate-400">Valor pago</span>
                              <span className="text-white tabular-nums">{formatCurrency(sale.amount_paid)}</span>
                            </div>
                            {sale.payment_method === 'cash' && sale.change_amount > 0 && (
                              <div className="flex justify-between gap-8">
                                <span className="text-slate-400">Troco</span>
                                <span className="text-green-400 tabular-nums">{formatCurrency(sale.change_amount)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
