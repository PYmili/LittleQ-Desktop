import { streamText, stepCountIs, APICallError, type ModelMessage } from 'ai'
import type { StreamChunk, ChatConfig } from './types'
import { getModel } from './providers'
import { agentTools } from './tools'

/**
 * Agent 编排引擎。
 *
 * @remarks
 * 使用 `streamText` + `stepCountIs(10)` 实现 ReAct 循环：
 * LLM 自动判断是否需要调用工具，在 10 步内反复迭代直到输出最终回复。
 *
 * v6 中 API 错误（如余额不足）作为 `fullStream` 中的 `error` part 出现，
 * 不会通过 `textStream` 抛出异常，因此改用 `fullStream` 确保捕获。
 */

/**
 * 执行流式 Agent 对话。
 *
 * @param messages - 对话消息历史（ModelMessage 格式）
 * @param config - 使用的 Provider ID 与模型
 * @param onChunk - 每个流式 chunk 的回调
 *
 * @example
 * ```ts
 * await runAgent(messages, { providerId: '1', model: 'gpt-4o' }, (chunk) => {
 *   mainWindow.webContents.send('ai:chunk', chunk)
 * })
 * ```
 */
export async function runAgent(
  messages: ModelMessage[],
  config: ChatConfig,
  onChunk: (chunk: StreamChunk) => void
): Promise<void> {
  const model = getModel(config.providerId, config.model)

  if (!model) {
    onChunk({
      type: 'error',
      error: `Provider "${config.providerId}" 未配置，请在设置中添加 API Key`
    })
    onChunk({ type: 'done' })
    return
  }

  try {
    const result = streamText({
      model,
      messages,
      tools: agentTools,
      stopWhen: stepCountIs(10)
    })

    for await (const part of result.fullStream) {
      switch (part.type) {
        case 'text-delta':
          onChunk({ type: 'content', text: part.text })
          break

        case 'error': {
          const message = formatErrorMessage(part.error)
          console.error('[Agent] 流内错误:', message)
          onChunk({ type: 'error', error: message })
          break
        }

        case 'tool-error': {
          const message = part.error instanceof Error ? part.error.message : String(part.error)
          console.error('[Agent] 工具错误:', message)
          onChunk({ type: 'error', error: `工具错误: ${message}` })
          break
        }

        default:
          // tool-call、start-step、finish-step 等 — 仅用于内部编排，不推送到前端
          break
      }
    }

    onChunk({ type: 'done' })
  } catch (err) {
    const message = formatErrorMessage(err)
    console.error('[Agent] 对话异常:', message)
    onChunk({ type: 'error', error: message })
    onChunk({ type: 'done' })
  }
}

/**
 * 从 AI SDK 错误对象中提取面向用户的消息。
 *
 * @remarks
 * `APICallError.data.error.message` 包含 API 返回的原始错误（如 "Insufficient Balance"），
 * 比 `err.message` 更精确。
 *
 * @param err - AI SDK 或通用 Error 对象
 * @returns 面向用户的错误消息
 */
function formatErrorMessage(err: unknown): string {
  if (APICallError.isInstance(err)) {
    const statusCode = err.statusCode
    const apiMessage: string | undefined = (
      (err as APICallError).data as { error?: { message?: string } } | undefined
    )?.error?.message

    const prefix = statusCode ? `[HTTP ${statusCode}] ` : ''
    return `${prefix}${apiMessage || err.message}`
  }

  if (err instanceof Error) {
    return err.message
  }

  return '未知错误'
}
