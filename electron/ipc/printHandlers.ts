import { ipcMain, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import type { IpcResponse } from '../types'

/**
 * Gera o HTML do comprovante não fiscal.
 * Layout simples, compatível com impressoras térmicas 80mm e impressoras comuns.
 */
function buildReceiptHtml(data: ReceiptData): string {
  const items = data.items.map(item => `
    <tr>
      <td class="desc">${item.description}</td>
      <td class="qty">${item.quantity}x</td>
      <td class="price">R$ ${item.unitPrice.toFixed(2)}</td>
      <td class="total">R$ ${item.totalAmount.toFixed(2)}</td>
    </tr>
  `).join('')

  const changeRow = data.paymentMethod === 'cash' && data.changeAmount > 0
    ? `<tr><td colspan="3">Troco</td><td>R$ ${data.changeAmount.toFixed(2)}</td></tr>`
    : ''

  const paymentLabels: Record<string, string> = {
    cash:        'Dinheiro',
    card_debit:  'Cartão Débito',
    card_credit: 'Cartão Crédito',
    pix:         'PIX',
  }

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <title>Comprovante #${data.saleId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 80mm;
      margin: 0 auto;
      padding: 4mm;
      color: #000;
      background: #fff;
    }
    .center { text-align: center; }
    .bold   { font-weight: bold; }
    .large  { font-size: 16px; }
    .divider {
      border-top: 1px dashed #000;
      margin: 6px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th {
      text-align: left;
      font-size: 10px;
      border-bottom: 1px solid #000;
      padding-bottom: 3px;
      margin-bottom: 3px;
    }
    td { padding: 2px 0; vertical-align: top; }
    td.desc  { width: 45%; }
    td.qty   { width: 12%; text-align: center; }
    td.price { width: 20%; text-align: right; }
    td.total { width: 23%; text-align: right; }
    .totals td { padding: 1px 0; }
    .totals td:first-child { font-weight: normal; }
    .totals td:last-child  { text-align: right; }
    .grand-total td { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 4px; }
    .footer { margin-top: 8px; font-size: 10px; }
    @media print {
      body { width: 100%; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center bold large">${data.companyName}</div>
  ${data.companyDoc ? `<div class="center">CNPJ: ${data.companyDoc}</div>` : ''}
  ${data.companyAddress ? `<div class="center">${data.companyAddress}</div>` : ''}

  <div class="divider"></div>

  <div class="center bold">COMPROVANTE NÃO FISCAL</div>
  <div>Venda #${data.saleId}</div>
  <div>Data: ${data.date}</div>
  <div>Operador: ${data.operatorName}</div>

  <div class="divider"></div>

  <table>
    <thead>
      <tr>
        <th>Produto</th>
        <th style="text-align:center">Qtd</th>
        <th style="text-align:right">Unit.</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>${items}</tbody>
  </table>

  <div class="divider"></div>

  <table class="totals">
    ${data.discountAmount > 0 ? `<tr><td>Desconto</td><td>- R$ ${data.discountAmount.toFixed(2)}</td></tr>` : ''}
    <tr class="grand-total">
      <td>TOTAL</td>
      <td>R$ ${data.totalAmount.toFixed(2)}</td>
    </tr>
    <tr><td>Pagamento</td><td>${paymentLabels[data.paymentMethod] ?? data.paymentMethod}</td></tr>
    <tr><td>Valor pago</td><td>R$ ${data.amountPaid.toFixed(2)}</td></tr>
    ${changeRow}
  </table>

  <div class="divider"></div>

  <div class="center footer">
    ${data.footerMessage || 'Obrigado pela preferência!'}
  </div>
  <div class="center footer" style="margin-top:4px; font-size:9px;">
    Este documento não tem valor fiscal.
  </div>
</body>
</html>`
}

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

export function registerPrintHandlers(): void {
  /**
   * Abre uma janela de impressão com o comprovante.
   * O usuário pode imprimir em qualquer impressora instalada no Windows,
   * incluindo impressoras térmicas com driver instalado.
   */
  ipcMain.handle('print:receipt', async (_e, data: ReceiptData): Promise<IpcResponse> => {
    try {
      const html = buildReceiptHtml(data)

      const win = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        title: `Comprovante #${data.saleId}`,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      })

      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

      // Abre o diálogo de impressão nativo do sistema
      win.webContents.print(
        { silent: false, printBackground: true },
        (success, reason) => {
          win.close()
          if (!success) console.warn('[print:receipt] Impressão cancelada ou falhou:', reason)
        }
      )

      return { success: true }
    } catch (err) {
      console.error('[print:receipt]', err)
      return { success: false, error: 'Erro ao imprimir comprovante.' }
    }
  })

  /**
   * Gera um PDF do comprovante e salva em disco.
   * Abre o diálogo de salvar arquivo para o usuário escolher o destino.
   */
  ipcMain.handle('print:savePdf', async (_e, data: ReceiptData, suggestedName: string): Promise<IpcResponse<string>> => {
    try {
      const { dialog, app } = await import('electron')
      const defaultPath = path.join(app.getPath('documents'), suggestedName)

      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Salvar comprovante como PDF',
        defaultPath,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      })

      if (canceled || !filePath) {
        return { success: false, error: 'Operação cancelada.' }
      }

      const html = buildReceiptHtml(data)

      const win = new BrowserWindow({
        width: 400,
        height: 600,
        show: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      })

      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      await new Promise(resolve => setTimeout(resolve, 300))

      const pdfBuffer = await win.webContents.printToPDF({
        pageSize: { width: 80000, height: 297000 },
        printBackground: true,
        margins: { marginType: 'none' },
      })

      win.close()
      fs.writeFileSync(filePath, pdfBuffer)

      return { success: true, data: filePath }
    } catch (err) {
      console.error('[print:savePdf]', err)
      return { success: false, error: 'Erro ao gerar PDF.' }
    }
  })

  /**
   * Abre uma prévia do comprovante em janela separada.
   * Útil para conferir antes de imprimir.
   */
  ipcMain.handle('print:preview', async (_e, data: ReceiptData): Promise<IpcResponse> => {
    try {
      const html = buildReceiptHtml(data)

      const win = new BrowserWindow({
        width: 420,
        height: 700,
        title: `Comprovante #${data.saleId}`,
        autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      })

      await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
      win.show()

      return { success: true }
    } catch (err) {
      console.error('[print:preview]', err)
      return { success: false, error: 'Erro ao abrir prévia.' }
    }
  })
}
