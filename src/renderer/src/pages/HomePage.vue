<script setup lang="ts">
import { onMounted } from 'vue'
import { useChatStore } from '@renderer/stores/chat'
import SideBar from '@renderer/components/SideBar.vue'
import ChatArea from '@renderer/components/ChatArea.vue'

const chatStore = useChatStore()

onMounted(() => {
  chatStore.init()
})

/**
 * HomePage - 应用主页面。
 *
 * @remarks
 * 横向 flex 布局：左侧 `SideBar`（固定 260px）+ 右侧 `ChatArea`（flex: 1 填充剩余空间）。
 * 在 `onMounted` 中从磁盘加载历史会话数据。
 */
</script>

<template>
  <div class="home-layout">
    <SideBar />
    <ChatArea />
  </div>
</template>

<style scoped>
.home-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
