// Tipos espelhados do processo principal para uso no renderer

export interface User {
  id: number
  name: string
  username: string
  role: 'admin' | 'operator' | 'manager'
  active: number
  created_at: string
}

export interface Product {
  id: number
  internal_code: string
  barcode: string | null
  description: string
  unit: string
  sale_price: number
  cost_price: number
  stock_qty: number
  active: number
  created_at: string
  updated_at: string
}

export interface CashRegister {
  id: number
  user_id: number
  opening_amount: number
  closing_amount: number | null
  opened_at: string
  closed_at: string | null
  status: 'open' | 'closed'
}

export interface CashRegisterSummary {
  totals: Array<{
    payment_method: string
    qty: number
    total: number
  }>
  grandTotal: number
}

export type PaymentMethod = 'cash' | 'card_debit' | 'card_credit' | 'pix'

export interface Sale {
  id: number
  cash_register_id: number
  user_id: number
  total_amount: number
  discount_amount: number
  payment_method: PaymentMethod
  amount_paid: number
  change_amount: number
  status: 'completed' | 'cancelled'
  created_at: string
  items?: SaleItem[]
}

export interface SaleItem {
  id: number
  sale_id: number
  product_id: number
  description: string
  quantity: number
  unit_price: number
  discount_amount: number
  total_amount: number
}

// Item no carrinho (antes de salvar)
export interface CartItem {
  productId: number
  description: string
  quantity: number
  unitPrice: number
  totalAmount: number
}

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// ─── Cliente ─────────────────────────────────────────────────────────────────

export interface Customer {
  id: number
  name: string
  cpf_cnpj: string | null
  phone: string | null
  email: string | null
  active: number
  created_at: string
  updated_at: string
}

// ─── Movimento de caixa ──────────────────────────────────────────────────────

export type CashMovementType = 'withdrawal' | 'supply'

export interface CashMovement {
  id: number
  cash_register_id: number
  user_id: number
  type: CashMovementType
  amount: number
  description: string | null
  created_at: string
}

// ─── Tipagem da API exposta pelo preload ─────────────────────────────────────

export interface ElectronAPI {
  login: (username: string, password: string) => Promise<IpcResponse<User>>
  getProducts: () => Promise<IpcResponse<Product[]>>
  getProductByBarcode: (barcode: string) => Promise<IpcResponse<Product>>
  getProductByCode: (code: string) => Promise<IpcResponse<Product>>
  createProduct: (product: unknown) => Promise<IpcResponse<Product>>
  updateProduct: (id: number, product: unknown) => Promise<IpcResponse<Product>>
  deleteProduct: (id: number) => Promise<IpcResponse>
  getCustomers: () => Promise<IpcResponse<Customer[]>>
  createCustomer: (customer: unknown) => Promise<IpcResponse<Customer>>
  updateCustomer: (id: number, customer: unknown) => Promise<IpcResponse<Customer>>
  deleteCustomer: (id: number) => Promise<IpcResponse>
  getUsers: () => Promise<IpcResponse<User[]>>
  createUser: (user: unknown) => Promise<IpcResponse<User>>
  updateUser: (id: number, user: unknown) => Promise<IpcResponse<User>>
  toggleUserActive: (id: number, active: boolean) => Promise<IpcResponse>
  openCashRegister: (userId: number, openingAmount: number) => Promise<IpcResponse<CashRegister>>
  closeCashRegister: (cashRegisterId: number, closingAmount: number) => Promise<IpcResponse<CashRegister>>
  getActiveCashRegister: (userId: number) => Promise<IpcResponse<CashRegister>>
  getCashRegisterSummary: (cashRegisterId: number) => Promise<IpcResponse<CashRegisterSummary>>
  addCashMovement: (data: unknown) => Promise<IpcResponse<CashMovement>>
  getCashMovements: (cashRegisterId: number) => Promise<IpcResponse<CashMovement[]>>
  createSale: (sale: unknown) => Promise<IpcResponse<Sale>>
  getSalesByCashRegister: (cashRegisterId: number) => Promise<IpcResponse<Sale[]>>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
