import { contextBridge, ipcRenderer } from 'electron'

/**
 * Preload: expõe uma API segura para o renderer via contextBridge.
 * O renderer NUNCA acessa Node.js diretamente — tudo passa por aqui.
 * Isso garante segurança e isolamento entre processos.
 */
contextBridge.exposeInMainWorld('api', {
  // Auth
  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', username, password),

  // Produtos
  getProducts: () => ipcRenderer.invoke('products:getAll'),
  getProductByBarcode: (barcode: string) =>
    ipcRenderer.invoke('products:getByBarcode', barcode),
  getProductByCode: (code: string) =>
    ipcRenderer.invoke('products:getByCode', code),
  createProduct: (product: unknown) =>
    ipcRenderer.invoke('products:create', product),
  updateProduct: (id: number, product: unknown) =>
    ipcRenderer.invoke('products:update', id, product),
  deleteProduct: (id: number) =>
    ipcRenderer.invoke('products:delete', id),

  // Caixa
  openCashRegister: (userId: number, openingAmount: number) =>
    ipcRenderer.invoke('cashRegister:open', userId, openingAmount),
  closeCashRegister: (cashRegisterId: number, closingAmount: number) =>
    ipcRenderer.invoke('cashRegister:close', cashRegisterId, closingAmount),
  getActiveCashRegister: (userId: number) =>
    ipcRenderer.invoke('cashRegister:getActive', userId),
  getCashRegisterSummary: (cashRegisterId: number) =>
    ipcRenderer.invoke('cashRegister:getSummary', cashRegisterId),

  // Vendas
  createSale: (sale: unknown) => ipcRenderer.invoke('sales:create', sale),
  getSalesByCashRegister: (cashRegisterId: number) =>
    ipcRenderer.invoke('sales:getByCashRegister', cashRegisterId),
})
