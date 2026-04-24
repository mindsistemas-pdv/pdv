import { ipcMain } from 'electron'
import { productRepository } from '../repositories/productRepository'
import type { CreateProductDTO, IpcResponse, Product, UpdateProductDTO } from '../types'

export function registerProductHandlers(): void {
  ipcMain.handle('products:getAll', async (): Promise<IpcResponse<Product[]>> => {
    try {
      return { success: true, data: productRepository.findAll() }
    } catch (err) {
      console.error('[products:getAll]', err)
      return { success: false, error: 'Erro ao buscar produtos.' }
    }
  })

  ipcMain.handle('products:getByBarcode', async (_e, barcode: string): Promise<IpcResponse<Product>> => {
    try {
      const product = productRepository.findByBarcode(barcode)
      if (!product) return { success: false, error: 'Produto não encontrado.' }
      return { success: true, data: product }
    } catch (err) {
      console.error('[products:getByBarcode]', err)
      return { success: false, error: 'Erro ao buscar produto.' }
    }
  })

  ipcMain.handle('products:getByCode', async (_e, code: string): Promise<IpcResponse<Product>> => {
    try {
      const product = productRepository.findByCode(code)
      if (!product) return { success: false, error: 'Produto não encontrado.' }
      return { success: true, data: product }
    } catch (err) {
      console.error('[products:getByCode]', err)
      return { success: false, error: 'Erro ao buscar produto.' }
    }
  })

  ipcMain.handle('products:create', async (_e, data: CreateProductDTO): Promise<IpcResponse<Product>> => {
    try {
      const product = productRepository.create(data)
      return { success: true, data: product }
    } catch (err: unknown) {
      console.error('[products:create]', err)
      const msg = err instanceof Error && err.message.includes('UNIQUE')
        ? 'Código interno já cadastrado.'
        : 'Erro ao criar produto.'
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('products:update', async (_e, id: number, data: UpdateProductDTO): Promise<IpcResponse<Product>> => {
    try {
      const product = productRepository.update(id, data)
      if (!product) return { success: false, error: 'Produto não encontrado.' }
      return { success: true, data: product }
    } catch (err) {
      console.error('[products:update]', err)
      return { success: false, error: 'Erro ao atualizar produto.' }
    }
  })

  ipcMain.handle('products:delete', async (_e, id: number): Promise<IpcResponse> => {
    try {
      productRepository.delete(id)
      return { success: true }
    } catch (err) {
      console.error('[products:delete]', err)
      return { success: false, error: 'Erro ao excluir produto.' }
    }
  })
}
