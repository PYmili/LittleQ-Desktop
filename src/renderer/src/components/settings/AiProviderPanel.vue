<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { ProviderType } from '@renderer/types/provider'
import { useToast } from '@renderer/composables/useToast'
import { useFormValidation } from '@renderer/composables/useFormValidation'

/**
 * AI Provider 配置表单。
 *
 * @remarks
 * 配置持久化到 `~/.little-q-desktop/settings.json`。
 * 表单包含字段级验证提示和 Toast 操作反馈。
 * 支持添加 Provider 列表和导入/导出 JSON 配置文件。
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

const toast = useToast()

const { setValue, touch, touchAll, errors, validateAll } = useFormValidation({
  name: [{ validator: (v) => v.trim().length > 0, message: '名称不能为空' }],
  apiKey: [{ validator: (v) => v.trim().length > 0, message: 'API Key 不能为空' }],
  model: [{ validator: (v) => v.trim().length > 0, message: '模型名称不能为空' }]
})

const providers = ref<ProviderInfo[]>([])
const selectedProviderId = ref<string | null>(null)
const editingId = ref<string | null>(null)
const saving = ref(false)

/** 回填时的原始数据，用于对比是否修改 */
const originalSnapshot = ref<ProviderInfo | null>(null)

/** 表单是否被修改过（编辑模式下） */
const dirty = computed(() => {
  if (!editingId.value || !originalSnapshot.value) return true
  const o = originalSnapshot.value
  return (
    form.name.trim() !== o.name ||
    form.type !== o.type ||
    form.apiKey.trim() !== o.apiKey ||
    (form.baseURL?.trim() || undefined) !== (o.baseURL || undefined) ||
    form.model.trim() !== o.defaultModel
  )
})

/** 保存按钮是否可用 */
const saveDisabled = computed(() => {
  if (saving.value) return true
  if (editingId.value) return !dirty.value
  return false
})

const form = reactive({
  name: '',
  type: 'openai' as ProviderType,
  apiKey: '',
  baseURL: '',
  model: ''
})

/** 同步 reactive form 到验证器 */
function syncFormToValidator() {
  setValue('name', form.name)
  setValue('apiKey', form.apiKey)
  setValue('model', form.model)
}

const typeOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenAI 兼容', value: 'openai-compatible' },
  { label: 'Anthropic', value: 'anthropic' }
] as const

async function loadProviders() {
  const result = await window.api.settingsLoad()
  providers.value = result.providers
  selectedProviderId.value = result.selectedProviderId

  if (result.selectedProviderId) {
    const provider = providers.value.find((p) => p.id === result.selectedProviderId)
    if (provider) fillForm(provider)
  }
}

onMounted(loadProviders)

function handleTypeChange(value: ProviderType) {
  form.type = value
  syncFormToValidator()
}

function handleInput() {
  syncFormToValidator()
}

function handleBlur(field: string) {
  syncFormToValidator()
  touch(field)
}

/**
 * 保存 Provider 配置（新增或更新）。
 */
async function handleSave() {
  syncFormToValidator()
  if (!validateAll()) {
    toast.warning('请填写所有必填项')
    return
  }

  saving.value = true

  try {
    const provider: ProviderInfo = {
      id: editingId.value || Date.now().toString(36),
      name: form.name.trim(),
      type: form.type,
      apiKey: form.apiKey.trim(),
      baseURL: form.baseURL.trim() || undefined,
      models: [form.model.trim()],
      defaultModel: form.model.trim()
    }
    await window.api.settingsProviderAdd(provider)
    await loadProviders()

    resetForm()

    toast.success(
      editingId.value
        ? `Provider "${provider.name}" 已更新`
        : `Provider "${provider.name}" 添加成功`
    )
  } catch (err) {
    toast.error('保存失败，请重试')
    console.error(err)
  } finally {
    saving.value = false
  }
}

async function handleRemove(id: string, name: string) {
  await window.api.settingsProviderRemove(id)
  await loadProviders()
  toast.info(`已移除 "${name}"`)
}

/**
 * 将 Provider 数据回填到表单。
 *
 * @param provider - Provider 配置
 */
function fillForm(provider: ProviderInfo) {
  editingId.value = provider.id
  form.name = provider.name
  form.type = provider.type as ProviderType
  form.apiKey = provider.apiKey
  form.baseURL = provider.baseURL || ''
  form.model = provider.defaultModel

  originalSnapshot.value = { ...provider }
  syncFormToValidator()
}

/**
 * 选中 Provider 并将数据加载到表单。
 *
 * @param id - Provider ID
 */
async function handleSelect(id: string) {
  await window.api.settingsProviderSelect(id)
  selectedProviderId.value = id

  const provider = providers.value.find((p) => p.id === id)
  if (provider) fillForm(provider)
}

/**
 * 清空表单，退出编辑模式。
 */
function resetForm() {
  editingId.value = null
  originalSnapshot.value = null
  form.name = ''
  form.type = 'openai'
  form.apiKey = ''
  form.baseURL = ''
  form.model = ''
  setValue('name', '')
  setValue('apiKey', '')
  setValue('model', '')
  touchAll()
}

async function handleExport() {
  try {
    const saved = await window.api.settingsExport()
    if (saved) {
      toast.success('配置已导出')
    }
  } catch {
    toast.error('导出失败')
  }
}

async function handleImport() {
  try {
    const result = await window.api.settingsImport()
    if (result) {
      await loadProviders()
      toast.success(`导入了 ${result.length} 个 Provider`)
    }
  } catch {
    toast.error('导入失败，请检查文件格式')
  }
}
</script>

