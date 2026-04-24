import { ipcMain } from 'electron'
import { userRepository } from '../repositories/userRepository'
import type { CreateUserDTO, IpcResponse, UpdateUserDTO, User } from '../types'

export function registerUserHandlers(): void {
  ipcMain.handle('users:getAll', async (): Promise<IpcResponse<Omit<User, 'password_hash'>[]>> => {
    try {
      return { success: true, data: userRepository.findAll() }
    } catch (err) {
      console.error('[users:getAll]', err)
      return { success: false, error: 'Erro ao buscar usuários.' }
    }
  })

  ipcMain.handle('users:create', async (_e, data: CreateUserDTO): Promise<IpcResponse<Omit<User, 'password_hash'>>> => {
    try {
      const user = userRepository.create(data)
      return { success: true, data: user }
    } catch (err: unknown) {
      console.error('[users:create]', err)
      const msg = err instanceof Error && err.message.includes('UNIQUE')
        ? 'Nome de usuário já cadastrado.'
        : 'Erro ao criar usuário.'
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('users:update', async (_e, id: number, data: UpdateUserDTO): Promise<IpcResponse<Omit<User, 'password_hash'>>> => {
    try {
      const user = userRepository.update(id, data)
      if (!user) return { success: false, error: 'Usuário não encontrado.' }
      return { success: true, data: user }
    } catch (err: unknown) {
      console.error('[users:update]', err)
      const msg = err instanceof Error && err.message.includes('UNIQUE')
        ? 'Nome de usuário já cadastrado.'
        : 'Erro ao atualizar usuário.'
      return { success: false, error: msg }
    }
  })

  ipcMain.handle('users:toggleActive', async (_e, id: number, active: boolean): Promise<IpcResponse> => {
    try {
      userRepository.toggleActive(id, active)
      return { success: true }
    } catch (err) {
      console.error('[users:toggleActive]', err)
      return { success: false, error: 'Erro ao alterar status do usuário.' }
    }
  })
}
