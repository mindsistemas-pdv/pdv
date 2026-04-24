/**
 * Seed de dados fictícios para o MindSys PDV.
 * Executa direto no banco SQLite sem precisar do Electron rodando.
 *
 * Uso: node scripts/seed.js
 */

const Database = require('better-sqlite3')
const bcrypt   = require('bcryptjs')
const path     = require('path')
const os       = require('os')

// Mesmo caminho que o Electron usa em produção
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'mindsys-pdv', 'mindsys-pdv.db')
console.log(`\n📦 Banco: ${dbPath}\n`)

const db = new Database(dbPath)
db.pragma('foreign_keys = ON')

// ─── Usuários ────────────────────────────────────────────────────────────────

const users = [
  { name: 'Administrador',  username: 'admin',    password: 'admin123',  role: 'admin'    },
  { name: 'Carlos Operador', username: 'carlos',  password: '1234',      role: 'operator' },
  { name: 'Ana Gerente',     username: 'ana',     password: '1234',      role: 'manager'  },
]

console.log('👤 Inserindo usuários...')
const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users (name, username, password_hash, role)
  VALUES (@name, @username, @password_hash, @role)
`)
for (const u of users) {
  insertUser.run({ ...u, password_hash: bcrypt.hashSync(u.password, 10) })
  console.log(`   ✓ ${u.name} (${u.username} / ${u.password})`)
}

// ─── Clientes ────────────────────────────────────────────────────────────────

const customers = [
  { name: 'João da Silva',       cpf_cnpj: '123.456.789-00', phone: '(11) 98765-4321', email: 'joao@email.com'    },
  { name: 'Maria Oliveira',      cpf_cnpj: '987.654.321-00', phone: '(11) 91234-5678', email: 'maria@email.com'   },
  { name: 'Pedro Santos',        cpf_cnpj: '456.789.123-00', phone: '(21) 99876-5432', email: null                },
  { name: 'Ana Costa',           cpf_cnpj: '321.654.987-00', phone: '(31) 98765-1234', email: 'ana@email.com'     },
  { name: 'Mercado Bom Preço',   cpf_cnpj: '12.345.678/0001-90', phone: '(11) 3456-7890', email: 'compras@bompre.com' },
  { name: 'Lanchonete do Zé',    cpf_cnpj: '98.765.432/0001-10', phone: '(11) 2345-6789', email: null             },
  { name: 'Fernanda Lima',       cpf_cnpj: '654.321.987-00', phone: '(41) 97654-3210', email: 'fernanda@email.com'},
  { name: 'Roberto Alves',       cpf_cnpj: null,              phone: '(11) 96543-2109', email: null               },
]

console.log('\n👥 Inserindo clientes...')
const insertCustomer = db.prepare(`
  INSERT OR IGNORE INTO customers (name, cpf_cnpj, phone, email)
  VALUES (@name, @cpf_cnpj, @phone, @email)
