import bcrypt from 'bcryptjs'
import { getDatabase } from '../database/connection'
import type { User, CreateUserDTO, UpdateUserDTO } from '../types'

export const userRepository = {
  findByUsername(username: string): User | undefined {
    return getDatabase()
      .prepare('SELECT * FROM users WHERE username = ? AND active = 1')
      .get(username) as User | undefined
  },

  findById(id: number): User | undefined {
    return getDatabase()
      .prepare('SELECT id, name, username, role, active, created_at FROM users WHERE id = ?')
      .get(id) as User | undefined
  },

  findAll(): Omit<User, 'password_hash'>[] {
    return getDatabase()
      .prepare('SELECT id, name, username, role, active, created_at FROM users ORDER BY name')
      .all() as Omit<User, 'password_hash'>[]
  },

  create(data: CreateUserDTO): Omit<User, 'password_hash'> {
    const db = getDatabase()
    const hash = bcrypt.hashSync(data.password, 10)
    const result = db.prepare(`
      INSERT INTO users (name, username, password_hash, role)
      VALUES (@name, @username, @password_hash, @role)
    `).run({ name: data.name, username: data.username, password_hash: hash, role: data.role })
    return this.findById(result.lastInsertRowid as number)!
  },

  update(id: number, data: UpdateUserDTO): Omit<User, 'password_hash'> | undefined {
    const db = getDatabase()
    if (data.password) {
      const hash = bcrypt.hashSync(data.password, 10)
      db.prepare(`
        UPDATE users SET name = @name, username = @username, role = @role,
          password_hash = @password_hash WHERE id = @id
      `).run({ name: data.name, username: data.username, role: data.role, password_hash: hash, id })
    } else {
      db.prepare(`
        UPDATE users SET name = @name, username = @username, role = @role WHERE id = @id
      `).run({ name: data.name, username: data.username, role: data.role, id })
    }
    return this.findById(id)
  },

  toggleActive(id: number, active: boolean): void {
    getDatabase().prepare('UPDATE users SET active = ? WHERE id = ?').run(active ? 1 : 0, id)
  },
}
