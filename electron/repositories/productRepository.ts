import { getDatabase } from '../database/connection'
import type { Product, CreateProductDTO, UpdateProductDTO } from '../types'

/**
 * Repositório de produtos.
 * Toda interação com a tabela products passa por aqui.
 */
export const productRepository = {
  findAll(): Product[] {
    return getDatabase()
      .prepare('SELECT * FROM products WHERE active = 1 ORDER BY description')
      .all() as Product[]
  },

  findById(id: number): Product | undefined {
    return getDatabase()
      .prepare('SELECT * FROM products WHERE id = ?')
      .get(id) as Product | undefined
  },

  findByBarcode(barcode: string): Product | undefined {
    return getDatabase()
      .prepare('SELECT * FROM products WHERE barcode = ? AND active = 1')
      .get(barcode) as Product | undefined
  },

  findByCode(code: string): Product | undefined {
    return getDatabase()
      .prepare('SELECT * FROM products WHERE internal_code = ? AND active = 1')
      .get(code) as Product | undefined
  },

  create(data: CreateProductDTO): Product {
    const db = getDatabase()
    const result = db.prepare(`
      INSERT INTO products (internal_code, barcode, description, unit, sale_price, cost_price, stock_qty)
      VALUES (@internal_code, @barcode, @description, @unit, @sale_price, @cost_price, @stock_qty)
    `).run(data)

    return this.findById(result.lastInsertRowid as number)!
  },

  update(id: number, data: UpdateProductDTO): Product | undefined {
    getDatabase().prepare(`
      UPDATE products
      SET internal_code = @internal_code,
          barcode       = @barcode,
          description   = @description,
          unit          = @unit,
          sale_price    = @sale_price,
          cost_price    = @cost_price,
          stock_qty     = @stock_qty,
          updated_at    = datetime('now')
      WHERE id = @id
    `).run({ ...data, id })

    return this.findById(id)
  },

  // Soft delete — mantém histórico de vendas intacto
  delete(id: number): void {
    getDatabase()
      .prepare("UPDATE products SET active = 0 WHERE id = ?")
      .run(id)
  },
}
