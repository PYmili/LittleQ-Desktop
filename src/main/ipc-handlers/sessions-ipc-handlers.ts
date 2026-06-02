import { ipcMain } from 'electron'
import { loadSessionsIndex, loadSession, saveSession, deleteSession } from '../stores/session-store'

/**
 * 注册会话管理相关 IPC 处理器。
 */
export function registerSessionHandlers(): void {
  ipcMain.handle('sessions:list', async () => {
    return loadSessionsIndex()
  })

  ipcMain.handle('sessions:load', async (_event, params: { id: string; createdAt: number }) => {
    return loadSession(params.id, params.createdAt)
  })

  ipcMain.handle(
    'sessions:save',
    async (
      _event,
      session: {
        id: string
        title: string
        messages: {
          id: string
          role: 'user' | 'assistant'
          content: string
          timestamp: number
        }[]
        createdAt: number
        updatedAt: number
      }
    ) => {
      saveSession(session)
    }
  )

  ipcMain.handle('sessions:delete', async (_event, params: { id: string; createdAt: number }) => {
    deleteSession(params.id, params.createdAt)
  })
}
