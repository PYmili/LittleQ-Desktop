<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@renderer/stores/chat'

const router = useRouter()
const chatStore = useChatStore()

/**
 * 侧边栏折叠状态。
 *
 * @remarks
 * `true` 时侧边栏收窄为仅图标模式（60px），`false` 时完整展开（260px）。
 */
const collapsed = ref(false)

/**
 * 切换侧边栏折叠状态。
 */
function toggleCollapse() {
  collapsed.value = !collapsed.value
}

/**
 * 创建新对话。
 *
 * @remarks
 * 调用 `chatStore.createConversation()` 创建新会话并使右侧面板切换到该会话。
 * 绑定于"新对话"按钮的 click 事件。
 */
function handleNewChat() {
  chatStore.createConversation()
}

/**
 * 删除指定的对话。
 *
 * @remarks
 * `e.stopPropagation()` 阻止冒泡以避免同时触发父元素的切换逻辑。
 *
 * @param id - 待删除的会话 ID
 * @param e - 点击事件对象
 */
function handleDelete(id: string, e: Event) {
  e.stopPropagation()
  chatStore.deleteConversation(id)
}
</script>

<template>
  <aside :class="['sidebar', { collapsed }]">
    <div class="sidebar-header">
      <span v-show="!collapsed" class="logo">LittleQ</span>
      <button class="collapse-btn" @click="toggleCollapse">
        <el-icon>
          <Fold v-if="!collapsed" />
          <Expand v-else />
        </el-icon>
      </button>
    </div>

    <button class="new-chat-btn" :title="collapsed ? '新对话' : ''" @click="handleNewChat">
      <el-icon><Plus /></el-icon>
      <span v-show="!collapsed">新对话</span>
    </button>

    <nav class="chat-list">
      <el-tooltip
        v-for="conv in chatStore.summaries"
        :key="conv.id"
        :disabled="!collapsed"
        :content="conv.title"
        placement="right"
        :show-after="300"
      >
        <div
          :class="['chat-item', { active: conv.id === chatStore.activeId }]"
          @click="chatStore.switchConversation(conv.id)"
        >
          <el-icon class="chat-icon"><ChatDotRound /></el-icon>
          <span v-show="!collapsed" class="chat-title">{{ conv.title }}</span>
          <button v-show="!collapsed" class="delete-btn" @click="handleDelete(conv.id, $event)">
            <el-icon><Delete /></el-icon>
          </button>
        </div>
      </el-tooltip>
    </nav>

    <div class="sidebar-footer">
      <el-tooltip :disabled="!collapsed" content="设置" placement="right" :show-after="300">
        <div class="footer-item" @click="router.push('/settings')">
          <el-icon><Setting /></el-icon>
          <span v-show="!collapsed">设置</span>
        </div>
      </el-tooltip>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 260px;
  min-width: 260px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--lq-bg-sidebar);
  backdrop-filter: blur(24px);
  border-right: 1px solid var(--lq-border-default);
  user-select: none;
  transition:
    width 0.25s ease,
    min-width 0.25s ease;
  overflow: hidden;
}

.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 12px;
}

.sidebar.collapsed .sidebar-header {
  justify-content: center;
  padding: 20px 0 12px;
}

.logo {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--lq-text-primary);
  white-space: nowrap;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--lq-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.collapse-btn:hover {
  background: var(--lq-bg-surface-hover);
  color: var(--lq-text-primary);
}

.new-chat-btn {
  margin: 0 12px 16px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--lq-border-strong);
  border-radius: 8px;
  background: var(--lq-bg-surface);
  color: var(--lq-text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.collapsed .new-chat-btn {
  margin: 0 8px 16px;
  padding: 10px 0;
  justify-content: center;
}

.new-chat-btn:hover {
  background: var(--lq-bg-surface-hover);
  border-color: var(--lq-border-strong);
  color: var(--lq-text-primary);
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
  scrollbar-width: thin;
  scrollbar-color: var(--lq-scrollbar-thumb) transparent;
}

.sidebar.collapsed .chat-list {
  padding: 0 4px;
}

.chat-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  margin-bottom: 2px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--lq-text-muted);
  font-size: 13px;
  transition: all 0.15s ease;
  overflow: hidden;
}

.sidebar.collapsed .chat-item {
  padding: 10px 0;
  justify-content: center;
  gap: 0;
}

.chat-item:hover {
  background: var(--lq-bg-surface-hover);
  color: var(--lq-text-secondary);
}

.chat-item.active {
  background: var(--lq-bg-surface-active);
  color: var(--lq-text-primary);
}

.chat-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.chat-title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: var(--lq-text-hint);
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.chat-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: var(--lq-accent-red-bg-hover);
  color: var(--lq-accent-red);
}

.sidebar-footer {
  padding: 12px 8px;
  border-top: 1px solid var(--lq-border-default);
}

.sidebar.collapsed .sidebar-footer {
  padding: 12px 4px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 8px;
  border-radius: 8px;
  color: var(--lq-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  overflow: hidden;
}

.sidebar.collapsed .footer-item {
  justify-content: center;
  gap: 0;
}

.footer-item:hover {
  background: var(--lq-bg-surface-hover);
  color: var(--lq-text-secondary);
}
</style>
