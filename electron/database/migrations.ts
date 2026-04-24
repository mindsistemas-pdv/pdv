import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'

/**
 * Migrations do banco local.
 * Cada migration é idempotente (CREATE TABLE IF NOT EXISTS).
 * Em versões futuras, adicionar sistema de versionamento de schema.
 */
export function runMigrations(db: Database.Database): void {
  console.log('[DB] Executando migrations...')

  db.exec(`
    -- Usuários do sistema
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      name          TEXT    NOT NULL,
      username      TEXT    NOT NULL UNIQUE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL DEFAULT 'operator', -- admin | operator | manager
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Produtos
    CREATE TABLE IF NOT EXISTS products (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      internal_code TEXT    NOT NULL UNIQUE,
      barcode       TEXT,
      description   TEXT    NOT NULL,
      unit          TEXT    NOT NULL DEFAULT 'UN',
      sale_price    REAL    NOT NULL DEFAULT 0,
      cost_price    REAL    NOT NULL DEFAULT 0,
      stock_qty     REAL    NOT NULL DEFAULT 0,
      active        INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Caixas
    CREATE TABLE IF NOT EXISTS cash_registers (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id        INTEGER NOT NULL REFERENCES users(id),
      opening_amount REAL    NOT NULL DEFAULT 0,
      closing_amount REAL,
      opened_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      closed_at      TEXT,
      status         TEXT    NOT NULL DEFAULT 'open' -- open | closed
    );

    -- Vendas
    CREATE TABLE IF NOT EXISTS sales (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      cash_register_id INTEGER NOT NULL REFERENCES cash_registers(id),
      user_id          INTEGER NOT NULL REFERENCES users(id),
      total_amount     REAL    NOT NULL DEFAULT 0,
      discount_amount  REAL    NOT NULL DEFAULT 0,
      payment_method   TEXT    NOT NULL, -- cash | card_debit | card_credit | pix
      amount_paid      REAL    NOT NULL DEFAULT 0,
      change_amount    REAL    NOT NULL DEFAULT 0,
      status           TEXT    NOT NULL DEFAULT 'completed', -- completed | cancelled
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Itens da venda
    CREATE TABLE IF NOT EXISTS sale_items (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id         INTEGER NOT NULL REFERENCES sales(id),
      product_id      INTEGER NOT NULL REFERENCES products(id),
      description     TEXT    NOT NULL, -- snapshot da descrição no momento da venda
      quantity        REAL    NOT NULL,
      unit_price      REAL    NOT NULL, -- snapshot do preço no momento da venda
      discount_amount REAL    NOT NULL DEFAULT 0,
      total_amount    REAL    NOT NULL
    );
  `)

  // Seed: cria usuário admin padrão se não existir
  seedDefaultUser(db)

  console.log('[DB] Migrations concluídas.')
}

function seedDefaultUser(db: Database.Database): void {
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin')
  if (!existing) {
    const hash = bcrypt.hashSync('admin123', 10)
    db.prepare(`
      INSERT INTO users (name, username, password_hash, role)
      VALUES (?, ?, ?, ?)
    `).run('Administrador', 'admin', hash, 'admin')
    console.log('[DB] Usuário admin criado (admin / admin123)')
  }
}
