import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { MessageModel, ConversationModel, ConversationSummary } from '../types/store/chat'
import { genId } from '@renderer/common/id-utils'

export type { MessageModel, ConversationModel, ConversationSummary } from '../types/store/chat'

/**
 * 移除 streaming 字段后序列化
 *
 * @param conv - 指定会话
 */
function cleanForSave(conv: ConversationModel) {
  return {
    id: conv.id,
    title: conv.title,
    messages: conv.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp
    })),
    createdAt: conv.createdAt,
    updatedAt: conv.updatedAt
  }
}

/**
 * 持久化到磁盘（不阻塞 UI）
 *
 * @param conv - 指定的会话
 */
function persist(conv: ConversationModel): void {
  window.api.sessionsSave(cleanForSave(conv)).catch((err) => {
    console.error('[ChatStore] 保存会话失败:', err)
  })
}

/**
 * 从磁盘懒加载完整会话数据。
 *
 * @param summary - 会话摘要（含 createdAt 用于定位日期目录）
 * @returns 完整会话数据，加载失败返回 null
 */
async function loadFullConversation(
  summary: ConversationSummary
): Promise<ConversationModel | null> {
  try {
    const data = await window.api.sessionsLoad({
      id: summary.id,
      createdAt: summary.createdAt
    })
    return (data as ConversationModel) || null
  } catch (err) {
    console.error('[ChatStore] 加载会话失败:', summary.id, err)
    return null
  }
}

/**
 * LittleQ 对话状态管理 Store。
 *
 * @remarks
 * 采用单会话懒加载架构：
 * - `summaries` — 会话摘要列表（仅元数据），用于侧边栏展示，启动时加载
 * - `activeConversation` — 当前活跃会话的完整数据（唯一一份在内存），切换时覆盖
 * - 永不将多个完整会话同时保留在内存，防止长时间运行内存溢出
 *
 * @example
 * ```ts
 * import { useChatStore } from '@renderer/stores/chat'
 *
 * const store = useChatStore()
 * await store.init()
 * const id = store.createConversation()
 * ```
 */
