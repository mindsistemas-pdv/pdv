import { getDatabase } from '../database/connection'
import type { Customer, CreateCustomerDTO, UpdateCustomerDTO } from '../types'

export const customerRepository = {
  findAll(): Customer[] {
    return getDatabase()
      .prepare('SELECT * FROM customers WHERE active = 1 ORDER BY name')
      .all() as Customer[]
  },

  findById(id: number): Customer | undefined {
    return getDatabase()
      .prepare('SELECT * FROM customers WHERE id = ?')
      .get(id) as Customer | undefined
  },

  create(data: CreateCustomerDTO): Customer {
    const db = getDatabase()
    const result = db.prepare(`
      INSERT INTO customers (name, cpf_cnpj, phone, email)
      VALUES (@name, @cpf_cnpj, @phone, @email)
    `).run(data)
    return this.findById(result.lastInsertRowid as number)!
  },

  update(id: number, data: UpdateCustomerDTO): Customer | undefined {
    getDatabase().prepare(`
      UPDATE customers
      SET name     = @name,
          cpf_cnpj = @cpf_cnpj,
          phone    = @phone,
          email    = @email,
          updated_at = datetime('now')
      WHERE id = @id
    `).run({ ...data, id })
    return this.findById(id)
  },

  delete(id: number): void {
    getDatabase().prepare('UPDATE customers SET active = 0 WHERE id = ?').run(id)
  },
}
