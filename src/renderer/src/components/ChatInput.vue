<script setup lang="ts">
/**
 * 聊天输入区组件。
 *
 * @remarks
 * 包含消息输入框、发送按钮、Provider 指示器及模型切换下拉。
 * 支持 Enter 发送、Shift+Enter 换行，自动缩放文本框高度。
 */
import { ref, reactive, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useChatStore, type MessageModel } from '@renderer/stores/chat'

/**
 * Provider 配置信息（从 settings:load 返回）。
 *
 * @remarks
 * 包含完整 Provider 元数据及模型列表，用于模型切换。
 */
interface ProviderInfo {
  id: string
  name: string
  type: string
  apiKey: string
  baseURL?: string
  models: string[]
  defaultModel: string
}

const chatStore = useChatStore()
const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const isSending = ref(false)
const providerName = ref('未配置')
const availableModels = ref<string[]>([])
const showModelDropdown = ref(false)
const currentProviderData = ref<ProviderInfo | null>(null)
const modelDropdownRef = ref<HTMLDivElement | null>(null)

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
    // 从主进程加载 Provider 配置
    const result = await window.api.settingsLoad()
    if (result.selectedProviderId) {
      // 查找当前选中的 Provider
      const provider = result.providers.find((p) => p.id === result.selectedProviderId)
      if (provider) {
        // 同步 Provider 信息到组件状态
        chatConfig.providerId = provider.id
        chatConfig.model = provider.defaultModel
        providerName.value = provider.name
        availableModels.value = [...provider.models]
        currentProviderData.value = provider as ProviderInfo
      }
    }
  } catch {
    // 设置加载失败，使用默认值
  }

  // 注册全局点击监听用于关闭模型下拉
  document.addEventListener('click', onDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
})

/**
 * 点击外部关闭模型下拉。
 *
 * @param e - MouseEvent
 */
function onDocumentClick(e: MouseEvent) {
  // 点击目标在模型下拉面板外部时关闭下拉
  if (modelDropdownRef.value && !modelDropdownRef.value.contains(e.target as Node)) {
    showModelDropdown.value = false
  }
}

/**
 * 切换模型下拉面板的显示状态。
 */
function toggleModelDropdown() {
  showModelDropdown.value = !showModelDropdown.value
}

/**
 * 选中模型并持久化到 settings.json。
 *
 * @param model - 模型名称
 */
async function selectModel(model: string) {
  // 更新当前使用的模型
  chatConfig.model = model
  showModelDropdown.value = false

  if (currentProviderData.value) {
    try {
      // 通过 IPC 持久化新的默认模型到 settings.json
      await window.api.settingsProviderAdd({
        ...currentProviderData.value,
        defaultModel: model
      })
    } catch (err) {
      console.error('Failed to save model preference:', err)
    }
  }
}

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

  // 若当前无活跃会话，自动创建
  const convId = chatStore.activeId
  if (!convId) {
    chatStore.createConversation()
  }

  const targetId = chatStore.activeId!
  // 添加用户消息到会话
  chatStore.addMessage(targetId, { role: 'user', content: text })
  inputText.value = ''
  autoResize()

  isSending.value = true
  // 创建空助手消息占位，streaming 标记为 true
  chatStore.addMessage(targetId, { role: 'assistant', content: '', streaming: true })

  // 构建发送给 AI 的消息列表
  const messages = buildMessages()
  // 注册流式 chunk 监听器
  const unsub = window.api.onAiChunk((chunk) => {
    if (chunk.type === 'content' && chunk.text) {
      // 逐步追加 AI 回复文本
      appendAssistantContent(chunk.text)
    } else if (chunk.type === 'error') {
      // 显示错误信息并标记流式结束
      appendAssistantContent(`\n\n[错误] ${chunk.error}`)
      chatStore.finishStreaming(targetId)
    } else if (chunk.type === 'done') {
      // 标记流式完成，清理监听器
      chatStore.finishStreaming(targetId)
      unsub()
      isSending.value = false
    }
  })

  try {
    // 发起 AI 流式对话请求
    await window.api.aiStream({ messages, config: { ...chatConfig } })
  } catch (err) {
    // 请求失败时追加错误提示并清理状态
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
  return (
    conv.messages
      // 过滤空消息（如刚创建尚未收到回复的 assistant 消息）
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }))
  )
}

/**
 * 向当前助手消息追加文本。
 *
 * @param text - 追加的文本
 */
function appendAssistantContent(text: string) {
  const conv = chatStore.activeConversation
  if (!conv) return
  // 获取最后一条消息并检查是否为 assistant
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
  // Enter（不含 Shift）时发送消息，阻止默认换行
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
      <div v-if="hasProvider" ref="modelDropdownRef" class="model-selector">
        <span class="model-current" @click="toggleModelDropdown">
          {{ providerName }} / {{ chatConfig.model }}
        </span>
        <div v-if="showModelDropdown" class="model-dropdown">
          <div
            v-for="model in availableModels"
            :key="model"
            :class="['model-item', { selected: model === chatConfig.model }]"
            @click="selectModel(model)"
          >
            <el-icon v-if="model === chatConfig.model"><Select /></el-icon>
            <span>{{ model }}</span>
          </div>
        </div>
      </div>
      <span v-else>未配置 AI 服务 — 请先在设置中添加 Provider</span>
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
  border: 1px solid var(--lq-border-default);
  background: var(--lq-bg-surface);
  transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
  border-color: var(--lq-border-focus);
}

.input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  color: var(--lq-text-secondary);
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
  color: var(--lq-text-placeholder);
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
  background: var(--lq-bg-surface);
  color: var(--lq-text-hint);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.send-btn.active {
  background: var(--lq-accent-gradient);
  color: var(--lq-text-on-accent);
}

.send-btn:hover:not(:disabled) {
  background: var(--lq-bg-surface-hover);
}

.send-btn.active:hover:not(:disabled) {
  background: var(--lq-accent-gradient-hover);
}

.send-btn:disabled {
  cursor: not-allowed;
}

.provider-indicator {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: 6px 0 0 4px;
  font-size: 12px;
  color: var(--lq-text-hint);
}

.provider-indicator.active {
  color: var(--lq-text-faint);
}

.provider-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 10px;
  background: var(--lq-text-placeholder);
}

.provider-indicator.active .provider-dot {
  background: var(--lq-accent-green-dot);
}

.model-selector {
  position: relative;
}

.model-current {
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.model-current:hover {
  background: var(--lq-bg-surface-hover);
}

.model-current::after {
  content: '';
  display: inline-block;
  width: 0;
  height: 0;
  margin-left: 2px;
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
  opacity: 0.5;
}

.model-dropdown {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  min-width: 100%;
  padding: 6px;
  border: 1px solid var(--lq-border-default);
  border-radius: 10px;
  background: var(--lq-bg-sidebar);
  backdrop-filter: blur(24px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 100;
}

.model-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border-radius: 6px;
  color: var(--lq-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.model-item:hover {
  background: var(--lq-bg-surface-hover);
  color: var(--lq-text-secondary);
}

.model-item.selected {
  background: var(--lq-accent-indigo-bg);
  color: var(--lq-accent-indigo-text);
}

.model-item .el-icon {
  font-size: 14px;
  flex-shrink: 0;
}
</style>
