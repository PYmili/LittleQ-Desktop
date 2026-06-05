<script setup lang="ts">
import { useThemeStore } from '@renderer/stores/theme'

/**
 * 通用设置面板。
 *
 * @remarks
 * 包含主题切换（暗色/亮色）等全局偏好设置。
 */
const themeStore = useThemeStore()
</script>

<template>
  <div class="general-panel">
    <p class="panel-desc">全局偏好设置，影响整个应用外观。</p>

    <div class="setting-group">
      <div class="setting-row">
        <div class="setting-label">
          <span class="label-title">暗色主题</span>
          <span class="label-hint">{{ themeStore.isDark ? '已开启' : '已关闭' }}</span>
        </div>
        <el-switch v-model="themeStore.isDark" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.general-panel {
  max-width: 480px;
}

.panel-desc {
  font-size: 13px;
  color: var(--lq-text-dim);
  margin: 0 0 24px;
  line-height: 1.6;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--lq-text-secondary);
}

.label-hint {
  font-size: 12px;
  color: var(--lq-text-hint);
}
</style>
