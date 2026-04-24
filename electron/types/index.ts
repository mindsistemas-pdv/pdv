// ─── Usuário ────────────────────────────────────────────────────────────────

export interface User {
  id: number
  name: string
  username: string
  password_hash: string
  role: 'admin' | 'operator' | 'manager'
  active: number
  created_at: string
}

// ─── Produto ─────────────────────────────────────────────────────────────────

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

export interface CreateProductDTO {
  internal_code: string
  barcode?: string | null
  description: string
  unit: string
  sale_price: number
  cost_price: number
  stock_qty: number
}

export type UpdateProductDTO = CreateProductDTO

// ─── Caixa ───────────────────────────────────────────────────────────────────

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

// ─── Venda ───────────────────────────────────────────────────────────────────

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

export interface CreateSaleDTO {
  cashRegisterId: number
  userId: number
  totalAmount: number
  discountAmount?: number
  paymentMethod: PaymentMethod
  amountPaid: number
  changeAmount?: number
  items: CreateSaleItemDTO[]
}

export interface CreateSaleItemDTO {
  productId: number
  description: string
  quantity: number
  unitPrice: number
  discountAmount?: number
  totalAmount: number
}

// ─── Respostas IPC ───────────────────────────────────────────────────────────

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

export interface CreateCustomerDTO {
  name: string
  cpf_cnpj?: string | null
  phone?: string | null
  email?: string | null
}

export type UpdateCustomerDTO = CreateCustomerDTO

// ─── Movimentos de caixa ─────────────────────────────────────────────────────

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

export interface CreateCashMovementDTO {
  cashRegisterId: number
  userId: number
  type: CashMovementType
  amount: number
  description?: string
}

// ─── Usuário (DTOs de criação/edição) ────────────────────────────────────────

export interface CreateUserDTO {
  name: string
  username: string
  password: string
  role: 'admin' | 'operator' | 'manager'
}

export interface UpdateUserDTO {
  name: string
  username: string
  role: 'admin' | 'operator' | 'manager'
  password?: string
}
