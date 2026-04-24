import { getDatabase } from '../database/connection'
import type { Sale, SaleItem, CreateSaleDTO } from '../types'

export const saleRepository = {
  /**
   * Cria uma venda completa com seus itens em uma única transação.
   * Transação garante que ou tudo é salvo ou nada é — nunca venda sem itens.
   */
  create(data: CreateSaleDTO): Sale {
    const db = getDatabase()

    const insertSale = db.prepare(`
      INSERT INTO sales (cash_register_id, user_id, total_amount, discount_amount, payment_method, amount_paid, change_amount)
      VALUES (@cash_register_id, @user_id, @total_amount, @discount_amount, @payment_method, @amount_paid, @change_amount)
    `)

    const insertItem = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, description, quantity, unit_price, discount_amount, total_amount)
      VALUES (@sale_id, @product_id, @description, @quantity, @unit_price, @discount_amount, @total_amount)
    `)

    const transaction = db.transaction((saleData: CreateSaleDTO) => {
      const result = insertSale.run({
        cash_register_id: saleData.cashRegisterId,
        user_id:          saleData.userId,
        total_amount:     saleData.totalAmount,
        discount_amount:  saleData.discountAmount ?? 0,
        payment_method:   saleData.paymentMethod,
        amount_paid:      saleData.amountPaid,
        change_amount:    saleData.changeAmount ?? 0,
      })

      const saleId = result.lastInsertRowid as number

      for (const item of saleData.items) {
        insertItem.run({
          sale_id:         saleId,
          product_id:      item.productId,
          description:     item.description,
          quantity:        item.quantity,
          unit_price:      item.unitPrice,
          discount_amount: item.discountAmount ?? 0,
          total_amount:    item.totalAmount,
        })
      }

      return saleId
    })

    const saleId = transaction(data) as number
    return this.findById(saleId)!
  },

  findById(id: number): Sale | undefined {
    const db = getDatabase()
    const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id) as Sale | undefined
    if (!sale) return undefined

    sale.items = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id) as SaleItem[]
    return sale
  },

  findByCashRegister(cashRegisterId: number): Sale[] {
    return getDatabase()
      .prepare('SELECT * FROM sales WHERE cash_register_id = ? ORDER BY created_at DESC')
      .all(cashRegisterId) as Sale[]
  },

  findAll(): Sale[] {
    return getDatabase()
      .prepare('SELECT * FROM sales ORDER BY created_at DESC LIMIT 500')
      .all() as Sale[]
  },
}
