import { ipcMain } from 'electron'
import { cashRegisterRepository } from '../repositories/cashRegisterRepository'
import type { CashRegister, CashRegisterSummary, IpcResponse } from '../types'

export function registerCashRegisterHandlers(): void {
  ipcMain.handle('cashRegister:open', async (_e, userId: number, openingAmount: number): Promise<IpcResponse<CashRegister>> => {
    try {
      // Regra: não abrir dois caixas para o mesmo operador
      const existing = cashRegisterRepository.findActiveByUser(userId)
      if (existing) {
        return { success: false, error: 'Já existe um caixa aberto para este operador.' }
      }

      const cashRegister = cashRegisterRepository.open(userId, openingAmount)
      return { success: true, data: cashRegister }
    } catch (err) {
      console.error('[cashRegister:open]', err)
      return { success: false, error: 'Erro ao abrir caixa.' }
    }
  })

  ipcMain.handle('cashRegister:close', async (_e, cashRegisterId: number, closingAmount: number): Promise<IpcResponse<CashRegister>> => {
    try {
      const cashRegister = cashRegisterRepository.close(cashRegisterId, closingAmount)
      return { success: true, data: cashRegister }
    } catch (err) {
      console.error('[cashRegister:close]', err)
      return { success: false, error: 'Erro ao fechar caixa.' }
    }
  })

  ipcMain.handle('cashRegister:getActive', async (_e, userId: number): Promise<IpcResponse<CashRegister>> => {
    try {
      const cashRegister = cashRegisterRepository.findActiveByUser(userId)
      return { success: true, data: cashRegister }
    } catch (err) {
      console.error('[cashRegister:getActive]', err)
      return { success: false, error: 'Erro ao buscar caixa.' }
    }
  })

  ipcMain.handle('cashRegister:getSummary', async (_e, cashRegisterId: number): Promise<IpcResponse<CashRegisterSummary>> => {
    try {
      const summary = cashRegisterRepository.getSummary(cashRegisterId)
      return { success: true, data: summary }
    } catch (err) {
      console.error('[cashRegister:getSummary]', err)
      return { success: false, error: 'Erro ao buscar resumo do caixa.' }
    }
  })
}