`)
for (const c of customers) {
  insertCustomer.run(c)
  console.log(`   ✓ ${c.name}`)
}

// ─── Produtos ────────────────────────────────────────────────────────────────

const products = [
  // Bebidas
  { internal_code: '001', barcode: '7891234000001', description: 'Água Mineral 500ml',          unit: 'UN', sale_price: 2.50,  cost_price: 1.20,  stock_qty: 120 },
  { internal_code: '002', barcode: '7891234000002', description: 'Refrigerante Cola 350ml',     unit: 'UN', sale_price: 4.00,  cost_price: 2.10,  stock_qty: 80  },
  { internal_code: '003', barcode: '7891234000003', description: 'Refrigerante Cola 2L',        unit: 'UN', sale_price: 9.90,  cost_price: 5.50,  stock_qty: 40  },
  { internal_code: '004', barcode: '7891234000004', description: 'Suco de Laranja 1L',          unit: 'UN', sale_price: 7.50,  cost_price: 4.00,  stock_qty: 30  },
  { internal_code: '005', barcode: '7891234000005', description: 'Cerveja Lata 350ml',          unit: 'UN', sale_price: 4.50,  cost_price: 2.50,  stock_qty: 200 },
  { internal_code: '006', barcode: '7891234000006', description: 'Energético 250ml',            unit: 'UN', sale_price: 8.00,  cost_price: 4.50,  stock_qty: 50  },

  // Laticínios
  { internal_code: '010', barcode: '7891234000010', description: 'Leite Integral 1L',           unit: 'UN', sale_price: 5.49,  cost_price: 3.20,  stock_qty: 60  },
  { internal_code: '011', barcode: '7891234000011', description: 'Iogurte Natural 170g',        unit: 'UN', sale_price: 3.20,  cost_price: 1.80,  stock_qty: 40  },
  { internal_code: '012', barcode: '7891234000012', description: 'Queijo Mussarela 200g',       unit: 'UN', sale_price: 12.90, cost_price: 7.50,  stock_qty: 25  },
  { internal_code: '013', barcode: '7891234000013', description: 'Manteiga 200g',               unit: 'UN', sale_price: 8.90,  cost_price: 5.00,  stock_qty: 30  },

  // Padaria / Mercearia
  { internal_code: '020', barcode: '7891234000020', description: 'Pão Francês (unidade)',       unit: 'UN', sale_price: 0.75,  cost_price: 0.35,  stock_qty: 200 },
  { internal_code: '021', barcode: '7891234000021', description: 'Pão de Forma 500g',           unit: 'UN', sale_price: 7.90,  cost_price: 4.50,  stock_qty: 20  },
  { internal_code: '022', barcode: '7891234000022', description: 'Biscoito Recheado 130g',      unit: 'UN', sale_price: 3.50,  cost_price: 1.90,  stock_qty: 60  },
  { internal_code: '023', barcode: '7891234000023', description: 'Macarrão Espaguete 500g',     unit: 'UN', sale_price: 4.20,  cost_price: 2.30,  stock_qty: 45  },
  { internal_code: '024', barcode: '7891234000024', description: 'Arroz Branco 5kg',            unit: 'UN', sale_price: 24.90, cost_price: 15.00, stock_qty: 30  },
  { internal_code: '025', barcode: '7891234000025', description: 'Feijão Carioca 1kg',          unit: 'UN', sale_price: 8.90,  cost_price: 5.20,  stock_qty: 35  },
  { internal_code: '026', barcode: '7891234000026', description: 'Açúcar Cristal 1kg',          unit: 'UN', sale_price: 4.90,  cost_price: 2.80,  stock_qty: 50  },
  { internal_code: '027', barcode: '7891234000027', description: 'Café Torrado 500g',           unit: 'UN', sale_price: 14.90, cost_price: 8.50,  stock_qty: 25  },
  { internal_code: '028', barcode: '7891234000028', description: 'Óleo de Soja 900ml',          unit: 'UN', sale_price: 7.90,  cost_price: 4.50,  stock_qty: 40  },
  { internal_code: '029', barcode: '7891234000029', description: 'Sal Refinado 1kg',            unit: 'UN', sale_price: 2.90,  cost_price: 1.50,  stock_qty: 60  },

  // Higiene / Limpeza
  { internal_code: '040', barcode: '7891234000040', description: 'Sabonete 90g',                unit: 'UN', sale_price: 2.50,  cost_price: 1.20,  stock_qty: 80  },
  { internal_code: '041', barcode: '7891234000041', description: 'Shampoo 400ml',               unit: 'UN', sale_price: 12.90, cost_price: 7.00,  stock_qty: 30  },
  { internal_code: '042', barcode: '7891234000042', description: 'Papel Higiênico 4 rolos',     unit: 'UN', sale_price: 6.90,  cost_price: 3.80,  stock_qty: 50  },
  { internal_code: '043', barcode: '7891234000043', description: 'Detergente 500ml',            unit: 'UN', sale_price: 2.90,  cost_price: 1.40,  stock_qty: 60  },
  { internal_code: '044', barcode: '7891234000044', description: 'Desinfetante 1L',             unit: 'UN', sale_price: 5.90,  cost_price: 3.00,  stock_qty: 35  },

  // Snacks / Guloseimas
  { internal_code: '050', barcode: '7891234000050', description: 'Salgadinho 50g',              unit: 'UN', sale_price: 3.00,  cost_price: 1.50,  stock_qty: 100 },
  { internal_code: '051', barcode: '7891234000051', description: 'Chocolate ao Leite 100g',     unit: 'UN', sale_price: 5.90,  cost_price: 3.20,  stock_qty: 40  },
  { internal_code: '052', barcode: '7891234000052', description: 'Bala de Goma 100g',           unit: 'UN', sale_price: 2.50,  cost_price: 1.20,  stock_qty: 70  },
  { internal_code: '053', barcode: '7891234000053', description: 'Pipoca Microondas 100g',      unit: 'UN', sale_price: 4.50,  cost_price: 2.50,  stock_qty: 30  },

  // Frios / Embutidos
  { internal_code: '060', barcode: '7891234000060', description: 'Presunto Fatiado 200g',       unit: 'UN', sale_price: 9.90,  cost_price: 5.80,  stock_qty: 20  },
  { internal_code: '061', barcode: '7891234000061', description: 'Salame Italiano 100g',        unit: 'UN', sale_price: 8.50,  cost_price: 4.90,  stock_qty: 15  },
  { internal_code: '062', barcode: '7891234000062', description: 'Mortadela 200g',              unit: 'UN', sale_price: 6.90,  cost_price: 3.80,  stock_qty: 20  },

  // Hortifruti (vendido por KG)
  { internal_code: '070', barcode: null,            description: 'Banana Prata (kg)',           unit: 'KG', sale_price: 4.90,  cost_price: 2.50,  stock_qty: 15  },
  { internal_code: '071', barcode: null,            description: 'Maçã Fuji (kg)',              unit: 'KG', sale_price: 7.90,  cost_price: 4.00,  stock_qty: 10  },
  { internal_code: '072', barcode: null,            description: 'Tomate (kg)',                 unit: 'KG', sale_price: 5.90,  cost_price: 3.00,  stock_qty: 8   },
  { internal_code: '073', barcode: null,            description: 'Cebola (kg)',                 unit: 'KG', sale_price: 4.50,  cost_price: 2.20,  stock_qty: 10  },
]

console.log('\n📦 Inserindo produtos...')
const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (internal_code, barcode, description, unit, sale_price, cost_price, stock_qty)
  VALUES (@internal_code, @barcode, @description, @unit, @sale_price, @cost_price, @stock_qty)
`)
for (const p of products) {
  insertProduct.run(p)
  console.log(`   ✓ [${p.internal_code}] ${p.description} — R$ ${p.sale_price.toFixed(2)}`)
}

// ─── Resumo ──────────────────────────────────────────────────────────────────

const countUsers     = db.prepare('SELECT COUNT(*) as n FROM users').get().n
const countCustomers = db.prepare('SELECT COUNT(*) as n FROM customers').get().n
const countProducts  = db.prepare('SELECT COUNT(*) as n FROM products WHERE active = 1').get().n

console.log(`
✅ Seed concluído!
   Usuários:  ${countUsers}
   Clientes:  ${countCustomers}
   Produtos:  ${countProducts}

🔑 Logins disponíveis:
   admin   / admin123  (Administrador)
   carlos  / 1234      (Operador)
   ana     / 1234      (Gerente)
`)

db.close()
