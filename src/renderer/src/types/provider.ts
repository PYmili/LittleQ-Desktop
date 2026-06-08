/**
 * 渲染进程使用的 Provider 类型定义。
 *
 * @remarks
 * 与主进程 `src/main/types/ai.d.ts` 中的 `ProviderType` 保持一致。
 * 渲染进程不能直接引入主进程模块，此处独立定义。
 */

/** 支持的 AI Provider 类型 */
export type ProviderType = 'openai' | 'openai-compatible' | 'anthropic' | 'deepseek'

/** Provider 配置信息（渲染进程使用） */
export interface ProviderInfo {
  id: string
  name: string
  type: string
  apiKey: string
  baseURL?: string
  models: string[]
  defaultModel: string
  /** 是否使用 Responses API（仅 OpenAI 类型有效） */
  useResponsesApi?: boolean
}
