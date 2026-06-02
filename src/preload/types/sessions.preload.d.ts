/**
 * 会话摘要（侧边栏列表用，不含消息内容）。
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
 */
export interface SessionData {
  /** 会话唯一标识 */
  id: string
  /** 会话标题 */
  title: string
  /** 会话中的全部消息 */
  messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp: number }[]
  /** 创建时间戳（Unix 毫秒） */
  createdAt: number
  /** 最后更新时间戳（Unix 毫秒） */
  updatedAt: number
}

/**
 * 会话管理模块的 preload API 类型。
 */
export interface SessionsApi {
  /** 获取所有会话的摘要列表（不含消息内容） */
  sessionsList: () => Promise<SessionSummary[]>
  /** 加载指定会话的完整数据 */
  sessionsLoad: (params: { id: string; createdAt: number }) => Promise<SessionData | null>
  /** 保存会话到磁盘 */
  sessionsSave: (session: SessionData) => Promise<void>
  /** 删除指定会话 */
  sessionsDelete: (params: { id: string; createdAt: number }) => Promise<void>
}
