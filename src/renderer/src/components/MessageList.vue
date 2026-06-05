<script setup lang="ts">
/**
 * 消息列表组件。
 *
 * @remarks
 * 展示当前会话的消息气泡、时间戳和操作按钮（复制等）。
 * 支持自定义滚动条样式，流式输出时自动跟随滚动到底部。
 * AI 回复完成后自动将 Markdown 内容渲染为 HTML。
 */
import { ref, watch, nextTick, computed, onMounted } from 'vue'
import { useChatStore } from '@renderer/stores/chat'
import { useToast } from '@renderer/composables/useToast'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'
import TypingIndicator from './TypingIndicator.vue'

const chatStore = useChatStore()
const toast = useToast()
const listRef = ref<HTMLElement | null>(null)

const md = new MarkdownIt({
  breaks: true,
  linkify: true,
  highlight(code: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch {
        // fall through
      }
    }
    return hljs.highlightAuto(code).value
  }
})

/**
 * 将 Markdown 文本渲染为 HTML。
 *
 * @param content - 原始 Markdown 文本
 * @returns 渲染后的 HTML 字符串
 */
function renderMarkdown(content: string): string {
  if (!content) return ''
  try {
    return md.render(content)
  } catch {
    return content
  }
}

/**
 * 滚动消息列表至底部。
 *
 * @remarks
 * 在 `nextTick` 中执行以确保 DOM 已更新。
 */
function scrollToBottom() {
  nextTick(() => {
    if (listRef.value) {
      listRef.value.scrollTop = listRef.value.scrollHeight
    }
  })
}

/** 最后一条消息的内容，用于流式输出时触发滚动 */
const lastMessageContent = computed(() => {
  const msgs = chatStore.activeConversation?.messages
  if (!msgs || msgs.length === 0) return ''
  return msgs[msgs.length - 1].content
})

watch(lastMessageContent, scrollToBottom)

watch(
  () => chatStore.activeConversation?.messages.length,
  () => {
    scrollToBottom()
    // 新消息加入后也观察其内容变化
  }
)

watch(
  () => chatStore.activeId,
  () => {
    nextTick(scrollToBottom)
  }
)

onMounted(scrollToBottom)

/**
 * 格式化时间戳为 HH:mm 格式。
 *
 * @param ts - 毫秒级 Unix 时间戳
 * @returns 格式化的时间字符串，如 "14:30"
 */
function formatTime(ts: number): string {
  const d = new Date(ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * 复制消息内容到剪贴板。
 *
 * @param content - 要复制的文本
 */
async function copyMessage(content: string) {
  try {
    await navigator.clipboard.writeText(content)
    toast.success('已复制到剪贴板')
  } catch {
    toast.error('复制失败')
  }
}
</script>

<template>
  <div v-if="chatStore.activeConversation" ref="listRef" class="message-list">
    <div v-if="chatStore.activeConversation.messages.length === 0" class="empty-hint">
      <p class="empty-title">开始新的对话</p>
      <p class="empty-desc">输入消息，开始与 LittleQ 交流</p>
    </div>

    <div
      v-for="msg in chatStore.activeConversation.messages"
      :key="msg.id"
      :class="['message', msg.role]"
    >
      <div class="message-bubble">
        <TypingIndicator v-if="msg.role === 'assistant' && msg.streaming && !msg.content" />
        <!-- eslint-disable-next-line vue/no-v-html -->
        <div
          v-else-if="msg.role === 'assistant' && !msg.streaming && msg.content"
          class="message-content markdown-body"
          v-html="renderMarkdown(msg.content)"
        />
        <p v-else class="message-content">{{ msg.content }}</p>
        <div class="message-footer">
          <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
          <div class="message-actions">
            <button class="action-btn" title="复制" @click="copyMessage(msg.content)">
              <CopyDocument />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="empty-hint">
    <p class="empty-title">LittleQ</p>
    <p class="empty-desc">点击左侧"新对话"开始</p>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  scrollbar-width: thin;
  scrollbar-color: var(--lq-scrollbar-thumb) transparent;
}

.empty-hint {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--lq-text-hint);
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--lq-text-dim);
  margin-bottom: 8px;
}

.empty-desc {
  font-size: 14px;
  color: var(--lq-text-placeholder);
}

