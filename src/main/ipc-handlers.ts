import { ipcMain, BrowserWindow } from 'electron'
import type { ModelMessage } from 'ai'
import { runAgent } from './ai/agent'
import { registerProvider } from './ai/providers'
import {
  loadSettings,
  addProvider,
  removeProvider,
  getSelectedProviderId,
  setSelectedProviderId,
  exportSettings,
  importSettings
} from './settings-store'
import { loadSessionsIndex, loadSession, saveSession, deleteSession } from './session-store'
import type { StreamChunk, ChatConfig, ProviderSettings } from './ai/types'

/**
 * 初始化 Provider 注册表。
 *
 * @remarks
 * 从磁盘加载所有已保存的 Provider 并注册到内存 Map 中，
 * 确保应用重启后 `getModel()` 能正常返回模型实例。
 */
function initProviders(): void {
  const { providers } = loadSettings()
  for (const p of providers) {
    registerProvider(p)
  }
}

/**
 * 注册所有 IPC 处理器。
 *
 * @remarks
 * 在 `app.whenReady()` 中调用一次。包含：
 * - AI 对话流
 * - Provider 管理
 * - 设置导入/导出
 *
 * @param mainWindow - 主窗口实例
 */
export function registerAllIpcHandlers(mainWindow: BrowserWindow): void {
  initProviders()
  // ── AI 对话 ──

  ipcMain.handle(
    'ai:stream',
    async (_event, params: { messages: ModelMessage[]; config: ChatConfig }): Promise<void> => {
      const send = (chunk: StreamChunk) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ai:chunk', chunk)
        }
      }
      await runAgent(params.messages, params.config, send)
    }
  )

  // ── Provider 管理 ──

  ipcMain.handle('settings:load', async () => {
    const settings = loadSettings()
    return {
      providers: settings.providers,
      selectedProviderId: settings.selectedProviderId
    }
  })

  ipcMain.handle('settings:provider:add', async (_event, provider: ProviderSettings) => {
    addProvider(provider)
    registerProvider(provider)
    return getSelectedProviderId()
  })

  ipcMain.handle('settings:provider:remove', async (_event, id: string) => {
    removeProvider(id)
  })

  ipcMain.handle('settings:provider:select', async (_event, id: string | null) => {
    setSelectedProviderId(id)
  })

  // ── 导入/导出 ──

  ipcMain.handle('settings:export', async () => {
    return exportSettings()
  })

  ipcMain.handle('settings:import', async () => {
    const result = await importSettings()
    if (result) {
      for (const p of result) {
        registerProvider(p)
      }
    }
    return result
  })

  // ── 会话管理 ──

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
