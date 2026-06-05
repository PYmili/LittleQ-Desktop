<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

import { ElMessage } from 'element-plus'

const PET_BASE_W = 300
const PET_BASE_H = 320

/** 计算当前像素尺寸 */
const calcPixelSize = computed(
  () =>
    `${Math.round(PET_BASE_W * (petPercent.value / 100))}×${Math.round(PET_BASE_H * (petPercent.value / 100))}`
)

/** 宠物是否显示 */
const petVisible = ref(false)
/** 缩放百分比（10~200） */
const petPercent = ref(30)
/** DEBUG 边框开关 */
const petDebug = ref(false)
/** 是否正在加载 */
const loading = ref(true)

/**
 * 加载当前宠物设置状态。
 */
onMounted(async () => {
  try {
    const visible = await window.api.petGetVisibility()
    petVisible.value = visible

    const scale = await window.api.petGetScale()
    petPercent.value = Math.round(scale * 100)

    const debug = await window.api.petGetDebug()
    petDebug.value = debug
  } catch (err) {
    console.error('Failed to load pet settings:', err)
  } finally {
    loading.value = false
  }
})

/**
 * 切换宠物显示/隐藏。
 */
async function togglePet() {
  try {
    const visible = await window.api.petToggleVisibility()
    petVisible.value = visible
  } catch (err) {
    console.error('Failed to toggle pet:', err)
    ElMessage.error('切换宠物状态失败')
  }
}

/**
 * 设置宠物缩放百分比。
 *
 * @param value - 百分比值（10~200）
 */
async function setPetScale(value: number) {
  const scale = value / 100
  try {
    await window.api.petSetScale(scale)
  } catch (err) {
    console.error('Failed to set pet scale:', err)
  }
}

/**
 * 切换 DEBUG 边框显示。
 */
async function toggleDebug() {
  try {
    await window.api.petSetDebug(petDebug.value)
  } catch (err) {
    console.error('Failed to toggle debug:', err)
    ElMessage.error('切换 DEBUG 状态失败')
  }
}
</script>

<template>
  <div class="pet-panel">
    <p class="panel-desc">控制桌面宠物的显示与外观。</p>

    <div class="setting-group">
      <div class="setting-row">
        <div class="setting-label">
          <span class="label-title">宠物开关</span>
          <span class="label-hint">{{ petVisible ? '已开启' : '已关闭' }}</span>
        </div>
        <el-switch v-model="petVisible" :loading="loading" @change="togglePet" />
      </div>

      <div class="setting-row setting-row-col">
        <div class="setting-label">
          <span class="label-title">宠物大小</span>
          <span class="label-hint">当前：{{ petPercent }}%（{{ calcPixelSize }}px）</span>
        </div>
        <el-slider
          v-model="petPercent"
          :min="10"
          :max="200"
          :step="10"
          :show-input="true"
          :format-tooltip="(val: number) => val + '%'"
          :disabled="loading"
          @change="setPetScale"
        />
      </div>

      <div class="setting-row">
        <div class="setting-label">
          <span class="label-title">DEBUG 边框</span>
          <span class="label-hint">显示宠物窗口调试边框</span>
        </div>
        <el-switch v-model="petDebug" :loading="loading" @change="toggleDebug" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pet-panel {
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

.setting-row-col {
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
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
