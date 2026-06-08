/**
 * 流式响应 chunk 类型。
 *
 * @remarks
 * 主进程推送的单个流式数据块，类型字段决定渲染进程如何处理该 chunk。
 */
export interface StreamChunk {
  /** chunk 类型 */
  type: 'content' | 'tool_call' | 'done' | 'error' | 'reasoning'
  /** 文本内容（type 为 content 或 reasoning 时有效） */
  text?: string
  /** 工具名称（type 为 tool_call 时有效） */
  toolName?: string
  /** 错误信息（type 为 error 时有效） */
  error?: string
}

/**
 * AI 对话模块的 preload API 类型。
 */
export interface AiApi {
  /** 发起流式 AI 对话 */
  aiStream: (params: {
    messages: { role: string; content: string }[]
    config: { providerId: string; model: string }
  }) => Promise<void>
  /** 监听主进程推送的流式 chunk，返回取消监听的清理函数 */
  onAiChunk: (callback: (chunk: StreamChunk) => void) => () => void
}
