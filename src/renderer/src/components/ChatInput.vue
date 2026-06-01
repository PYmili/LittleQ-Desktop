<script setup lang="ts">
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useChatStore, type MessageModel } from '@renderer/stores/chat'

const chatStore = useChatStore()
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isSending = ref(false)
const providerName = ref('未配置')

/**
 * 当前使用的 Provider 与模型。
 *
 * @remarks
 * 启动时从 `settings.json` 的 `selectedProviderId` 自动加载。
 * 若未选中任何 Provider，使用默认占位值，此时发送消息会提示先配置。
 */
const chatConfig = reactive({
  providerId: 'default',
  model: 'gpt-4o'
})

/** 是否已配置可用的 Provider */
const hasProvider = computed(() => chatConfig.providerId !== 'default')

/**
 * 从设置中加载当前选中的 Provider 配置。
 */
onMounted(async () => {
  try {
    const result = await window.api.settingsLoad()
    if (result.selectedProviderId) {
      const provider = result.providers.find((p) => p.id === result.selectedProviderId)
      if (provider) {
        chatConfig.providerId = provider.id
        chatConfig.model = provider.defaultModel
        providerName.value = provider.name
      }
    }
  } catch {
    // 设置加载失败，使用默认值
  }
})

/**
 * 自动调整 textarea 高度。
 *
 * @remarks
 * 每次输入后先重置高度，再根据 `scrollHeight` 扩展，最大高度限制为 160px。
 */
function autoResize() {
  nextTick(() => {
    const el = textareaRef.value
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  })
}

/**
 * 发送消息的主逻辑。
 *
 * @remarks
 * 1. 若当前无活跃会话，自动创建新会话
 * 2. 将用户输入作为 `role: 'user'` 的消息追加到会话
 * 3. 调用 `window.api.aiStream` 通过主进程发起流式 AI 对话
 * 4. 通过 `window.api.onAiChunk` 实时接收 AI 回复
 */
async function handleSend() {
  const text = inputText.value.trim()
  if (!text || isSending.value) return

  const convId = chatStore.activeId
  if (!convId) {
    chatStore.createConversation()
  }

  const targetId = chatStore.activeId!
  chatStore.addMessage(targetId, { role: 'user', content: text })
  inputText.value = ''
  autoResize()

  isSending.value = true
  chatStore.addMessage(targetId, { role: 'assistant', content: '', streaming: true })

  const messages = buildMessages()
  const unsub = window.api.onAiChunk((chunk) => {
    if (chunk.type === 'content' && chunk.text) {
      appendAssistantContent(chunk.text)
    } else if (chunk.type === 'error') {
      appendAssistantContent(`\n\n[错误] ${chunk.error}`)
      chatStore.finishStreaming(targetId)
    } else if (chunk.type === 'done') {
      chatStore.finishStreaming(targetId)
      unsub()
      isSending.value = false
    }
  })

  try {
    await window.api.aiStream({ messages, config: { ...chatConfig } })
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : '请求失败'
    appendAssistantContent(`\n\n[错误] ${errorMsg}`)
    chatStore.finishStreaming(targetId)
    unsub()
    isSending.value = false
  }
}

/**
 * 构建发送给 AI 的消息数组。
 *
 * @remarks
 * 将当前活跃会话的 `MessageModel[]` 转换为 AI 消息格式。
 *
 * @returns 可传递给 `aiStream` 的消息数组
 */
function buildMessages(): { role: string; content: string }[] {
  const conv = chatStore.activeConversation
  if (!conv) return []
  return conv.messages
    .filter((m) => m.content) // 过滤空消息（如刚创建尚未收到回复的 assistant 消息）
    .map((m) => ({ role: m.role, content: m.content }))
}

/**
 * 向当前助手消息追加文本。
 *
 * @param text - 追加的文本
 */
function appendAssistantContent(text: string) {
  const conv = chatStore.activeConversation
  if (!conv) return
  const messages = conv.messages as MessageModel[]
  const lastMsg = messages[messages.length - 1]
  if (lastMsg && lastMsg.role === 'assistant') {
    lastMsg.content += text
  }
}

/**
 * 键盘事件处理。
 *
 * @remarks
 * - **Enter**（不含 Shift）：发送消息
 * - **Shift+Enter**：换行
 *
 * @param e - KeyboardEvent 事件对象
 */
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="chat-input-area">
    <div class="input-wrapper">
      <textarea
        ref="textareaRef"
        v-model="inputText"
        class="input-field"
        placeholder="输入消息，Enter 发送，Shift+Enter 换行"
        rows="1"
        :disabled="isSending"
        @input="autoResize"
        @keydown="handleKeydown"
      />
      <button
        class="send-btn"
        :class="{ active: inputText.trim() }"
        :disabled="!inputText.trim() || isSending"
        @click="handleSend"
      >
        <el-icon><Pointer /></el-icon>
      </button>
    </div>
    <div class="provider-indicator" :class="{ active: hasProvider }">
      <span class="provider-dot" />
      <span>{{
        hasProvider
          ? `${providerName} / ${chatConfig.model}`
          : '未配置 AI 服务 — 请先在设置中添加 Provider'
      }}</span>
    </div>
  </div>
</template>

<style scoped>
.chat-input-area {
  padding: 0 20px 20px;
}

.input-wrapper {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 8px 8px 8px 16px;
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: rgba(99, 102, 241, 0.4);
}

.input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: #d0d0d8;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  max-height: 160px;
  padding: 4px 0;
  font-family: inherit;
  overflow-y: auto;
  scrollbar-width: none;
}

.input-field::-webkit-scrollbar {
  display: none;
}

.input-field::placeholder {
  color: #505058;
}

.input-field:disabled {
  opacity: 0.5;
}

.send-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #60606a;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.send-btn.active {
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #e8e8ed;
}

.send-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

.send-btn.active:hover:not(:disabled) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.send-btn:disabled {
  cursor: not-allowed;
}

.provider-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0 0 4px;
  font-size: 12px;
  color: #60606a;
}

.provider-indicator.active {
  color: #70707a;
}

.provider-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: #505058;
}

.provider-indicator.active .provider-dot {
  background: #34d399;
}
</style>
