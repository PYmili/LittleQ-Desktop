<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import AiProviderPanel from '@renderer/components/settings/AiProviderPanel.vue'
import PetPanel from '@renderer/components/settings/PetPanel.vue'

const router = useRouter()

/**
 * 设置类别列表。
 *
 * @remarks
 * 每个类别对应右侧不同内容区域。新增类别时在此追加即可。
 */
const categories = [
  { key: 'ai', label: 'AI 服务' },
  { key: 'pet', label: '宠物' },
  { key: 'general', label: '通用' },
  { key: 'about', label: '关于' }
] as const

/** 当前选中的设置类别 */
const activeCategory = ref<string>('ai')

/**
 * 切换右侧设置面板。
 *
 * @param key - 类别 key
 */
function selectCategory(key: string) {
  activeCategory.value = key
}

/**
 * 返回主页。
 */
function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="settings-layout">
    <aside class="settings-sidebar">
      <div class="settings-logo" @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        <span>LittleQ</span>
      </div>

      <nav class="category-nav">
        <div
          v-for="cat in categories"
          :key="cat.key"
          :class="['category-item', { active: activeCategory === cat.key }]"
          @click="selectCategory(cat.key)"
        >
          <el-icon v-if="cat.key === 'ai'"><Cpu /></el-icon>
          <el-icon v-else-if="cat.key === 'pet'"><Sunny /></el-icon>
          <el-icon v-else-if="cat.key === 'general'"><Setting /></el-icon>
          <el-icon v-else-if="cat.key === 'about'"><InfoFilled /></el-icon>
          <span>{{ cat.label }}</span>
        </div>
      </nav>
    </aside>

    <main class="settings-content">
      <header class="settings-header">
        <h2>{{ categories.find((c) => c.key === activeCategory)?.label }}</h2>
        <button class="close-btn" @click="goBack">
          <el-icon><Close /></el-icon>
        </button>
      </header>

      <div class="settings-body">
        <AiProviderPanel v-if="activeCategory === 'ai'" />

        <PetPanel v-else-if="activeCategory === 'pet'" />

        <div v-else-if="activeCategory === 'general'" class="placeholder-panel">
          <el-icon><Setting /></el-icon>
          <p>通用设置（开发中）</p>
        </div>

        <div v-else-if="activeCategory === 'about'" class="placeholder-panel">
          <el-icon><InfoFilled /></el-icon>
          <p>LittleQ Desktop v1.0.0</p>
          <span class="about-desc">AI Coding Agent 桌面应用</span>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.settings-layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #0d0d0f;
}

.settings-sidebar {
  width: 200px;
  min-width: 200px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: rgba(22, 22, 24, 0.85);
  backdrop-filter: blur(24px);
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.settings-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px 16px 16px;
  font-size: 18px;
  font-weight: 700;
  color: #e8e8ed;
  cursor: pointer;
  transition: color 0.15s ease;
}

.settings-logo:hover {
  color: #a2ecfb;
}

.category-nav {
  flex: 1;
  padding: 8px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
}

.category-nav::-webkit-scrollbar {
  width: 4px;
}

.category-nav::-webkit-scrollbar-track {
  background: transparent;
}

.category-nav::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 2px;
}

.category-nav::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.14);
}

.category-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  margin-bottom: 2px;
  border-radius: 8px;
  color: #9898a4;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.category-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: #d0d0d8;
}

.category-item.active {
  background: rgba(255, 255, 255, 0.08);
  color: #e8e8ed;
}

.settings-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.settings-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #e8e8ed;
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #9898a4;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.15s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #e8e8ed;
}

.settings-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.08) transparent;
}

.settings-body::-webkit-scrollbar {
  width: 6px;
}

.settings-body::-webkit-scrollbar-track {
  background: transparent;
}

.settings-body::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
}

.settings-body::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.14);
}

.placeholder-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #60606a;
  gap: 12px;
}

.placeholder-panel .el-icon {
  font-size: 48px;
}

.placeholder-panel p {
  font-size: 16px;
  color: #808090;
}

.about-desc {
  font-size: 13px;
  color: #505058;
}
</style>
