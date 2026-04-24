import { ipcMain } from 'electron'
import { customerRepository } from '../repositories/customerRepository'
import type { CreateCustomerDTO, Customer, IpcResponse, UpdateCustomerDTO } from '../types'

export function registerCustomerHandlers(): void {
  ipcMain.handle('customers:getAll', async (): Promise<IpcResponse<Customer[]>> => {
    try {
      return { success: true, data: customerRepository.findAll() }
    } catch (err) {
      console.error('[customers:getAll]', err)
      return { success: false, error: 'Erro ao buscar clientes.' }
    }
  })

  ipcMain.handle('customers:create', async (_e, data: CreateCustomerDTO): Promise<IpcResponse<Customer>> => {
    try {
      return { success: true, data: customerRepository.create(data) }
    } catch (err) {
      console.error('[customers:create]', err)
      return { success: false, error: 'Erro ao criar cliente.' }
    }
  })

  ipcMain.handle('customers:update', async (_e, id: number, data: UpdateCustomerDTO): Promise<IpcResponse<Customer>> => {
    try {
      const customer = customerRepository.update(id, data)
      if (!customer) return { success: false, error: 'Cliente não encontrado.' }
      return { success: true, data: customer }
    } catch (err) {
      console.error('[customers:update]', err)
      return { success: false, error: 'Erro ao atualizar cliente.' }
    }
  })

  ipcMain.handle('customers:delete', async (_e, id: number): Promise<IpcResponse> => {
    try {
      customerRepository.delete(id)
      return { success: true }
    } catch (err) {
      console.error('[customers:delete]', err)
      return { success: false, error: 'Erro ao excluir cliente.' }
    }
  })
}
