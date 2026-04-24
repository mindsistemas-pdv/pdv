import { useState } from 'react'
import { Printer, FileDown, Eye, X, Check } from 'lucide-react'
import type { CartItem, PaymentMethod } from '../types'
import { formatCurrency, formatDateTime, paymentMethodLabel } from '../utils/formatters'

interface ReceiptData {
  saleId: number
  companyName: string
  companyDoc?: string
  companyAddress?: string
  date: string
  operatorName: string
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    totalAmount: number
  }>
  totalAmount: number
  discountAmount: number
  paymentMethod: string
  amountPaid: number
  changeAmount: number
  footerMessage?: string
}

interface Props {
  saleId: number
  cart: CartItem[]
  total: number
  paymentMethod: PaymentMethod
  amountPaid: number
  changeAmount: number
  operatorName: string
  onClose: () => void
}

export default function ReceiptModal({
  saleId, cart, total, paymentMethod, amountPaid, changeAmount, operatorName, onClose,
}: Props) {
  const [printing, setPrinting] = useState(false)
  const [savingPdf, setSavingPdf] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  function buildReceiptData(): ReceiptData {
    return {
      saleId,
      companyName:    'MindSys PDV',
      date:           formatDateTime(new Date().toISOString()),
      operatorName,
      items: cart.map(i => ({
        description: i.description,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        totalAmount: i.totalAmount,
      })),
      totalAmount:    total,
      discountAmount: 0,
      paymentMethod,
      amountPaid,
      changeAmount,
      footerMessage: 'Obrigado pela preferência!',
    }
  }

  async function handlePrint() {
    setPrinting(true)
    setStatus(null)
    const res = await window.api.printReceipt(buildReceiptData())
    setPrinting(false)
    if (!res.success) setStatus('Erro ao imprimir: ' + res.error)
  }

  async function handlePreview() {
    await window.api.previewReceipt(buildReceiptData())
  }

  async function handleSavePdf() {
    setSavingPdf(true)
    setStatus(null)

    // Sugere um nome de arquivo baseado no ID da venda
    const fileName = `comprovante-venda-${saleId}.pdf`
    // Salva na pasta de documentos do usuário
    const { app } = window as unknown as { app?: { getPath?: (name: string) => string } }
    const savePath = `${fileName}` // O handler vai resolver o caminho

    // Usa o diálogo de salvar do Electron via IPC
    const res = await window.api.savePdf(buildReceiptData(), fileName)
    setSavingPdf(false)

    if (res.success) {
      setStatus(`PDF salvo: ${res.data}`)
    } else {
      setStatus('Erro ao salvar PDF: ' + res.error)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-card border border-surface-border rounded-2xl w-full max-w-sm animate-fadeIn">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <Check size={16} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Venda #{saleId} registrada</h3>
              <p className="text-xs text-slate-400">Deseja imprimir o comprovante?</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Resumo da venda */}
        <div className="p-5 space-y-3">
          <div className="bg-surface-input rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Total</span>
              <span className="text-white font-bold text-base">{formatCurrency(total)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Pagamento</span>
              <span className="text-white">{paymentMethodLabel(paymentMethod)}</span>
            </div>
            {paymentMethod === 'cash' && changeAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-slate-400">Troco</span>
                <span className="text-green-400 font-medium">{formatCurrency(changeAmount)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-surface-border pt-2 mt-1">
              <span className="text-slate-400">{cart.length} {cart.length === 1 ? 'item' : 'itens'}</span>
              <span className="text-slate-400 text-xs">{formatDateTime(new Date().toISOString())}</span>
            </div>
          </div>

          {/* Status de impressão */}
          {status && (
            <p className={`text-xs px-3 py-2 rounded-lg ${
              status.startsWith('Erro')
                ? 'bg-red-900/30 text-red-400'
                : 'bg-green-900/30 text-green-400'
            }`}>
              {status}
            </p>
          )}

          {/* Ações */}
          <div className="space-y-2">
            <button
              onClick={handlePrint}
              disabled={printing}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
            >
              <Printer size={16} />
              {printing ? 'Abrindo impressão...' : 'Imprimir Comprovante'}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePreview}
                className="flex items-center justify-center gap-2 bg-surface-input hover:bg-slate-600 text-slate-300 font-medium py-2 rounded-xl transition-colors text-sm"
              >
                <Eye size={14} /> Visualizar
              </button>
              <button
                onClick={handleSavePdf}
                disabled={savingPdf}
                className="flex items-center justify-center gap-2 bg-surface-input hover:bg-slate-600 disabled:opacity-50 text-slate-300 font-medium py-2 rounded-xl transition-colors text-sm"
              >
                <FileDown size={14} />
                {savingPdf ? 'Salvando...' : 'Salvar PDF'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full text-slate-500 hover:text-slate-300 text-sm py-1.5 transition-colors"
            >
              Fechar sem imprimir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
