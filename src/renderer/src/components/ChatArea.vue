<script setup lang="ts">
import MessageList from './MessageList.vue'
import ChatInput from './ChatInput.vue'

/**
 * ChatArea - 对话主区域。
 *
 * @remarks
 * 纵向布局：`MessageList`（flex: 1 填充剩余空间）+ `ChatInput`（底部固定输入区）。
 * 通过 `useChatStore` 的 `activeConversation` 控制展示内容。
 * 无活跃会话时由 `MessageList` 内部展示空状态引导。
 */
</script>

<template>
  <main class="chat-area">
    <MessageList />
    <ChatInput />
  </main>
</template>

<style scoped>
.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100vh;
  background: var(--lq-bg-app);
}
</style>
