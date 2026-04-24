import { ipcMain } from 'electron'
import bcrypt from 'bcryptjs'
import { userRepository } from '../repositories/userRepository'
import type { IpcResponse, User } from '../types'

export function registerAuthHandlers(): void {
  ipcMain.handle('auth:login', async (_event, username: string, password: string): Promise<IpcResponse<Omit<User, 'password_hash'>>> => {
    try {
      const user = userRepository.findByUsername(username)

      if (!user) {
        return { success: false, error: 'Usuário não encontrado.' }
      }

      const valid = bcrypt.compareSync(password, user.password_hash)
      if (!valid) {
        return { success: false, error: 'Senha incorreta.' }
      }

      // Nunca retorna o hash da senha para o renderer
      const { password_hash: _, ...safeUser } = user
      return { success: true, data: safeUser }
    } catch (err) {
      console.error('[auth:login]', err)
      return { success: false, error: 'Erro interno ao fazer login.' }
    }
  })
}
