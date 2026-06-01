import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

/**
 * 渲染进程可调用的 API。
 *
 * @remarks
 * 通过 `contextBridge.exposeInMainWorld` 暴露到 `window.api`。
 * Provider 配置持久化到 `~/.little-q-desktop/settings.json`，
 * 用户可通过导出/导入功能分享配置。
 */
const api = {
  // ── AI 对话 ──

  /**
   * 发起流式 AI 对话。
   *
   * @param params - 包含 messages（对话消息数组）、config（providerId 与 model）的对象
   */
  aiStream: (params: {
    messages: { role: string; content: string }[]
    config: { providerId: string; model: string }
  }): Promise<void> => ipcRenderer.invoke('ai:stream', params),

  /**
   * 监听主进程推送的流式 chunk。
   *
   * @param callback - 接收到 chunk 时的回调
   * @returns 取消监听的清理函数
   */
  onAiChunk: (
    callback: (chunk: {
      type: 'content' | 'tool_call' | 'done' | 'error'
      text?: string
      toolName?: string
      error?: string
    }) => void
  ): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: unknown): void =>
      callback(chunk as Parameters<typeof callback>[0])
    ipcRenderer.on('ai:chunk', handler)
    return () => ipcRenderer.removeListener('ai:chunk', handler)
  },

  // ── 设置管理 ──

  /**
   * 加载所有设置（含 Provider 列表）。
   *
   * @returns 当前配置数据
   */
  settingsLoad: (): Promise<{
    providers: {
      id: string
      name: string
      type: string
      apiKey: string
      baseURL?: string
      models: string[]
      defaultModel: string
    }[]
    selectedProviderId: string | null
  }> => ipcRenderer.invoke('settings:load'),

  /**
   * 添加或更新 Provider 配置（自动持久化到磁盘）。
   *
   * @param provider - Provider 配置
   */
  settingsProviderAdd: (provider: {
    id: string
    name: string
    type: string
    apiKey: string
    baseURL?: string
    models: string[]
    defaultModel: string
  }): Promise<string | null> => ipcRenderer.invoke('settings:provider:add', provider),

  /**
   * 删除 Provider 配置。
   *
   * @param id - Provider ID
   */
  settingsProviderRemove: (id: string): Promise<void> =>
    ipcRenderer.invoke('settings:provider:remove', id),

  /**
   * 设置当前选中的 Provider。
   *
   * @param id - Provider ID，传 null 清除选中
   */
  settingsProviderSelect: (id: string | null): Promise<void> =>
    ipcRenderer.invoke('settings:provider:select', id),

  /**
   * 导出配置到用户指定路径。
   *
   * @remarks
   * 弹出保存文件对话框。
   *
   * @returns true 表示已保存，false 表示用户取消
   */
  settingsExport: (): Promise<boolean> => ipcRenderer.invoke('settings:export'),

  /**
   * 从用户指定路径导入配置。
   *
   * @remarks
   * 弹出打开文件对话框，选中 JSON 文件后覆盖当前设置。
   *
   * @returns 导入的 Provider 列表，取消时返回 null
   */
  settingsImport: (): Promise<
    | {
        id: string
        name: string
        type: string
        apiKey: string
        baseURL?: string
        models: string[]
        defaultModel: string
      }[]
    | null
  > => ipcRenderer.invoke('settings:import'),

  // ── 会话管理 ──

  /**
   * 获取所有会话的摘要列表（不含消息内容）。
   *
   * @returns 会话摘要数组
   */
  sessionsList: (): Promise<
    { id: string; title: string; createdAt: number; updatedAt: number }[]
  > => ipcRenderer.invoke('sessions:list'),

  /**
   * 从磁盘加载指定会话的完整数据。
   *
   * @param params - 包含 id（会话 ID）与 createdAt（创建时间戳，用于定位文件）的对象
   * @returns 完整会话数据，不存在时返回 null
   */
  sessionsLoad: (params: {
    id: string
    createdAt: number
  }): Promise<{
    id: string
    title: string
    messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp: number }[]
    createdAt: number
    updatedAt: number
  } | null> => ipcRenderer.invoke('sessions:load', params),

  /**
   * 保存会话到磁盘。
   */
  sessionsSave: (session: {
    id: string
    title: string
    messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp: number }[]
    createdAt: number
    updatedAt: number
  }): Promise<void> => ipcRenderer.invoke('sessions:save', session),

  /**
   * 从磁盘删除指定会话。
   *
   * @param params - 包含 id（会话 ID）与 createdAt（创建时间戳，用于定位文件）的对象
   */
  sessionsDelete: (params: { id: string; createdAt: number }): Promise<void> =>
    ipcRenderer.invoke('sessions:delete', params)
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
