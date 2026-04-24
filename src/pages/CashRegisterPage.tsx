import { useState, useEffect, useCallback } from 'react'
import { DollarSign, Lock, Unlock, TrendingUp, RefreshCw, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCashRegister } from '../contexts/CashRegisterContext'
import type { CashMovement, CashRegisterSummary } from '../types'
import { formatCurrency, formatDateTime, paymentMethodLabel } from '../utils/formatters'
import Toast, { useToast } from '../components/Toast'

type MovementModalType = 'withdrawal' | 'supply' | null

export default function CashRegisterPage() {
  const { user } = useAuth()
  const { cashRegister, setCashRegister } = useCashRegister()
  const { toast, showToast, hideToast } = useToast()

  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null)
  const [movements, setMovements] = useState<CashMovement[]>([])
  const [loading, setLoading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(false)

  const [movementModal, setMovementModal] = useState<MovementModalType>(null)
  const [movementAmount, setMovementAmount] = useState('')
  const [movementDesc, setMovementDesc] = useState('')
  const [movementLoading, setMovementLoading] = useState(false)

  const loadSummary = useCallback(async () => {
    if (!cashRegister) return
    setSummaryLoading(true)
    const [sumRes, movRes] = await Promise.all([
      window.api.getCashRegisterSummary(cashRegister.id),
      window.api.getCashMovements(cashRegister.id),
    ])
    if (sumRes.success && sumRes.data) setSummary(sumRes.data)
    if (movRes.success && movRes.data) setMovements(movRes.data)
    setSummaryLoading(false)
  }, [cashRegister])

  useEffect(() => {
    if (cashRegister) loadSummary()
    else { setSummary(null); setMovements([]) }
  }, [cashRegister, loadSummary])

  async function handleOpen() {
    if (!user) return
    const amount = parseFloat(openingAmount.replace(',', '.')) || 0
    setLoading(true)
    const res = await window.api.openCashRegister(user.id, amount)
    if (res.success && res.data) {
      setCashRegister(res.data)
      setOpeningAmount('')
      showToast('Caixa aberto com sucesso!', 'success')
    } else {
      showToast(res.error ?? 'Erro ao abrir caixa.', 'error')
    }
    setLoading(false)
  }

  async function handleClose() {
    if (!cashRegister) return
    const amount = parseFloat(closingAmount.replace(',', '.')) || 0
    setLoading(true)
    const res = await window.api.closeCashRegister(cashRegister.id, amount)
    if (res.success) {
      setCashRegister(null)
      setSummary(null)
      setMovements([])
      setClosingAmount('')
      showToast('Caixa fechado com sucesso!', 'success')
    } else {
      showToast(res.error ?? 'Erro ao fechar caixa.', 'error')
    }
    setLoading(false)
  }

  async function handleMovement() {
    if (!cashRegister || !user || !movementModal) return
    const amount = parseFloat(movementAmount.replace(',', '.'))
    if (!amount || amount <= 0) return
    setMovementLoading(true)
    const res = await window.api.addCashMovement({
      cashRegisterId: cashRegister.id,
      userId: user.id,
      type: movementModal,
      amount,
      description: movementDesc.trim() || undefined,
    })
    if (res.success) {
      const label = movementModal === 'withdrawal' ? 'Sangria' : 'Suprimento'
      showToast(`${label} registrado: ${formatCurrency(amount)}`, 'success')
      setMovementModal(null)
      setMovementAmount('')
      setMovementDesc('')
      loadSummary()
    } else {
      showToast(res.error ?? 'Erro ao registrar movimento.', 'error')
    }
    setMovementLoading(false)
  }

  const movementTypeLabel = (type: string) => type === 'withdrawal' ? 'Sangria' : 'Suprimento'

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign size={20} className="text-primary-500" /> Controle de Caixa
        </h2>

        {/* Status */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-5">
          <div className="flex items-center gap-3 mb-3">
            {cashRegister ? <Unlock size={18} className="text-green-400" /> : <Lock size={18} className="text-red-400" />}
            <h3 className="font-semibold text-white">{cashRegister ? 'Caixa Aberto' : 'Caixa Fechado'}</h3>
          </div>
          {cashRegister ? (
            <div className="space-y-1.5 text-sm">
              <p className="text-slate-400">Aberto em: <span className="text-white">{formatDateTime(cashRegister.opened_at)}</span></p>
              <p className="text-slate-400">Valor inicial: <span className="text-white font-medium">{formatCurrency(cashRegister.opening_amount)}</span></p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Nenhum caixa aberto no momento.</p>
          )}
        </div>

        {!cashRegister ? (
          <div className="bg-surface-card rounded-xl border border-surface-border p-5 space-y-4">
            <h3 className="font-semibold text-white">Abrir Caixa</h3>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Valor inicial em caixa (troco disponível)</label>
              <input type="number" step="0.01" min="0" value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleOpen()}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                placeholder="0,00" autoFocus />
            </div>
            <button onClick={handleOpen} disabled={loading}
              className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setMovementModal('withdrawal')}
                className="flex items-center justify-center gap-2 bg-surface-card hover:bg-slate-700 border border-surface-border rounded-xl p-4 text-sm font-medium text-orange-400 transition-colors">
                <ArrowDownCircle size={18} /> Sangria
              </button>
              <button onClick={() => setMovementModal('supply')}
                className="flex items-center justify-center gap-2 bg-surface-card hover:bg-slate-700 border border-surface-border rounded-xl p-4 text-sm font-medium text-blue-400 transition-colors">
                <ArrowUpCircle size={18} /> Suprimento
              </button>
            </div>

            <div className="bg-surface-card rounded-xl border border-surface-border p-5 space-y-4">
              <h3 className="font-semibold text-white">Fechar Caixa</h3>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">Valor contado fisicamente em caixa</label>
                <input type="number" step="0.01" min="0" value={closingAmount}
                  onChange={e => setClosingAmount(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleClose()}
                  className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition"
                  placeholder="0,00" />
              </div>
              <button onClick={handleClose} disabled={loading}
                className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
                {loading ? 'Fechando...' : 'Fechar Caixa'}
              </button>
            </div>
          </>
        )}

        {/* Resumo */}
        {cashRegister && (
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <TrendingUp size={16} className="text-primary-500" /> Resumo do Período
              </h3>
              <button onClick={loadSummary} disabled={summaryLoading}
                className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Atualizar">
                <RefreshCw size={14} className={summaryLoading ? 'animate-spin' : ''} />
              </button>
            </div>
            {summaryLoading ? (
              <p className="text-sm text-slate-500">Carregando...</p>
            ) : !summary || summary.totals.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhuma venda registrada neste caixa.</p>
            ) : (
              <div className="space-y-2">
                {summary.totals.map(row => (
                  <div key={row.payment_method} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{paymentMethodLabel(row.payment_method)} <span className="text-slate-600">({row.qty}x)</span></span>
                    <span className="text-white font-medium tabular-nums">{formatCurrency(row.total)}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm font-bold border-t border-surface-border pt-3 mt-1">
                  <span className="text-white">Total Vendas</span>
                  <span className="text-green-400 text-base tabular-nums">{formatCurrency(summary.grandTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Movimentos */}
        {cashRegister && movements.length > 0 && (
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <h3 className="font-semibold text-white mb-4">Movimentos do Caixa</h3>
            <div className="space-y-2">
              {movements.map(m => (
                <div key={m.id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    {m.type === 'withdrawal'
                      ? <ArrowDownCircle size={14} className="text-orange-400 shrink-0" />
                      : <ArrowUpCircle size={14} className="text-blue-400 shrink-0" />
                    }
                    <span className="text-slate-400">
                      {movementTypeLabel(m.type)}
                      {m.description && <span className="text-slate-600 ml-1">— {m.description}</span>}
                    </span>
                  </div>
                  <span className={`font-medium tabular-nums ${m.type === 'withdrawal' ? 'text-orange-400' : 'text-blue-400'}`}>
                    {m.type === 'withdrawal' ? '-' : '+'}{formatCurrency(m.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal sangria/suprimento */}
      {movementModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm animate-fadeIn p-6 space-y-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              {movementModal === 'withdrawal'
                ? <><ArrowDownCircle size={18} className="text-orange-400" /> Sangria</>
                : <><ArrowUpCircle size={18} className="text-blue-400" /> Suprimento</>
              }
            </h3>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Valor *</label>
              <input type="number" step="0.01" min="0.01" value={movementAmount}
                onChange={e => setMovementAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleMovement()}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2.5 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0,00" autoFocus />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Descrição (opcional)</label>
              <input type="text" value={movementDesc} onChange={e => setMovementDesc(e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Ex: Pagamento de fornecedor" />
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setMovementModal(null); setMovementAmount(''); setMovementDesc('') }}
                className="flex-1 bg-surface-input hover:bg-slate-600 text-slate-300 font-medium py-2 rounded-lg transition-colors text-sm">
                Cancelar
              </button>
              <button onClick={handleMovement} disabled={movementLoading || !movementAmount}
                className={`flex-1 font-semibold py-2 rounded-lg transition-colors text-sm text-white disabled:opacity-50 ${
                  movementModal === 'withdrawal' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'
                }`}>
                {movementLoading ? 'Registrando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <Toast key={toast.id} message={toast.message} type={toast.type} onClose={hideToast} />}
    </div>
  )
}
