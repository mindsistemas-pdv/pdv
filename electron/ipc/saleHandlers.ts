import { ipcMain } from 'electron'
import { saleRepository } from '../repositories/saleRepository'
import type { CreateSaleDTO, IpcResponse, Sale } from '../types'

export function registerSaleHandlers(): void {
  ipcMain.handle('sales:create', async (_e, data: CreateSaleDTO): Promise<IpcResponse<Sale>> => {
    try {
      if (!data.items || data.items.length === 0) {
        return { success: false, error: 'A venda deve ter pelo menos um item.' }
      }

      const sale = saleRepository.create(data)
      return { success: true, data: sale }
    } catch (err) {
      console.error('[sales:create]', err)
      return { success: false, error: 'Erro ao registrar venda.' }
    }
  })

  ipcMain.handle('sales:getByCashRegister', async (_e, cashRegisterId: number): Promise<IpcResponse<Sale[]>> => {
    try {
      const sales = saleRepository.findByCashRegister(cashRegisterId)
      return { success: true, data: sales }
    } catch (err) {
      console.error('[sales:getByCashRegister]', err)
      return { success: false, error: 'Erro ao buscar vendas.' }
    }
  })
}
