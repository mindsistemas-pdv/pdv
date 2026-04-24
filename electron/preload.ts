import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Auth
  login: (username: string, password: string) =>
    ipcRenderer.invoke('auth:login', username, password),

  // Produtos
  getProducts: () => ipcRenderer.invoke('products:getAll'),
  getProductByBarcode: (barcode: string) => ipcRenderer.invoke('products:getByBarcode', barcode),
  getProductByCode: (code: string) => ipcRenderer.invoke('products:getByCode', code),
  createProduct: (product: unknown) => ipcRenderer.invoke('products:create', product),
  updateProduct: (id: number, product: unknown) => ipcRenderer.invoke('products:update', id, product),
  deleteProduct: (id: number) => ipcRenderer.invoke('products:delete', id),

  // Clientes
  getCustomers: () => ipcRenderer.invoke('customers:getAll'),
  createCustomer: (customer: unknown) => ipcRenderer.invoke('customers:create', customer),
  updateCustomer: (id: number, customer: unknown) => ipcRenderer.invoke('customers:update', id, customer),
  deleteCustomer: (id: number) => ipcRenderer.invoke('customers:delete', id),

  // Usuários
  getUsers: () => ipcRenderer.invoke('users:getAll'),
  createUser: (user: unknown) => ipcRenderer.invoke('users:create', user),
  updateUser: (id: number, user: unknown) => ipcRenderer.invoke('users:update', id, user),
  toggleUserActive: (id: number, active: boolean) => ipcRenderer.invoke('users:toggleActive', id, active),

  // Caixa
  openCashRegister: (userId: number, openingAmount: number) =>
    ipcRenderer.invoke('cashRegister:open', userId, openingAmount),
  closeCashRegister: (cashRegisterId: number, closingAmount: number) =>
    ipcRenderer.invoke('cashRegister:close', cashRegisterId, closingAmount),
  getActiveCashRegister: (userId: number) =>
    ipcRenderer.invoke('cashRegister:getActive', userId),
  getCashRegisterSummary: (cashRegisterId: number) =>
    ipcRenderer.invoke('cashRegister:getSummary', cashRegisterId),
  addCashMovement: (data: unknown) =>
    ipcRenderer.invoke('cashRegister:addMovement', data),
  getCashMovements: (cashRegisterId: number) =>
    ipcRenderer.invoke('cashRegister:getMovements', cashRegisterId),

  // Vendas
  createSale: (sale: unknown) => ipcRenderer.invoke('sales:create', sale),
  getSalesByCashRegister: (cashRegisterId: number) =>
    ipcRenderer.invoke('sales:getByCashRegister', cashRegisterId),
  getSaleById: (id: number) => ipcRenderer.invoke('sales:getById', id),
  getAllSales: () => ipcRenderer.invoke('sales:getAll'),

  // Impressão
  printReceipt: (data: unknown) => ipcRenderer.invoke('print:receipt', data),
  savePdf: (data: unknown, savePath: string) => ipcRenderer.invoke('print:savePdf', data, savePath),
  previewReceipt: (data: unknown) => ipcRenderer.invoke('print:preview', data),
})
