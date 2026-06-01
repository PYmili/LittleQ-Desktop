/**
 * AI 模块统一类型定义。
 *
 * @remarks
 * 在主进程与预加载脚本的类型声明中共享。用户可配置多个 Provider，
 * 每个 Provider 包含类型、API Key、Base URL、模型列表等信息。
 */

/** 支持的 Provider 类型 */
export type ProviderType = 'openai' | 'openai-compatible' | 'anthropic'

/** 用户配置的单个 AI Provider */
export interface ProviderSettings {
  /** 唯一标识（自增或 UUID） */
  id: string
  /** 用户自定义的显示名称 */
  name: string
  /** Provider 类型 */
  type: ProviderType
  /** API Key */
  apiKey: string
  /** API 基础 URL（openai-compatible 时必填，默认留空使用官方地址） */
  baseURL?: string
  /** 可用模型列表 */
  models: string[]
  /** 默认模型 */
  defaultModel: string
}

/** 某次对话中使用的 Provider 与模型选择 */
export interface ChatConfig {
  /** 对应 ProviderSettings.id */
  providerId: string
  /** 具体使用的模型 ID */
  model: string
}

/** 对话消息，renderer → main 传输格式 */
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
}

/** 流式响应 chunk，main → renderer 推送格式 */
export interface StreamChunk {
  type: 'content' | 'tool_call' | 'done' | 'error'
  text?: string
  toolName?: string
  error?: string
}
