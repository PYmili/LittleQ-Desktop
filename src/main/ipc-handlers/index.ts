import { BrowserWindow } from 'electron'
import { registerAiHandlers } from './ai-ipc-handlers'
import { registerSettingsHandlers } from './settings-ipc-handlers'
import { registerSessionHandlers } from './sessions-ipc-handlers'
import { registerPetHandlers } from './pet-ipc-handlers'

/**
 * 注册所有 IPC 处理器。
 *
 * @remarks
 * 在 `app.whenReady()` 中调用一次，按模块分发到各子处理器：
 * - AI 对话流
 * - Provider 管理与设置导入/导出
 * - 会话管理
 * - 宠物窗口控制
 *
 * @param mainWindow - 主窗口实例
 */
export function registerAllIpcHandlers(mainWindow: BrowserWindow): void {
  registerSettingsHandlers()
  registerSessionHandlers()
  registerAiHandlers(mainWindow)
  registerPetHandlers()
}
