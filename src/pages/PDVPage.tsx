import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { ShoppingCart, Trash2, Plus, Minus, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCashRegister } from '../contexts/CashRegisterContext'
import type { CartItem, Product } from '../types'
import { formatCurrency } from '../utils/formatters'
import PaymentModal from '../components/PaymentModal'
import ConfirmModal from '../components/ConfirmModal'
import Toast, { useToast } from '../components/Toast'

export default function PDVPage() {
  const { user } = useAuth()
  const { cashRegister } = useCashRegister()
  const { toast, showToast, hideToast } = useToast()

  const [cart, setCart] = useState<CartItem[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [searchError, setSearchError] = useState('')
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  // ID da última linha adicionada — para o efeito de flash
  const [flashedProductId, setFlashedProductId] = useState<number | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Foca no campo ao montar
  useEffect(() => { inputRef.current?.focus() }, [])

  const total = cart.reduce((sum, item) => sum + item.totalAmount, 0)
  const caixaFechado = !cashRegister

  const searchProduct = useCallback(async (query: string): Promise<Product | null> => {
    let res = await window.api.getProductByBarcode(query)
    if (res.success && res.data) return res.data
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
      setSearchError(`"${query}" não encontrado.`)
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

    // Flash visual na linha do produto adicionado
    setFlashedProductId(product.id)
    setTimeout(() => setFlashedProductId(null), 600)
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
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  // Atalhos globais
  useEffect(() => {
    function onKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'F5' && cart.length > 0 && cashRegister) {
        e.preventDefault()
        setPaymentModalOpen(true)
      }
      if (e.key === 'F9' && cart.length > 0) {
        e.preventDefault()
        setCancelModalOpen(true)
      }
      if (e.key === 'Escape' && !paymentModalOpen && !cancelModalOpen) {
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [cart, cashRegister, paymentModalOpen, cancelModalOpen])

  function handleSaleFinished(saleId: number) {
    clearCart()
    setPaymentModalOpen(false)
    showToast(`Venda #${saleId} registrada com sucesso!`, 'success')
  }

  return (
    <div className="h-full flex overflow-hidden">

      {/* Coluna esquerda: busca + itens */}
      <div className="flex-1 flex flex-col border-r border-surface-border min-w-0">

        {/* Campo de busca */}
        <div className="p-3 border-b border-surface-border">
          <input
            ref={inputRef}
            type="text"
            value={searchInput}
            onChange={e => { setSearchInput(e.target.value); setSearchError('') }}
            onKeyDown={handleSearchKeyDown}
            disabled={caixaFechado}
            placeholder={
              caixaFechado
                ? 'Abra o caixa para iniciar vendas...'
                : 'Código de barras ou código interno — Enter para adicionar'
            }
            className="w-full bg-surface-input border border-surface-border rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition"
          />
          {searchError && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <AlertCircle size={12} /> {searchError}
            </p>
          )}
        </div>

        {/* Aviso caixa fechado */}
        {caixaFechado && (
          <div className="mx-3 mt-3 bg-yellow-900/20 border border-yellow-700/40 rounded-lg px-4 py-3 text-yellow-400 text-sm flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>Caixa fechado. Acesse <strong>Caixa</strong> no menu para abrir.</span>
          </div>
        )}

        {/* Lista de itens */}
        <div className="flex-1 overflow-y-auto">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-3 select-none">
              <ShoppingCart size={52} strokeWidth={1} />
              <p className="text-sm">Nenhum item na venda</p>
              <p className="text-xs text-slate-700">Digite o código e pressione Enter</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-surface border-b border-surface-border z-10">
                <tr>
                  <th className="text-left px-4 py-2.5 text-slate-500 font-medium w-8">#</th>
                  <th className="text-left px-4 py-2.5 text-slate-500 font-medium">Produto</th>
                  <th className="text-center px-4 py-2.5 text-slate-500 font-medium w-28">Qtd</th>
                  <th className="text-right px-4 py-2.5 text-slate-500 font-medium w-24">Unit.</th>
                  <th className="text-right px-4 py-2.5 text-slate-500 font-medium w-28">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, i) => (
                  <tr
                    key={item.productId}
                    className={`border-b border-surface-border/30 transition-colors duration-300 ${
                      flashedProductId === item.productId
                        ? 'bg-primary-600/20'
                        : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="px-4 py-3 text-slate-600 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 text-white font-medium">{item.description}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => updateQty(i, -1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-8 text-center text-white font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(i, 1)}
                          className="w-6 h-6 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400 tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold tabular-nums">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => removeItem(i)}
                        className="w-7 h-7 flex items-center justify-center text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
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

      {/* Coluna direita: total + ações */}
      <div className="w-68 flex flex-col bg-surface-card" style={{ width: '17rem' }}>

        {/* Total */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 border-b border-surface-border">
          <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Total da Venda</p>
          <p className="text-5xl font-bold text-white tabular-nums leading-none">
            {formatCurrency(total)}
          </p>
          <p className="text-slate-600 text-xs mt-3">
            {cart.length === 0
              ? 'Nenhum item'
              : `${cart.length} ${cart.length === 1 ? 'item' : 'itens'}`
            }
          </p>
        </div>

        {/* Atalhos */}
        <div className="px-4 py-3 border-b border-surface-border space-y-1.5">
          <p className="text-xs text-slate-600">
            <kbd className="bg-surface-input border border-surface-border px-1.5 py-0.5 rounded text-slate-400 font-mono text-xs">F5</kbd>
            {' '}<span className="text-slate-500">Finalizar venda</span>
          </p>
          <p className="text-xs text-slate-600">
            <kbd className="bg-surface-input border border-surface-border px-1.5 py-0.5 rounded text-slate-400 font-mono text-xs">F9</kbd>
            {' '}<span className="text-slate-500">Cancelar venda</span>
          </p>
          <p className="text-xs text-slate-600">
            <kbd className="bg-surface-input border border-surface-border px-1.5 py-0.5 rounded text-slate-400 font-mono text-xs">Esc</kbd>
            {' '}<span className="text-slate-500">Focar no campo</span>
          </p>
        </div>

        {/* Botões */}
        <div className="p-3 space-y-2">
          <button
            onClick={() => setPaymentModalOpen(true)}
            disabled={cart.length === 0 || caixaFechado}
            className="w-full bg-green-600 hover:bg-green-500 active:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-colors text-sm"
          >
            Finalizar Venda (F5)
          </button>
          <button
            onClick={() => setCancelModalOpen(true)}
            disabled={cart.length === 0}
            className="w-full bg-surface-input hover:bg-slate-600 active:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 font-medium py-2.5 rounded-xl transition-colors text-sm"
          >
            Cancelar Venda (F9)
          </button>
        </div>
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

      {/* Modal de confirmação de cancelamento */}
      {cancelModalOpen && (
        <ConfirmModal
          title="Cancelar venda"
          message="Todos os itens serão removidos. Deseja continuar?"
          confirmLabel="Sim, cancelar"
          cancelLabel="Não"
          danger
          onConfirm={() => { setCancelModalOpen(false); clearCart() }}
          onCancel={() => setCancelModalOpen(false)}
        />
      )}

      {/* Toast de feedback */}
      {toast && (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  )
}
