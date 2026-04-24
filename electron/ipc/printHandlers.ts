import { ipcMain, BrowserWindow } from 'electron'
import path from 'path'
import fs from 'fs'
import os from 'os'
import type { IpcResponse } from '../types'

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

const PAYMENT_LABELS: Record<string, string> = {
  cash:        'Dinheiro',
  card_debit:  'Cartão Débito',
  card_credit: 'Cartão Crédito',
  pix:         'PIX',
}

function buildReceiptHtml(data: ReceiptData): string {
  const items = data.items.map(item => `
    <tr>
      <td class="desc">${item.description}</td>
      <td class="qty">${item.quantity}x</td>
      <td class="price">R$&nbsp;${item.unitPrice.toFixed(2)}</td>
      <td class="total">R$&nbsp;${item.totalAmount.toFixed(2)}</td>
    </tr>`).join('')

  const changeRow = data.paymentMethod === 'cash' && data.changeAmount > 0
    ? `<tr><td colspan="3">Troco</td><td>R$&nbsp;${data.changeAmount.toFixed(2)}</td></tr>`
    : ''

  const discountRow = data.discountAmount > 0
    ? `<tr><td colspan="3">Desconto</td><td>- R$&nbsp;${data.discountAmount.toFixed(2)}</td></tr>`
    : ''

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Comprovante #${data.saleId}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    font-family: 'Courier New', Courier, monospace;
    font-size: 11px;
    width: 72mm;
    padding: 3mm 4mm;
    color: #000 !important;
    background: #fff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .center { text-align: center; }
  .bold   { font-weight: bold; }
  .large  { font-size: 15px; }
  .divider { border-top: 1px dashed #000; margin: 5px 0; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 9px; border-bottom: 1px solid #000; padding-bottom: 2px; }
  td { padding: 1px 0; vertical-align: top; font-size: 11px; }
  td.desc  { width: 44%; }
  td.qty   { width: 10%; text-align: center; }
  td.price { width: 22%; text-align: right; }
  td.total { width: 24%; text-align: right; }
  .totals td:last-child { text-align: right; }
  .grand-total td {
    font-weight: bold;
    font-size: 13px;
    border-top: 1px solid #000;
    padding-top: 3px;
    margin-top: 2px;
  }
  .footer { margin-top: 6px; font-size: 9px; text-align: center; }
  @media print {
    @page { margin: 0; size: 80mm auto; }
    body { width: 100%; }
  }
</style>
</head>
<body>
  <div class="center bold large">${data.companyName}</div>
  ${data.companyDoc     ? `<div class="center">CNPJ: ${data.companyDoc}</div>` : ''}
  ${data.companyAddress ? `<div class="center">${data.companyAddress}</div>`   : ''}

  <div class="divider"></div>
  <div class="center bold">COMPROVANTE NÃO FISCAL</div>
  <div>Venda: #${data.saleId}</div>
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

  <table>
    <tbody>
      ${discountRow}
      <tr class="grand-total">
        <td colspan="3">TOTAL</td>
        <td>R$&nbsp;${data.totalAmount.toFixed(2)}</td>
      </tr>
      <tr>
        <td colspan="3">Pagamento</td>
        <td>${PAYMENT_LABELS[data.paymentMethod] ?? data.paymentMethod}</td>
      </tr>
      <tr>
        <td colspan="3">Valor pago</td>
        <td>R$&nbsp;${data.amountPaid.toFixed(2)}</td>
      </tr>
      ${changeRow}
    </tbody>
  </table>

  <div class="divider"></div>
  <div class="footer">${data.footerMessage ?? 'Obrigado pela preferência!'}</div>
  <div class="footer" style="margin-top:3px;">Este documento não tem valor fiscal.</div>
</body>
</html>`
}

/**
 * Salva o HTML em um arquivo temporário e retorna o caminho file://.
 * Mais confiável que data: URLs para o printToPDF do Electron.
 */
function writeTempHtml(html: string, saleId: number): string {
  const tmpFile = path.join(os.tmpdir(), `mindsys-receipt-${saleId}-${Date.now()}.html`)
  fs.writeFileSync(tmpFile, html, 'utf-8')
  return tmpFile
}

/** Aguarda a página terminar de carregar completamente. */
function waitForLoad(win: BrowserWindow): Promise<void> {
  return new Promise(resolve => {
    if (win.webContents.isLoading()) {
      win.webContents.once('did-finish-load', () => resolve())
    } else {
      resolve()
    }
  })
}

export function registerPrintHandlers(): void {

  ipcMain.handle('print:receipt', async (_e, data: ReceiptData): Promise<IpcResponse> => {
    try {
      const html    = buildReceiptHtml(data)
      const tmpFile = writeTempHtml(html, data.saleId)

      const win = new BrowserWindow({
        width: 400, height: 600,
        show: false,
        title: `Comprovante #${data.saleId}`,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      })

      await win.loadFile(tmpFile)

      win.webContents.print({ silent: false, printBackground: true }, (success, reason) => {
        win.close()
        fs.unlink(tmpFile, () => {})
        if (!success) console.warn('[print:receipt] Cancelado ou falhou:', reason)
      })

      return { success: true }
    } catch (err) {
      console.error('[print:receipt]', err)
      return { success: false, error: 'Erro ao imprimir comprovante.' }
    }
  })

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

      const html    = buildReceiptHtml(data)
      const tmpFile = writeTempHtml(html, data.saleId)

      const win = new BrowserWindow({
        width: 400, height: 600,
        show: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      })

      await win.loadFile(tmpFile)
      await waitForLoad(win)

      // Aguarda mais um tick para garantir que o CSS foi aplicado
      await new Promise(resolve => setTimeout(resolve, 500))

      const pdfBuffer = await win.webContents.printToPDF({
        pageSize:        { width: 80000, height: 500000 }, // 80mm x altura automática (em microns)
        printBackground: true,
        margins:         { marginType: 'none' },
      })

      win.close()
      fs.unlink(tmpFile, () => {})
      fs.writeFileSync(filePath, pdfBuffer)

      return { success: true, data: filePath }
    } catch (err) {
      console.error('[print:savePdf]', err)
      return { success: false, error: 'Erro ao gerar PDF.' }
    }
  })

  ipcMain.handle('print:preview', async (_e, data: ReceiptData): Promise<IpcResponse> => {
    try {
      const html    = buildReceiptHtml(data)
      const tmpFile = writeTempHtml(html, data.saleId)

      const win = new BrowserWindow({
        width: 420, height: 700,
        title: `Comprovante #${data.saleId}`,
        autoHideMenuBar: true,
        webPreferences: { nodeIntegration: false, contextIsolation: true },
      })

      await win.loadFile(tmpFile)
      win.show()

      // Remove o arquivo temporário quando a janela fechar
      win.on('closed', () => fs.unlink(tmpFile, () => {}))

      return { success: true }
    } catch (err) {
      console.error('[print:preview]', err)
      return { success: false, error: 'Erro ao abrir prévia.' }
    }
  })
}