.message {
  display: flex;
  max-width: 80%;
}

.message.user {
  align-self: flex-end;
}

.message.assistant {
  align-self: flex-start;
}

.message-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.6;
  position: relative;
  min-width: 120px;
}

.message-content {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.message.user .message-bubble {
  background: var(--lq-bg-user-bubble);
  color: var(--lq-text-primary);
  border-bottom-right-radius: 6px;
}

.message.assistant .message-bubble {
  background: var(--lq-bg-surface);
  border: 1px solid var(--lq-border-default);
  color: var(--lq-text-secondary);
  border-bottom-left-radius: 6px;
}

.message-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
}

.message-time {
  font-size: 11px;
  opacity: 0.5;
}

.message-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.message-bubble:hover .message-actions {
  opacity: 1;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: inherit;
  opacity: 0.5;
  cursor: pointer;
  transition:
    opacity 0.15s ease,
    background 0.15s ease;
  font-size: 11px;
}

.action-btn:hover {
  opacity: 1;
  background: var(--lq-bg-surface-active);
}

/* 自定义滚动条 */
.message-list::-webkit-scrollbar {
  width: 6px;
}

.message-list::-webkit-scrollbar-track {
  background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
  background: var(--lq-scrollbar-thumb);
  border-radius: 3px;
}

.message-list::-webkit-scrollbar-thumb:hover {
  background: var(--lq-scrollbar-thumb-hover);
}

.message-list::-webkit-scrollbar-thumb:active {
  background: var(--lq-scrollbar-thumb-active);
}

/* Markdown 渲染内容样式 */
.message-content.markdown-body {
  line-height: 1.7;
  white-space: normal;
}

.message-content.markdown-body :deep(h1),
.message-content.markdown-body :deep(h2),
.message-content.markdown-body :deep(h3),
.message-content.markdown-body :deep(h4) {
  margin: 16px 0 8px;
  font-weight: 600;
  color: var(--lq-text-primary);
}

.message-content.markdown-body :deep(h1) {
  font-size: 1.4em;
}
.message-content.markdown-body :deep(h2) {
  font-size: 1.25em;
}
.message-content.markdown-body :deep(h3) {
  font-size: 1.1em;
}

.message-content.markdown-body :deep(p) {
  margin: 4px 0;
}

.message-content.markdown-body :deep(ul),
.message-content.markdown-body :deep(ol) {
  padding-left: 20px;
  margin: 6px 0;
}

.message-content.markdown-body :deep(li) {
  margin: 2px 0;
}

.message-content.markdown-body :deep(code) {
  font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace;
  font-size: 0.9em;
}

.message-content.markdown-body :deep(p > code),
.message-content.markdown-body :deep(li > code) {
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--lq-code-inline-bg);
  color: var(--lq-code-inline-text);
}

.message-content.markdown-body :deep(pre) {
  margin: 10px 0;
  padding: 14px 16px;
  border-radius: 8px;
  background: var(--lq-codeblock-bg);
  overflow-x: auto;
}

.message-content.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 0.85em;
  line-height: 1.55;
}

.message-content.markdown-body :deep(blockquote) {
  margin: 10px 0;
  padding: 6px 14px;
  border-left: 3px solid var(--lq-accent-indigo-border);
  background: var(--lq-bg-surface);
  border-radius: 0 6px 6px 0;
  color: var(--lq-text-muted);
}

.message-content.markdown-body :deep(table) {
  margin: 10px 0;
  border-collapse: collapse;
  width: 100%;
  font-size: 0.9em;
}

.message-content.markdown-body :deep(th),
.message-content.markdown-body :deep(td) {
  padding: 6px 12px;
  border: 1px solid var(--lq-border-default);
  text-align: left;
}

.message-content.markdown-body :deep(th) {
  background: var(--lq-bg-surface-hover);
  font-weight: 600;
}

.message-content.markdown-body :deep(a) {
  color: var(--lq-accent-indigo-text);
  text-decoration: none;
}

.message-content.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.message-content.markdown-body :deep(hr) {
  margin: 14px 0;
  border: none;
  border-top: 1px solid var(--lq-border-default);
}

.message-content.markdown-body :deep(img) {
  max-width: 100%;
  border-radius: 6px;
}
</style>
