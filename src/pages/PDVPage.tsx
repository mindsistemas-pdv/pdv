import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCashRegister } from '../contexts/CashRegisterContext'
import type { CartItem, Product } from '../types'
import { formatCurrency } from '../utils/formatters'
import PaymentModal from '../components/PaymentModal'

export default function PDVPage() {
  const { user } = useAuth()
  const { cashRegister } = useCashRegister()

  const [cart, setCart] = useState<CartItem[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [searchError, setSearchError] = useState('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [lastSaleId, setLastSaleId] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Foca no campo de busca ao montar e após cada venda
  useEffect(() => {
    inputRef.current?.focus()
  }, [lastSaleId])

  const total = cart.reduce((sum, item) => sum + item.totalAmount, 0)

  /**
   * Busca produto por código de barras ou código interno.
   * Prioriza código de barras (leitura de scanner).
   */
  const searchProduct = useCallback(async (query: string): Promise<Product | null> => {
    // Tenta por código de barras primeiro
    let res = await window.api.getProductByBarcode(query)
    if (res.success && res.data) return res.data

    // Fallback: código interno
    res = await window.api.getProductByCode(query)
    if (res.success && res.data) return res.data

    return null
  }, [])

  async function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()

    const query = searchInput.trim()
    if (!query) return

    setSearchError('')
    const product = await searchProduct(query)

    if (!product) {
      setSearchError(`Produto "${query}" não encontrado.`)
      setSearchInput('')
      return
    }

    addToCart(product)
    setSearchInput('')
    inputRef.current?.focus()
  }

  function addToCart(product: Product, qty = 1) {
    setCart(prev => {
      const existing = prev.findIndex(i => i.productId === product.id)
      if (existing >= 0) {
        // Incrementa quantidade se já está no carrinho
        return prev.map((item, idx) =>
          idx === existing
            ? { ...item, quantity: item.quantity + qty, totalAmount: (item.quantity + qty) * item.unitPrice }
            : item
        )
      }
      return [...prev, {
        productId:   product.id,
        description: product.description,
        quantity:    qty,
        unitPrice:   product.sale_price,
        totalAmount: qty * product.sale_price,
      }]
    })
  }

  function updateQty(index: number, delta: number) {
    setCart(prev => {
      const item = prev[index]
      const newQty = item.quantity + delta
      if (newQty <= 0) return prev.filter((_, i) => i !== index)
      return prev.map((it, i) =>
        i === index ? { ...it, quantity: newQty, totalAmount: newQty * it.unitPrice } : it
      )
    })
  }

  function removeItem(index: number) {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  function clearCart() {
    setCart([])
    setSearchError('')
    setSearchInput('')
    inputRef.current?.focus()
  }

  // Atalhos de teclado globais
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      // F5: finalizar venda
      if (e.key === 'F5' && cart.length > 0 && cashRegister) {
        e.preventDefault()
        setPaymentModalOpen(true)
      }
      // F9: cancelar venda
      if (e.key === 'F9' && cart.length > 0) {
        e.preventDefault()
        if (confirm('Cancelar a venda atual?')) clearCart()
      }
      // Escape: foca no campo de busca
      if (e.key === 'Escape') {
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cart, cashRegister])

  async function handleSaleFinished(saleId: number) {
    setLastSaleId(saleId)
    clearCart()
    setPaymentModalOpen(false)
  }

  const caixaFechado = !cashRegister

  return (
    <div className="h-full flex overflow-hidden">
      {/* Coluna esquerda: campo de busca + lista de itens */}
      <div className="flex-1 flex flex-col border-r border-surface-border">
        {/* Campo de busca / leitura de código */}
        <div className="p-3 border-b border-surface-border">
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setSearchError('') }}
            onKeyDown={handleSearchKeyDown}
            disabled={caixaFechado}
            placeholder={caixaFechado ? 'Abra o caixa para iniciar vendas' : 'Código de barras ou código interno — Enter para adicionar'}
            className="w-full bg-surface-input border border-surface-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          />
          {searchError && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> {searchError}
            </p>
          )}
        </div>

        {/* Aviso de caixa fechado */}
        {caixaFechado && (
          <div className="m-3 bg-yellow-900/20 border border-yellow-700/50 rounded-lg px-4 py-3 text-yellow-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} />
            Caixa fechado. Vá em <strong>Caixa</strong> para abrir antes de vender.
          </div>
        )}

        {/* Lista de itens do carrinho */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <ShoppingCart size={48} className="opacity-20" />
              <p className="text-sm">Nenhum item na venda</p>
              <p className="text-xs">Digite o código e pressione Enter</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface border-b border-surface-border">
                <tr>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">#</th>
                  <th className="text-left px-4 py-2 text-slate-400 font-medium">Produto</th>
                  <th className="text-center px-4 py-2 text-slate-400 font-medium">Qtd</th>
                  <th className="text-right px-4 py-2 text-slate-400 font-medium">Unit.</th>
                  <th className="text-right px-4 py-2 text-slate-400 font-medium">Total</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, i) => (
                  <tr key={item.productId} className="border-b border-surface-border/30 hover:bg-white/[0.02]">
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 text-white">{item.description}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => updateQty(i, -1)}
                          className="p-0.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQty(i, 1)}
                          className="p-0.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-2.5 text-right text-white font-medium">{formatCurrency(item.totalAmount)}</td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={() => removeItem(i)}
                        className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Coluna direita: totais e ações */}
      <div className="w-72 flex flex-col bg-surface-card">
        {/* Total */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-b border-surface-border">
          <p className="text-slate-400 text-sm mb-2">Total da Venda</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(total)}</p>
          <p className="text-slate-500 text-xs mt-2">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>
        </div>

        {/* Atalhos */}
        <div className="p-3 border-b border-surface-border space-y-1 text-xs text-slate-500">
          <p><kbd className="bg-surface-input px-1 rounded">F5</kbd> Finalizar venda</p>
          <p><kbd className="bg-surface-input px-1 rounded">F9</kbd> Cancelar venda</p>
          <p><kbd className="bg-surface-input px-1 rounded">Esc</kbd> Focar no campo</p>
        </div>

        {/* Botões de ação */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => setPaymentModalOpen(true)}
            disabled={cart.length === 0 || caixaFechado}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors text-sm"
          >
            Finalizar Venda (F5)
          </button>
          <button
            onClick={() => { if (confirm('Cancelar a venda atual?')) clearCart() }}
            disabled={cart.length === 0}
            className="w-full bg-surface-input hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 font-medium py-2 rounded-xl transition-colors text-sm"
          >
            Cancelar (F9)
          </button>
        </div>

        {/* Última venda */}
        {lastSaleId && (
          <div className="px-3 pb-3">
            <p className="text-xs text-green-400 text-center">
              ✓ Venda #{lastSaleId} registrada
            </p>
          </div>
        )}
      </div>

      {/* Modal de pagamento */}
      {paymentModalOpen && cashRegister && user && (
        <PaymentModal
          cart={cart}
          total={total}
          cashRegisterId={cashRegister.id}
          userId={user.id}
          onClose={() => setPaymentModalOpen(false)}
          onFinished={handleSaleFinished}
        />
      )}
    </div>
  )
}
