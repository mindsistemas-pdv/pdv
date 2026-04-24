import { getDatabase } from '../database/connection'
import type { User } from '../types'

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
}
