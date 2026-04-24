/**
 * Utilitários de formatação para o PDV.
 */

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day:    '2-digit',
    month:  '2-digit',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function paymentMethodLabel(method: string): string {
  const labels: Record<string, string> = {
    cash:        'Dinheiro',
    card_debit:  'Cartão Débito',
    card_credit: 'Cartão Crédito',
    pix:         'PIX',
  }
  return labels[method] ?? method
}
