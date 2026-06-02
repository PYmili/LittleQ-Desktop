import { ipcMain, BrowserWindow } from 'electron'
import type { ModelMessage } from 'ai'
import { runAgent } from '../ai/agent'
import type { StreamChunk, ChatConfig } from '../types'

/**
 * 注册 AI 对话相关 IPC 处理器。
 *
 * @param mainWindow - 主窗口实例，用于向渲染进程推送流式响应
 */
export function registerAiHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(
    'ai:stream',
    async (_event, params: { messages: ModelMessage[]; config: ChatConfig }): Promise<void> => {
      // 构造流式响应分发回调，实时推送到渲染进程
      const send = (chunk: StreamChunk) => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('ai:chunk', chunk)
        }
      }
      // 启动 Agent 编排循环
      await runAgent(params.messages, params.config, send)
    }
  )
}
