/**
 * 对话 Store 相关类型定义。
 *
 * @remarks
 * 核心业务模型（MessageModel、ConversationModel）用于 Pinia store 状态管理和持久化。
 * ConversationSummary 用于侧边栏列表展示，不包含消息内容。
 */

/**
 * 对话中的单条消息模型。
 *
 * @remarks
 * `role` 区分发送者：`user` 表示用户消息（右侧气泡），`assistant` 表示 AI 回复（左侧气泡）。
 * `streaming` 表示 AI 回复是否仍在上屏中，完毕后 `false` 并触发 Markdown 渲染。
 * `timestamp` 为毫秒级 Unix 时间戳。
 *
 * - `id` — 消息唯一标识
 * - `role` — 消息发送者角色
 * - `content` — 消息文本内容
 * - `streaming` — 是否仍在流式上屏（仅 assistant 消息使用）
 * - `timestamp` — 消息创建时间（毫秒时间戳）
 */
export interface MessageModel {
  id: string
  role: 'user' | 'assistant'
  content: string
  streaming?: boolean
  timestamp: number
}

/**
 * 对话会话模型。
 *
 * @remarks
 * 一个 ConversationModel 包含多条 MessageModel。`createdAt` 用于排序历史列表，
 * `updatedAt` 在每次添加消息时更新。持久化到 `~/.little-q-desktop/{日期}/{id}.json`。
 *
 * - `id` — 会话唯一标识
 * - `title` — 会话展示标题（首条用户消息截取前 30 字，默认"新对话"）
 * - `messages` — 消息列表
 * - `createdAt` — 会话创建时间（毫秒时间戳）
 * - `updatedAt` — 最近更新时间（毫秒时间戳）
 */
export interface ConversationModel {
  id: string
  title: string
  messages: MessageModel[]
  createdAt: number
  updatedAt: number
}

/**
 * 会话摘要（不含消息内容）。
 *
 * @remarks
 * 用于侧边栏列表展示，仅包含会话元数据。
 *
 * - `id` — 会话唯一标识
 * - `title` — 会话展示标题
 * - `createdAt` — 会话创建时间（毫秒时间戳）
 * - `updatedAt` — 最近更新时间（毫秒时间戳）
 */
export interface ConversationSummary {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}
