import { useState, useEffect } from 'react'
import { DollarSign, Lock, Unlock, TrendingUp } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCashRegister } from '../contexts/CashRegisterContext'
import type { CashRegisterSummary } from '../types'
import { formatCurrency, formatDateTime, paymentMethodLabel } from '../utils/formatters'

export default function CashRegisterPage() {
  const { user } = useAuth()
  const { cashRegister, setCashRegister } = useCashRegister()

  const [openingAmount, setOpeningAmount] = useState('')
  const [closingAmount, setClosingAmount] = useState('')
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (cashRegister) {
      loadSummary()
    }
  }, [cashRegister])

  async function loadSummary() {
    if (!cashRegister) return
    const res = await window.api.getCashRegisterSummary(cashRegister.id)
    if (res.success && res.data) setSummary(res.data)
  }

  async function handleOpen() {
    if (!user) return
    const amount = parseFloat(openingAmount.replace(',', '.')) || 0
    setLoading(true)

    const res = await window.api.openCashRegister(user.id, amount)
    if (res.success && res.data) {
      setCashRegister(res.data)
      setMessage({ type: 'success', text: 'Caixa aberto com sucesso!' })
      setOpeningAmount('')
    } else {
      setMessage({ type: 'error', text: res.error ?? 'Erro ao abrir caixa.' })
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
      setMessage({ type: 'success', text: 'Caixa fechado com sucesso!' })
      setClosingAmount('')
    } else {
      setMessage({ type: 'error', text: res.error ?? 'Erro ao fechar caixa.' })
    }
    setLoading(false)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <DollarSign size={20} className="text-primary-500" />
          Controle de Caixa
        </h2>

        {/* Mensagem de feedback */}
        {message && (
          <div className={`rounded-lg px-4 py-3 text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-900/30 border border-green-700 text-green-400'
              : 'bg-red-900/30 border border-red-700 text-red-400'
          }`}>
            {message.text}
          </div>
        )}

        {/* Status atual */}
        <div className="bg-surface-card rounded-xl border border-surface-border p-5">
          <div className="flex items-center gap-3 mb-4">
            {cashRegister ? (
              <Unlock size={20} className="text-green-400" />
            ) : (
              <Lock size={20} className="text-red-400" />
            )}
            <h3 className="font-semibold text-white">
              {cashRegister ? 'Caixa Aberto' : 'Caixa Fechado'}
            </h3>
          </div>

          {cashRegister ? (
            <div className="space-y-2 text-sm text-slate-300">
              <p>Aberto em: <span className="text-white">{formatDateTime(cashRegister.opened_at)}</span></p>
              <p>Valor inicial: <span className="text-white">{formatCurrency(cashRegister.opening_amount)}</span></p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhum caixa aberto no momento.</p>
          )}
        </div>

        {/* Ação: abrir ou fechar */}
        {!cashRegister ? (
          <div className="bg-surface-card rounded-xl border border-surface-border p-5 space-y-4">
            <h3 className="font-semibold text-white">Abrir Caixa</h3>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Valor inicial (troco em caixa)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={openingAmount}
                onChange={e => setOpeningAmount(e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0,00"
              />
            </div>
            <button
              onClick={handleOpen}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Abrindo...' : 'Abrir Caixa'}
            </button>
          </div>
        ) : (
          <div className="bg-surface-card rounded-xl border border-surface-border p-5 space-y-4">
            <h3 className="font-semibold text-white">Fechar Caixa</h3>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">Valor contado em caixa</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={closingAmount}
                onChange={e => setClosingAmount(e.target.value)}
                className="w-full bg-surface-input border border-surface-border rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="0,00"
              />
            </div>
            <button
              onClick={handleClose}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Fechando...' : 'Fechar Caixa'}
            </button>
          </div>
        )}

        {/* Resumo de vendas */}
        {summary && cashRegister && (
          <div className="bg-surface-card rounded-xl border border-surface-border p-5">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-primary-500" />
              Resumo do Período
            </h3>
            <div className="space-y-2">
              {summary.totals.length === 0 ? (
                <p className="text-sm text-slate-400">Nenhuma venda registrada.</p>
              ) : (
                summary.totals.map(row => (
                  <div key={row.payment_method} className="flex justify-between text-sm">
                    <span className="text-slate-400">{paymentMethodLabel(row.payment_method)} ({row.qty}x)</span>
                    <span className="text-white font-medium">{formatCurrency(row.total)}</span>
                  </div>
                ))
              )}
              {summary.totals.length > 0 && (
                <div className="flex justify-between text-sm font-bold border-t border-surface-border pt-2 mt-2">
                  <span className="text-white">Total</span>
                  <span className="text-green-400">{formatCurrency(summary.grandTotal)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
