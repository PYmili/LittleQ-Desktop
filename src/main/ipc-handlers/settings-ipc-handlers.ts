import { ipcMain } from 'electron'
import * as Settings from '../stores/settings-store'
import { registerProvider } from '../ai/providers'
import type { ProviderSettings } from '../types'

/**
 * 初始化 Provider 注册表。
 *
 * @remarks
 * 从磁盘加载所有已保存的 Provider 并注册到内存 Map 中，
 * 确保应用重启后 `getModel()` 能正常返回模型实例。
 */
function initProviders(): void {
  // 加载持久化的 Provider 配置
  const { providers } = Settings.loadSettings()
  // 逐一注册到全局 Provider 注册表
  for (const p of providers) {
    registerProvider(p)
  }
}

/**
 * 注册设置相关 IPC 处理器（Provider 管理 + 导入/导出）。
 */
export function registerSettingsHandlers(): void {
  initProviders()

  // ── Provider 管理 ──

  ipcMain.handle('settings:load', async () => {
    const settings = Settings.loadSettings()
    return {
      providers: settings.providers,
      selectedProviderId: settings.selectedProviderId
    }
  })

  ipcMain.handle('settings:provider:add', async (_event, provider: ProviderSettings) => {
    // 持久化保存 Provider 配置
    Settings.addProvider(provider)
    // 注册到内存中的 Provider 注册表，使其立即可用
    registerProvider(provider)
    return Settings.getSelectedProviderId()
  })

  ipcMain.handle('settings:provider:remove', async (_event, id: string) => {
    // 从持久化存储和选中状态中移除 Provider
    Settings.removeProvider(id)
  })

  ipcMain.handle('settings:provider:select', async (_event, id: string | null) => {
    Settings.setSelectedProviderId(id)
  })

  // ── 导入/导出 ──

  ipcMain.handle('settings:export', async () => {
    return Settings.exportSettings()
  })

  ipcMain.handle('settings:import', async () => {
    // 从磁盘文件导入配置
    const result = await Settings.importSettings()
    // 将导入的 Provider 逐一注册到内存注册表
    if (result) {
      for (const p of result) {
        registerProvider(p)
      }
    }
    return result
  })
}
