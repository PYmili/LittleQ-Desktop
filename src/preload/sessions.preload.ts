import { ipcRenderer } from 'electron'
import type { SessionsApi } from './types/sessions.preload'

/**
 * 会话管理模块的 preload API。
 */
export const sessionsApi: SessionsApi = {
  /**
   * 获取所有会话的摘要列表（不含消息内容）。
   *
   * @returns 会话摘要数组
   */
  sessionsList: () => ipcRenderer.invoke('sessions:list'),

  /**
   * 从磁盘加载指定会话的完整数据。
   *
   * @param params - 包含 id（会话 ID）与 createdAt（创建时间戳，用于定位文件）
   * @returns 完整会话数据，不存在时返回 null
   */
  sessionsLoad: (params) => ipcRenderer.invoke('sessions:load', params),

  /**
   * 保存会话到磁盘。
   */
  sessionsSave: (session) => ipcRenderer.invoke('sessions:save', session),

  /**
   * 从磁盘删除指定会话。
   *
   * @param params - 包含 id（会话 ID）与 createdAt（创建时间戳，用于定位文件）
   */
  sessionsDelete: (params) => ipcRenderer.invoke('sessions:delete', params)
}
