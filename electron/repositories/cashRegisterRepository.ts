import { getDatabase } from '../database/connection'
import type { CashRegister, CashRegisterSummary } from '../types'

export const cashRegisterRepository = {
  findActiveByUser(userId: number): CashRegister | undefined {
    return getDatabase()
      .prepare("SELECT * FROM cash_registers WHERE user_id = ? AND status = 'open'")
      .get(userId) as CashRegister | undefined
  },

  findById(id: number): CashRegister | undefined {
    return getDatabase()
      .prepare('SELECT * FROM cash_registers WHERE id = ?')
      .get(id) as CashRegister | undefined
  },

  open(userId: number, openingAmount: number): CashRegister {
    const db = getDatabase()
    const result = db.prepare(`
      INSERT INTO cash_registers (user_id, opening_amount)
      VALUES (?, ?)
    `).run(userId, openingAmount)

    return this.findById(result.lastInsertRowid as number)!
  },

  close(id: number, closingAmount: number): CashRegister | undefined {
    getDatabase().prepare(`
      UPDATE cash_registers
      SET status = 'closed', closing_amount = ?, closed_at = datetime('now')
      WHERE id = ?
    `).run(closingAmount, id)

    return this.findById(id)
  },

  /**
   * Resumo do caixa: total de vendas por forma de pagamento.
   * Usado no fechamento para conferência.
   */
  getSummary(cashRegisterId: number): CashRegisterSummary {
    const db = getDatabase()

    const totals = db.prepare(`
      SELECT
        payment_method,
        COUNT(*)        AS qty,
        SUM(total_amount) AS total
      FROM sales
      WHERE cash_register_id = ? AND status = 'completed'
      GROUP BY payment_method
    `).all(cashRegisterId) as Array<{ payment_method: string; qty: number; total: number }>

    const grandTotal = totals.reduce((acc, row) => acc + row.total, 0)

    return { totals, grandTotal }
  },
}
