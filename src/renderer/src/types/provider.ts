/**
 * 渲染进程使用的 Provider 类型定义。
 *
 * @remarks
 * 与主进程 `src/main/ai/types.ts` 中的 `ProviderType` 保持一致。
 * 渲染进程不能直接引入主进程模块，此处独立定义。
 */

/** 支持的 AI Provider 类型 */
export type ProviderType = 'openai' | 'openai-compatible' | 'anthropic'
