import { getDatabase } from '../database/connection'
import type { CashMovement, CreateCashMovementDTO } from '../types'

export const cashMovementRepository = {
  create(data: CreateCashMovementDTO): CashMovement {
    const db = getDatabase()
    const result = db.prepare(`
      INSERT INTO cash_movements (cash_register_id, user_id, type, amount, description)
      VALUES (@cashRegisterId, @userId, @type, @amount, @description)
    `).run({
      cashRegisterId: data.cashRegisterId,
      userId:         data.userId,
      type:           data.type,
      amount:         data.amount,
      description:    data.description ?? null,
    })
    return db.prepare('SELECT * FROM cash_movements WHERE id = ?')
      .get(result.lastInsertRowid) as CashMovement
  },

  findByCashRegister(cashRegisterId: number): CashMovement[] {
    return getDatabase()
      .prepare('SELECT * FROM cash_movements WHERE cash_register_id = ? ORDER BY created_at DESC')
      .all(cashRegisterId) as CashMovement[]
  },
}
