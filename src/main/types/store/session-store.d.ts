/**
 * 单条聊天消息。
 */
export interface SessionMessage {
  /** 消息唯一标识 */
  id: string
  /** 消息角色：用户或 AI 助手 */
  role: 'user' | 'assistant'
  /** 消息正文内容 */
  content: string
  /** 消息时间戳（Unix 毫秒） */
  timestamp: number
}

/**
 * 会话索引摘要（不含 messages，仅用于列表展示）。
 */
export interface SessionSummary {
  /** 会话唯一标识 */
  id: string
  /** 会话标题 */
  title: string
  /** 创建时间戳（Unix 毫秒） */
  createdAt: number
  /** 最后更新时间戳（Unix 毫秒） */
  updatedAt: number
}

/**
 * 完整会话数据（含全部消息）。
 *
 * @remarks
 * 每个会话完整数据持久化到 `~/.little-q-desktop/sessions/{创建日期}/{id}.json`。
 */
export interface SessionData {
  /** 会话唯一标识 */
  id: string
  /** 会话标题 */
  title: string
  /** 会话中的全部消息 */
  messages: SessionMessage[]
  /** 创建时间戳（Unix 毫秒） */
  createdAt: number
  /** 最后更新时间戳（Unix 毫秒） */
  updatedAt: number
}

/**
 * sessions.json 的顶层结构。
 *
 * @remarks
 * 用于读写会话索引文件 `~/.little-q-desktop/sessions/sessions.json`。
 */
export interface SessionsIndex {
  /** 所有会话的摘要列表（按 updatedAt 倒序） */
  sessions: SessionSummary[]
}