<template>
  <div class="provider-panel">
    <p class="panel-desc">
      配置 AI 服务提供方。配置将保存到 <code>~/.little-q-desktop/settings.json</code>。
    </p>

    <div class="form-group" :class="{ 'has-error': errors.name }">
      <label class="form-label"> 名称 <span class="required">*</span> </label>
      <input
        v-model="form.name"
        class="form-input"
        placeholder="例如：我的 OpenAI、DeepSeek"
        @input="handleInput"
        @blur="handleBlur('name')"
      />
      <span v-if="errors.name" class="field-error">{{ errors.name }}</span>
    </div>

    <div class="form-group">
      <label class="form-label">类型</label>
      <div class="type-selector">
        <button
          v-for="opt in typeOptions"
          :key="opt.value"
          :class="['type-option', { active: form.type === opt.value }]"
          @click="handleTypeChange(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>
    </div>

    <div class="form-group" :class="{ 'has-error': errors.apiKey }">
      <label class="form-label"> API Key <span class="required">*</span> </label>
      <input
        v-model="form.apiKey"
        class="form-input"
        type="password"
        placeholder="sk-..."
        @input="handleInput"
        @blur="handleBlur('apiKey')"
      />
      <span v-if="errors.apiKey" class="field-error">{{ errors.apiKey }}</span>
    </div>

    <div class="form-group">
      <label class="form-label">Base URL</label>
      <input
        v-model="form.baseURL"
        class="form-input"
        placeholder="默认：https://api.openai.com/v1"
        @input="handleInput"
      />
      <span class="form-hint"> OpenAI / Anthropic 可留空使用官方地址；兼容接口必须填写 </span>
    </div>

    <div class="form-group" :class="{ 'has-error': errors.model }">
      <label class="form-label"> 默认模型 <span class="required">*</span> </label>
      <input
        v-model="form.model"
        class="form-input"
        placeholder="例如：gpt-4o、claude-sonnet-4-20250514"
        @input="handleInput"
        @blur="handleBlur('model')"
      />
      <span v-if="errors.model" class="field-error">{{ errors.model }}</span>
    </div>

    <div class="form-actions">
      <button class="save-btn" :disabled="saveDisabled" @click="handleSave">
        {{ saving ? '保存中...' : editingId ? '保存修改' : '添加 Provider' }}
      </button>
      <button v-if="editingId" class="cancel-btn" @click="resetForm">取消编辑</button>
    </div>

    <div v-if="providers.length > 0" class="provider-list">
      <h3 class="list-title">已配置的 Provider</h3>
      <div
        v-for="p in providers"
        :key="p.id"
        :class="['provider-card', { selected: p.id === selectedProviderId }]"
        @click="handleSelect(p.id)"
      >
        <div class="provider-select-indicator">
          <el-icon v-if="p.id === selectedProviderId"><Select /></el-icon>
        </div>
        <div class="provider-info">
          <span class="provider-name">{{ p.name }}</span>
          <span class="provider-type">{{ p.type }}</span>
          <span class="provider-model">{{ p.defaultModel }}</span>
        </div>
        <button class="remove-btn" @click.stop="handleRemove(p.id, p.name)">
          <el-icon><Delete /></el-icon>
        </button>
      </div>
    </div>

    <div class="import-export">
      <button class="action-btn" @click="handleExport">
        <el-icon><Upload /></el-icon>
        导出配置
      </button>
      <button class="action-btn" @click="handleImport">
        <el-icon><Download /></el-icon>
        导入配置
      </button>
    </div>
  </div>
</template>

<style scoped>
.provider-panel {
  max-width: 560px;
}

.panel-desc {
  font-size: 13px;
  color: #70707a;
  margin-bottom: 24px;
  line-height: 1.6;
}

.panel-desc code {
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  font-size: 12px;
  color: #a2ecfb;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #9898a4;
  margin-bottom: 6px;
}

.required {
  color: #ef4444;
  margin-left: 2px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #d0d0d8;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: #505058;
}

.form-input:focus {
  border-color: rgba(99, 102, 241, 0.4);
}

.form-group.has-error .form-input {
  border-color: rgba(239, 68, 68, 0.4);
}

.field-error {
  display: block;
  font-size: 12px;
  color: #f87171;
  margin-top: 4px;
}

.form-hint {
  display: block;
  font-size: 12px;
  color: #505058;
  margin-top: 4px;
}

.type-selector {
  display: flex;
  gap: 8px;
}

.type-option {
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #9898a4;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-option:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #d0d0d8;
}

.type-option.active {
  background: rgba(99, 102, 241, 0.15);
  border-color: rgba(99, 102, 241, 0.3);
  color: #a5b4fc;
}

.form-actions {
  display: flex;
  gap: 12px;
  padding-top: 8px;
}

.save-btn {
  padding: 10px 28px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #4f46e5, #7c3aed);
  color: #e8e8ed;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: transparent;
  color: #9898a4;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #d0d0d8;
}

.provider-list {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.list-title {
  font-size: 14px;
  font-weight: 600;
  color: #9898a4;
  margin-bottom: 12px;
}

.provider-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.15s ease;
}

.provider-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}

.provider-card.selected {
  background: rgba(99, 102, 241, 0.1);
  border-color: rgba(99, 102, 241, 0.3);
}

.provider-select-indicator {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818cf8;
  font-size: 16px;
  flex-shrink: 0;
}

.provider-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.provider-name {
  font-size: 14px;
  font-weight: 500;
  color: #d0d0d8;
}

.provider-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(99, 102, 241, 0.12);
  color: #a5b4fc;
}

.provider-model {
  font-size: 12px;
  color: #70707a;
}

.remove-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #60606a;
  cursor: pointer;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.import-export {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.04);
  color: #9898a4;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #d0d0d8;
}
</style>