export const useChatStore = defineStore('chat', () => {
  // 会话摘要列表（侧边栏展示用，不含消息内容）
  const summaries = ref<ConversationSummary[]>([])

  // 当前活跃会话的完整数据（内存中仅此一份）
  const activeConversation = ref<ConversationModel | null>(null)

  // 当前活跃会话 ID
  const activeId = ref<string | null>(null)

  // 是否已完成初始化加载
  const loaded = ref(false)

  /**
   * 同步当前会话元数据到 summaries 中对应条目
   *
   * @returns void
   */
  function syncSummary(): void {
    if (!activeConversation.value) return
    const conv = activeConversation.value
    const idx = summaries.value.findIndex((s) => s.id === conv.id)
    if (idx >= 0) {
      summaries.value[idx] = {
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt
      }
    }
  }

  /**
   * 初始化：加载摘要列表，懒加载最近一条会话的完整数据。
   *
   * @returns Promise<void>
   */
  async function init(): Promise<void> {
    if (loaded.value) return
    try {
      // 获取原始的会话摘要列表
      const rawSummaries = await window.api.sessionsList()
      summaries.value = rawSummaries

      // 仅加载第一条（最近更新）会话
      if (rawSummaries.length > 0) {
        const conv = await loadFullConversation(rawSummaries[0])
        if (conv) {
          activeConversation.value = conv
          activeId.value = conv.id
        }
      }
    } catch (err) {
      console.error('[ChatStore] 初始化失败:', err)
    } finally {
      loaded.value = true
    }
  }

  /**
   * 创建新会话并设为活跃。
   *
   * @returns string - 会话ID
   */
  function createConversation(): string {
    // 旧活跃会话已持久化（或为空），直接覆盖
    const conv: ConversationModel = {
      id: genId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    activeConversation.value = conv
    activeId.value = conv.id
    summaries.value.unshift({
      id: conv.id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt
    })
    // 写入磁盘
    persist(conv)
    return conv.id
  }

  /**
   * 切换到指定会话（按需懒加载完整数据，覆盖旧会话）。
   *
   * @returns Promise<void>
   */
  async function switchConversation(id: string): Promise<void> {
    // 已是当前活跃会话
    if (activeConversation.value?.id === id) return

    // 切换前持久化旧会话
    if (activeConversation.value && activeConversation.value.messages.length > 0) {
      persist(activeConversation.value)
    }

    // 从 summaries 获取元数据，懒加载完整数据
    const summary = summaries.value.find((s) => s.id === id)
    if (!summary) return

    // 加载完整的会话数据
    const conv = await loadFullConversation(summary)
    if (conv) {
      activeConversation.value = conv
      activeId.value = id
    }
  }

  /**
   * 删除指定会话。
   *
   * @remarks 流程：磁盘 → 摘要列表 → 活跃会话（若匹配），异常时保持数据一致性。
   * @param id - 需要删除的会话 ID
   */
  async function deleteConversation(id: string): Promise<void> {
    console.log(`[ChatStore] 开始删除会话 id:"${id}"`)

    const summary = summaries.value.find((s) => s.id === id)
    if (!summary) {
      console.warn(`[ChatStore] 会话 id:"${id}" 在摘要列表中不存在，取消删除`)
      return
    }

    // 磁盘优先 — 成功后才清理内存，确保异常时内存状态不变
    try {
      await window.api.sessionsDelete({ id, createdAt: summary.createdAt })
      console.log(`[ChatStore] 磁盘文件删除成功 id:"${id}"`)
    } catch (err) {
      console.error(`[ChatStore] 磁盘删除失败 id:"${id}"，终止删除流程`, err)
      return
    }

    // 清理摘要列表
    summaries.value = summaries.value.filter((s) => s.id !== id)
    console.log(`[ChatStore] 摘要列表中已移除 id:"${id}"，剩余 ${summaries.value.length} 条`)

    // 若删除的是当前活跃会话，切换至剩余第一条
    if (activeId.value === id) {
      activeConversation.value = null
      activeId.value = null
      console.log(`[ChatStore] 已清空活跃会话 id:"${id}"`)

      if (summaries.value.length > 0) {
        const nextId = summaries.value[0].id
        console.log(`[ChatStore] 自动切换到 id:"${nextId}"`)
        await switchConversation(nextId)
      }
    }

    console.log(`[ChatStore] 删除会话完成 id:"${id}"`)
  }

  /**
   * 向当前活跃会话追加一条消息。
   *
   * @param conversationId - 需要添加信息的会话ID
   * @param message - 添加的信息
   */
  function addMessage(
    conversationId: string,
    message: Omit<MessageModel, 'id' | 'timestamp'>
  ): void {
    // 前置检查
    if (!activeConversation.value || activeConversation.value.id !== conversationId) return

    // 对添加的新信息进行处理，并写入当前活动会话
    const conv = activeConversation.value
    const newMsg: MessageModel = {
      ...message,
      id: genId(),
      timestamp: Date.now()
    }
    conv.messages.push(newMsg)
    conv.updatedAt = Date.now()

    // 剪切标题，根据用户发送的信息
    if (conv.messages.length === 1 && message.role === 'user') {
      conv.title = message.content.slice(0, 30) || '新对话'
    }

    // 同步会话目录
    syncSummary()

    // 流式消息延迟到 finishStreaming 时再持久化，避免写入空 content
    if (!message.streaming) {
      persist(conv)
    }
  }

  /**
   * 标记助手消息上屏完毕并持久化。
   *
   * @param conversationId - 会话ID
   */
  function finishStreaming(conversationId: string): void {
    // 前置检查
    if (!activeConversation.value || activeConversation.value.id !== conversationId) return

    // 更新活动会话的最后一条消息的状态，并持久化磁盘
    const conv = activeConversation.value
    const lastMsg = conv.messages[conv.messages.length - 1]
    if (lastMsg && lastMsg.role === 'assistant' && lastMsg.streaming) {
      lastMsg.streaming = false
      syncSummary()
      persist(conv)
    }
  }

  return {
    summaries,
    activeConversation,
    activeId,
    loaded,
    init,
    createConversation,
    switchConversation,
    deleteConversation,
    addMessage,
    finishStreaming
  }
})
