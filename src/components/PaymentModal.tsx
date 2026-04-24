import { useState, useEffect, type KeyboardEvent } from 'react'
import { X, CreditCard, Banknote, QrCode, Check } from 'lucide-react'
import type { CartItem, PaymentMethod } from '../types'
import { formatCurrency } from '../utils/formatters'
import ReceiptModal from './ReceiptModal'

interface Props {
  cart: CartItem[]
  total: number
  cashRegisterId: number
  userId: number
  operatorName: string
  onClose: () => void
  onFinished: (saleId: number) => void
}

const PAYMENT_OPTIONS: { method: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { method: 'cash',        label: 'Dinheiro',       icon: <Banknote size={18} /> },
  { method: 'card_debit',  label: 'Cartão Débito',  icon: <CreditCard size={18} /> },
  { method: 'card_credit', label: 'Cartão Crédito', icon: <CreditCard size={18} /> },
  { method: 'pix',         label: 'PIX',            icon: <QrCode size={18} /> },
]

export default function PaymentModal({ cart, total, cashRegisterId, userId, operatorName, onClose, onFinished }: Props) {
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [amountPaid, setAmountPaid] = useState(total.toFixed(2))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Após venda confirmada, mostra o modal de impressão
  const [receiptData, setReceiptData] = useState<{
    saleId: number
    amountPaid: number
    changeAmount: number
    paymentMethod: PaymentMethod
  } | null>(null)

  const paid = parseFloat(amountPaid.replace(',', '.')) || 0
  const change = method === 'cash' ? Math.max(0, paid - total) : 0
  const canFinish = method !== 'cash' || paid >= total

  useEffect(() => {
    if (method !== 'cash') setAmountPaid(total.toFixed(2))
  }, [method, total])

  async function handleFinish() {
    if (!canFinish) { setError('Valor recebido insuficiente.'); return }
    setLoading(true)
    setError('')

    const res = await window.api.createSale({
      cashRegisterId,
      userId,
      totalAmount:    total,
      discountAmount: 0,
      paymentMethod:  method,
      amountPaid:     paid,
      changeAmount:   change,
      items: cart.map(item => ({
        productId:   item.productId,
        description: item.description,
        quantity:    item.quantity,
        unitPrice:   item.unitPrice,
        totalAmount: item.totalAmount,
      })),
    })

    if (res.success && res.data) {
      // Mostra o modal de impressão antes de limpar o carrinho
      setReceiptData({
        saleId:        (res.data as { id: number }).id,
        amountPaid:    paid,
        changeAmount:  change,
        paymentMethod: method,
      })
    } else {
      setError(res.error ?? 'Erro ao registrar venda.')
    }
    setLoading(false)
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' && canFinish && !receiptData) handleFinish()
    if (e.key === 'Escape' && !receiptData) onClose()
  }

  // Se a venda foi registrada, mostra o modal de comprovante
  if (receiptData) {
    return (
      <ReceiptModal
        saleId={receiptData.saleId}
        cart={cart}
        total={total}
        paymentMethod={receiptData.paymentMethod}
        amountPaid={receiptData.amountPaid}
        changeAmount={receiptData.changeAmount}
        operatorName={operatorName}
        onClose={() => onFinished(receiptData.saleId)}
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onKeyDown={handleKeyDown}>
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-md animate-fadeIn">
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h3 className="font-semibold text-white">Finalizar Venda</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Total */}
          <div className="text-center">
            <p className="text-slate-400 text-sm">Total a pagar</p>
            <p className="text-3xl font-bold text-white mt-1">{formatCurrency(total)}</p>
            <p className="text-slate-500 text-xs mt-1">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</p>
          </div>

          {/* Forma de pagamento */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Forma de pagamento</p>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_OPTIONS.map(opt => (
                <button key={opt.method} onClick={() => setMethod(opt.method)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    method === opt.method
                      ? 'bg-primary-600 border-primary-500 text-white'
                      : 'bg-surface-input border-surface-border text-slate-300 hover:border-slate-500'
                  }`}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Valor recebido */}
          {method === 'cash' && (
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Valor recebido</label>
              <input type="number" step="0.01" min={total} value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2.5 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus />
            </div>
          )}

          {/* Troco */}
          {method === 'cash' && (
            <div className={`flex justify-between items-center px-4 py-3 rounded-lg ${
              change > 0 ? 'bg-green-900/20 border border-green-700/50' : 'bg-surface-input'
            }`}>
              <span className="text-sm text-slate-400">Troco</span>
              <span className={`text-lg font-bold ${change > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                {formatCurrency(change)}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-900/30 border border-red-700 rounded-lg px-3 py-2 text-red-400 text-sm">{error}</div>
          )}

          <button onClick={handleFinish} disabled={loading || !canFinish}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? 'Registrando...' : <><Check size={18} /> Confirmar Pagamento</>}
          </button>
        </div>
      </div>
    </div>
  )
}
