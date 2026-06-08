import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai'
import { createAnthropic, type AnthropicProvider } from '@ai-sdk/anthropic'
import { createDeepSeek, type DeepSeekProvider } from '@ai-sdk/deepseek'
import type { LanguageModel } from 'ai'
import type { ProviderSettings } from '../types'

/**
 * Provider 实例注册表。
 *
 * @remarks
 * 以 ProviderSettings.id 为键存储已初始化的 Provider 实例。
 * 每个 Provider 持有独立的 API Key 和 Base URL。
 */
const providerMap = new Map<string, OpenAIProvider | AnthropicProvider | DeepSeekProvider>()

/**
 * Provider 设置元数据。
 *
 * @remarks
 * 存储 ProviderSettings 中影响 API 调用的配置项
 *（如 useResponsesApi），供 getModel 时使用。
 */
const providerMetaMap = new Map<string, { useResponsesApi: boolean }>()

/**
 * 注册一个 AI Provider。
 *
 * @remarks
 * 根据 `settings.type` 创建对应的 SDK 实例并存入注册表。
 * 可多次调用以注册多个不同 Provider（如两个不同 Base URL 的 OpenAI 兼容服务）。
 *
 * @param settings - Provider 配置，包含 apiKey、baseURL、类型等
 *
 * @example
 * ```ts
 * registerProvider({
 *   id: '1',
 *   name: '我的 OpenAI',
 *   type: 'openai',
 *   apiKey: 'sk-xxx',
 *   models: ['gpt-4o'],
 *   defaultModel: 'gpt-4o'
 * })
 * ```
 */
export function registerProvider(settings: ProviderSettings): void {
  switch (settings.type) {
    case 'openai':
    case 'openai-compatible':
      providerMap.set(
        settings.id,
        createOpenAI({
          apiKey: settings.apiKey,
          baseURL: settings.baseURL || 'https://api.openai.com/v1'
        })
      )
      break
    case 'anthropic':
      providerMap.set(
        settings.id,
        createAnthropic({
          apiKey: settings.apiKey,
          baseURL: settings.baseURL
        })
      )
      break
    case 'deepseek':
      providerMap.set(
        settings.id,
        createDeepSeek({
          apiKey: settings.apiKey,
          baseURL: settings.baseURL || 'https://api.deepseek.com'
        })
      )
      break
  }

  // 存储 API 模式偏好：仅 openai 类型可启用 Responses API
  providerMetaMap.set(settings.id, {
    useResponsesApi: settings.useResponsesApi === true && settings.type === 'openai'
  })
}

/**
 * 根据 Provider ID 与模型名获取语言模型实例。
 *
 * @remarks
 * - OpenAI 类型且 `useResponsesApi = true`：走 Responses API（`/v1/responses`），支持 reasoning 流式输出
 * - 其余所有类型：走 Chat Completions / Messages API（`.chat()`），兼容第三方接口
 *
 * @param providerId - 注册时的 ProviderSettings.id
 * @param model - 模型 ID（如 `'gpt-5.5'`、`'deepseek-v4-flash'`）
 * @returns 语言模型实例，若 Provider 未注册则返回 `null`
 */
export function getModel(providerId: string, model: string): LanguageModel | null {
  const provider = providerMap.get(providerId)
  if (!provider) return null

  const meta = providerMetaMap.get(providerId)
  if (meta?.useResponsesApi) {
    return provider(model)
  }
  return provider.chat(model)
}

/**
 * 注销指定 Provider。
 *
 * @param providerId - 注册时的 ProviderSettings.id
 */
export function unregisterProvider(providerId: string): void {
  providerMap.delete(providerId)
  providerMetaMap.delete(providerId)
}

/**
 * 检查指定 Provider 是否已注册。
 *
 * @param providerId - ProviderSettings.id
 * @returns 是否已注册
 */
export function isProviderAvailable(providerId: string): boolean {
  return providerMap.has(providerId)
}

/**
 * 清空所有已注册的 Provider。
 *
 * @remarks
 * 在导入配置时调用，避免旧 Provider 残留。
 */
export function clearAllProviders(): void {
  providerMap.clear()
  providerMetaMap.clear()
}
