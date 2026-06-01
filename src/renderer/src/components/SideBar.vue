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
  background: rgba(22, 22, 24, 0.85);
  backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
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
  color: #e8e8ed;
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
  color: #9898a4;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.collapse-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e8e8ed;
}

.new-chat-btn {
  margin: 0 12px 16px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #c8c8d0;
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
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.16);
  color: #e8e8ed;
}

.chat-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 8px;
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
  color: #9898a4;
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
  background: rgba(255, 255, 255, 0.05);
  color: #d0d0d8;
}

.chat-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: #e8e8ed;
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
  color: #60606a;
  cursor: pointer;
  opacity: 0;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.chat-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.sidebar-footer {
  padding: 12px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
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
  color: #9898a4;
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
  background: rgba(255, 255, 255, 0.05);
  color: #d0d0d8;
}
</style>
