import { ipcRenderer } from 'electron'
import type { StreamChunk, AiApi } from './types/ai.preload'

/**
 * AI 对话模块的 preload API。
 */
export const aiApi: AiApi = {
  /**
   * 发起流式 AI 对话。
   *
   * @param params - 包含 messages（对话消息数组）、config（providerId 与 model）
   */
  aiStream: (params) => ipcRenderer.invoke('ai:stream', params),

  /**
   * 监听主进程推送的流式 chunk。
   *
   * @param callback - 接收到 chunk 时的回调
   * @returns 取消监听的清理函数
   */
  onAiChunk: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, chunk: unknown): void =>
      callback(chunk as StreamChunk)
    ipcRenderer.on('ai:chunk', handler)
    return () => ipcRenderer.removeListener('ai:chunk', handler)
  }
}
