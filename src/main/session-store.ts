import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync, rmdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { ensureDir, dateDir } from './common/fs-utils'

/**
 * 会话持久化 Store。
 *
 * @remarks
 * 会话列表存于 `~/.little-q-desktop/sessions.json`（摘要），
 * 每个会话完整数据存于 `~/.little-q-desktop/sessions/{创建日期}/{id}.json`。
 */

const BASE_DIR = join(homedir(), '.little-q-desktop', 'sessions')
const SESSIONS_INDEX_PATH = join(BASE_DIR, 'sessions.json')

/**
 * 会话索引摘要（不含 messages）
 */
export interface SessionSummary {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

/**
 * 单条消息
 */
export interface SessionMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

/**
 * 完整会话
 */
export interface SessionData {
  id: string
  title: string
  messages: SessionMessage[]
  createdAt: number
  updatedAt: number
}

/**
 * sessions.json 顶层结构
 */
interface SessionsIndex {
  sessions: SessionSummary[]
}

/**
 * 获取会话文件的完整路径
 *
 * @param id - 会话id
 * @param createdAt - 会话的创建时间
 */
function sessionPath(id: string, createdAt: number): string {
  return join(BASE_DIR, dateDir(createdAt), `${id}.json`)
}

/**
 * 加载所有会话的摘要列表。
 *
 * @returns SessionSummary[] - 会话摘要数组，按更新时间倒序
 */
export function loadSessionsIndex(): SessionSummary[] {
  try {
    // 前置检查，不存在文件直接初始化并返回
    ensureDir(BASE_DIR)
    if (!existsSync(SESSIONS_INDEX_PATH)) {
      writeFileSync(SESSIONS_INDEX_PATH, JSON.stringify({ sessions: [] }), 'utf-8')
      return []
    }

    // 存在文件，读取数据并返回
    const raw = readFileSync(SESSIONS_INDEX_PATH, 'utf-8')
    const data: SessionsIndex = JSON.parse(raw)
    return (data.sessions || []).sort((a, b) => b.updatedAt - a.updatedAt)
  } catch {
    return []
  }
}

/**
 * 写入会话摘要列表。
 *
 * @param sessions - 会话列表
 */
function saveSessionsIndex(sessions: SessionSummary[]): void {
  ensureDir(BASE_DIR)
  writeFileSync(SESSIONS_INDEX_PATH, JSON.stringify({ sessions }, null, 2), 'utf-8')
}

/**
 * 从磁盘加载单个会话的完整数据。
 *
 * @param id - 会话 ID
 * @param createdAt - 会话创建时间戳（用于定位日期目录）
 * @returns 完整会话数据，不存在则返回 null
 */
export function loadSession(id: string, createdAt: number): SessionData | null {
  try {
    const path = sessionPath(id, createdAt)
    if (!existsSync(path)) return null
    const raw = readFileSync(path, 'utf-8')
    return JSON.parse(raw) as SessionData
  } catch {
    return null
  }
}

/**
 * 保存完整会话到磁盘并更新索引。
 *
 * @param session - 会话完整数据
 */
export function saveSession(session: SessionData): void {
  // 前置处理，路径及其检查
  const dir = join(BASE_DIR, dateDir(session.createdAt))
  ensureDir(dir)
  const path = join(dir, `${session.id}.json`)

  // 写入会话数据至文件
  writeFileSync(path, JSON.stringify(session, null, 2), 'utf-8')

  // 从 sessions.json 查找会话摘要索引并更新
  const index = loadSessionsIndex()
  const existing = index.findIndex((s) => s.id === session.id)
  const summary: SessionSummary = {
    id: session.id,
    title: session.title,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt
  }
  if (existing >= 0) {
    index[existing] = summary
  } else {
    index.unshift(summary)
  }
  saveSessionsIndex(index)
}

/**
 * 删除会话及其磁盘文件。
 *
 * @param id - 会话 ID
 * @param createdAt - 会话创建时间戳
 */
export function deleteSession(id: string, createdAt: number): void {
  console.log(`[SessionStore] 开始删除会话 id:"${id}" 创建时间:${createdAt}`)

  const path = sessionPath(id, createdAt)

  // 1. 删除会话数据文件
  if (existsSync(path)) {
    unlinkSync(path)
    console.log(`[SessionStore] 数据文件已删除 path:"${path}"`)
  } else {
    console.warn(`[SessionStore] 数据文件不存在 path:"${path}"`)
  }

  // 2. 清理空日期目录（若同一天无其他会话则删除）
  const dir = join(BASE_DIR, dateDir(createdAt))
  try {
    const entries = readdirSync(dir)
    if (entries.length === 0) {
      rmdirSync(dir)
      console.log(`[SessionStore] 空日期目录已清理 dir:"${dir}"`)
    }
  } catch {
    console.warn(`[SessionStore] 日期目录不存在或无法清理 dir:"${dir}"`)
  }

  // 3. 更新索引文件
  const index = loadSessionsIndex().filter((s) => s.id !== id)
  saveSessionsIndex(index)
  console.log(`[SessionStore] 索引文件已更新，删除会话 id:"${id}" 共 ${index.length} 条`)
}
