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
      description     TEXT    NOT NULL,
      quantity        REAL    NOT NULL,
      unit_price      REAL    NOT NULL,
      discount_amount REAL    NOT NULL DEFAULT 0,
      total_amount    REAL    NOT NULL
    );

    -- Clientes
    CREATE TABLE IF NOT EXISTS customers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT    NOT NULL,
      cpf_cnpj   TEXT,
      phone      TEXT,
      email      TEXT,
      active     INTEGER NOT NULL DEFAULT 1,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    -- Movimentos de caixa (sangria e suprimento)
    CREATE TABLE IF NOT EXISTS cash_movements (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      cash_register_id INTEGER NOT NULL REFERENCES cash_registers(id),
      user_id          INTEGER NOT NULL REFERENCES users(id),
      type             TEXT    NOT NULL, -- withdrawal (sangria) | supply (suprimento)
      amount           REAL    NOT NULL,
      description      TEXT,
      created_at       TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `)

  // Seed: cria usuário admin padrão se não existir
  seedDefaultUser(db)

  // Seed de dados de exemplo (só roda se não houver produtos cadastrados)
  seedSampleData(db)

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

function seedSampleData(db: Database.Database): void {
  const count = (db.prepare('SELECT COUNT(*) as n FROM products').get() as { n: number }).n
  if (count > 0) return // Já tem dados, não sobrescreve

  console.log('[DB] Inserindo dados de exemplo...')

  // Usuários adicionais
  const users = [
    { name: 'Carlos Operador', username: 'carlos', password: '1234', role: 'operator' },
    { name: 'Ana Gerente',     username: 'ana',    password: '1234', role: 'manager'  },
  ]
  const insertUser = db.prepare(`
    INSERT OR IGNORE INTO users (name, username, password_hash, role) VALUES (?, ?, ?, ?)
  `)
  for (const u of users) {
    insertUser.run(u.name, u.username, bcrypt.hashSync(u.password, 10), u.role)
  }

  // Clientes
  const customers = [
    { name: 'João da Silva',     cpf_cnpj: '123.456.789-00', phone: '(11) 98765-4321', email: 'joao@email.com'    },
    { name: 'Maria Oliveira',    cpf_cnpj: '987.654.321-00', phone: '(11) 91234-5678', email: 'maria@email.com'   },
    { name: 'Pedro Santos',      cpf_cnpj: '456.789.123-00', phone: '(21) 99876-5432', email: null                },
    { name: 'Ana Costa',         cpf_cnpj: '321.654.987-00', phone: '(31) 98765-1234', email: 'ana@email.com'     },
    { name: 'Mercado Bom Preço', cpf_cnpj: '12.345.678/0001-90', phone: '(11) 3456-7890', email: 'compras@bompre.com' },
    { name: 'Lanchonete do Zé',  cpf_cnpj: '98.765.432/0001-10', phone: '(11) 2345-6789', email: null             },
    { name: 'Fernanda Lima',     cpf_cnpj: '654.321.987-00', phone: '(41) 97654-3210', email: 'fernanda@email.com'},
    { name: 'Roberto Alves',     cpf_cnpj: null,              phone: '(11) 96543-2109', email: null               },
  ]
  const insertCustomer = db.prepare(`
    INSERT OR IGNORE INTO customers (name, cpf_cnpj, phone, email) VALUES (?, ?, ?, ?)
  `)
  for (const c of customers) {
    insertCustomer.run(c.name, c.cpf_cnpj, c.phone, c.email)
  }

  // Produtos
  const products = [
    // Bebidas
    { code: '001', barcode: '7891234000001', desc: 'Água Mineral 500ml',        unit: 'UN', sale: 2.50,  cost: 1.20,  stock: 120 },
    { code: '002', barcode: '7891234000002', desc: 'Refrigerante Cola 350ml',   unit: 'UN', sale: 4.00,  cost: 2.10,  stock: 80  },
    { code: '003', barcode: '7891234000003', desc: 'Refrigerante Cola 2L',      unit: 'UN', sale: 9.90,  cost: 5.50,  stock: 40  },
    { code: '004', barcode: '7891234000004', desc: 'Suco de Laranja 1L',        unit: 'UN', sale: 7.50,  cost: 4.00,  stock: 30  },
    { code: '005', barcode: '7891234000005', desc: 'Cerveja Lata 350ml',        unit: 'UN', sale: 4.50,  cost: 2.50,  stock: 200 },
    { code: '006', barcode: '7891234000006', desc: 'Energético 250ml',          unit: 'UN', sale: 8.00,  cost: 4.50,  stock: 50  },
    // Laticínios
    { code: '010', barcode: '7891234000010', desc: 'Leite Integral 1L',         unit: 'UN', sale: 5.49,  cost: 3.20,  stock: 60  },
    { code: '011', barcode: '7891234000011', desc: 'Iogurte Natural 170g',      unit: 'UN', sale: 3.20,  cost: 1.80,  stock: 40  },
    { code: '012', barcode: '7891234000012', desc: 'Queijo Mussarela 200g',     unit: 'UN', sale: 12.90, cost: 7.50,  stock: 25  },
    { code: '013', barcode: '7891234000013', desc: 'Manteiga 200g',             unit: 'UN', sale: 8.90,  cost: 5.00,  stock: 30  },
    // Mercearia
    { code: '020', barcode: '7891234000020', desc: 'Pão Francês (unidade)',     unit: 'UN', sale: 0.75,  cost: 0.35,  stock: 200 },
    { code: '021', barcode: '7891234000021', desc: 'Pão de Forma 500g',         unit: 'UN', sale: 7.90,  cost: 4.50,  stock: 20  },
    { code: '022', barcode: '7891234000022', desc: 'Biscoito Recheado 130g',    unit: 'UN', sale: 3.50,  cost: 1.90,  stock: 60  },
    { code: '023', barcode: '7891234000023', desc: 'Macarrão Espaguete 500g',   unit: 'UN', sale: 4.20,  cost: 2.30,  stock: 45  },
    { code: '024', barcode: '7891234000024', desc: 'Arroz Branco 5kg',          unit: 'UN', sale: 24.90, cost: 15.00, stock: 30  },
    { code: '025', barcode: '7891234000025', desc: 'Feijão Carioca 1kg',        unit: 'UN', sale: 8.90,  cost: 5.20,  stock: 35  },
    { code: '026', barcode: '7891234000026', desc: 'Açúcar Cristal 1kg',        unit: 'UN', sale: 4.90,  cost: 2.80,  stock: 50  },
    { code: '027', barcode: '7891234000027', desc: 'Café Torrado 500g',         unit: 'UN', sale: 14.90, cost: 8.50,  stock: 25  },
    { code: '028', barcode: '7891234000028', desc: 'Óleo de Soja 900ml',        unit: 'UN', sale: 7.90,  cost: 4.50,  stock: 40  },
    { code: '029', barcode: '7891234000029', desc: 'Sal Refinado 1kg',          unit: 'UN', sale: 2.90,  cost: 1.50,  stock: 60  },
    // Higiene
    { code: '040', barcode: '7891234000040', desc: 'Sabonete 90g',              unit: 'UN', sale: 2.50,  cost: 1.20,  stock: 80  },
    { code: '041', barcode: '7891234000041', desc: 'Shampoo 400ml',             unit: 'UN', sale: 12.90, cost: 7.00,  stock: 30  },
    { code: '042', barcode: '7891234000042', desc: 'Papel Higiênico 4 rolos',   unit: 'UN', sale: 6.90,  cost: 3.80,  stock: 50  },
    { code: '043', barcode: '7891234000043', desc: 'Detergente 500ml',          unit: 'UN', sale: 2.90,  cost: 1.40,  stock: 60  },
    { code: '044', barcode: '7891234000044', desc: 'Desinfetante 1L',           unit: 'UN', sale: 5.90,  cost: 3.00,  stock: 35  },
    // Snacks
    { code: '050', barcode: '7891234000050', desc: 'Salgadinho 50g',            unit: 'UN', sale: 3.00,  cost: 1.50,  stock: 100 },
    { code: '051', barcode: '7891234000051', desc: 'Chocolate ao Leite 100g',   unit: 'UN', sale: 5.90,  cost: 3.20,  stock: 40  },
    { code: '052', barcode: '7891234000052', desc: 'Bala de Goma 100g',         unit: 'UN', sale: 2.50,  cost: 1.20,  stock: 70  },
    { code: '053', barcode: '7891234000053', desc: 'Pipoca Microondas 100g',    unit: 'UN', sale: 4.50,  cost: 2.50,  stock: 30  },
    // Frios
    { code: '060', barcode: '7891234000060', desc: 'Presunto Fatiado 200g',     unit: 'UN', sale: 9.90,  cost: 5.80,  stock: 20  },
    { code: '061', barcode: '7891234000061', desc: 'Salame Italiano 100g',      unit: 'UN', sale: 8.50,  cost: 4.90,  stock: 15  },
    { code: '062', barcode: '7891234000062', desc: 'Mortadela 200g',            unit: 'UN', sale: 6.90,  cost: 3.80,  stock: 20  },
    // Hortifruti
    { code: '070', barcode: null,            desc: 'Banana Prata (kg)',         unit: 'KG', sale: 4.90,  cost: 2.50,  stock: 15  },
    { code: '071', barcode: null,            desc: 'Maçã Fuji (kg)',            unit: 'KG', sale: 7.90,  cost: 4.00,  stock: 10  },
    { code: '072', barcode: null,            desc: 'Tomate (kg)',               unit: 'KG', sale: 5.90,  cost: 3.00,  stock: 8   },
    { code: '073', barcode: null,            desc: 'Cebola (kg)',               unit: 'KG', sale: 4.50,  cost: 2.20,  stock: 10  },
  ]
  const insertProduct = db.prepare(`
    INSERT OR IGNORE INTO products (internal_code, barcode, description, unit, sale_price, cost_price, stock_qty)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  for (const p of products) {
    insertProduct.run(p.code, p.barcode, p.desc, p.unit, p.sale, p.cost, p.stock)
  }

  console.log(`[DB] Seed: ${users.length} usuários, ${customers.length} clientes, ${products.length} produtos inseridos.`)
}
