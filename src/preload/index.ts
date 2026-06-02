import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { aiApi } from './ai.preload'
import { settingsApi } from './settings.preload'
import { sessionsApi } from './sessions.preload'
import { petApi } from './pet.preload'

/**
 * 渲染进程可调用的 API。
 *
 * @remarks
 * 通过 `contextBridge.exposeInMainWorld` 暴露到 `window.api`，
 * 各模块 API 由独立的 preload 文件提供：
 * - AI 对话流
 * - Provider 管理与设置导入/导出
 * - 会话管理
 * - 宠物窗口控制
 */
const api = {
  ...aiApi,
  ...settingsApi,
  ...sessionsApi,
  ...petApi
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
