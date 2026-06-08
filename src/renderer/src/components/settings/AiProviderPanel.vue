<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import type { ProviderType, ProviderInfo } from '@renderer/types/provider'
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

const toast = useToast()

const { setValue, touch, touchAll, errors, validateAll } = useFormValidation({
  name: [{ validator: (v) => v.trim().length > 0, message: '名称不能为空' }],
  apiKey: [{ validator: (v) => v.trim().length > 0, message: 'API Key 不能为空' }],
  model: [{ validator: () => form.models.length > 0, message: '请添加至少一个模型' }]
})

const providers = ref<ProviderInfo[]>([])

// 当前选中的 Provider ID
const selectedProviderId = ref<string | null>(null)

// 正在编辑的 Provider ID，null 表示新增模式
const editingId = ref<string | null>(null)

// 是否正在保存中（防重复提交）
const saving = ref(false)

// 编辑模式下的原始 Provider 快照，用于 dirty 对比
const originalSnapshot = ref<ProviderInfo | null>(null)

// 表单是否发生修改（编辑模式下逐字段对比快照，新增模式始终为 true）
const dirty = computed(() => {
  if (!editingId.value || !originalSnapshot.value) return true
  const o = originalSnapshot.value
  const modelsEqual =
    form.models.length === o.models.length && form.models.every((m, i) => m === o.models[i])
  return (
    form.name.trim() !== o.name ||
    form.type !== o.type ||
    form.apiKey.trim() !== o.apiKey ||
    (form.baseURL?.trim() || undefined) !== (o.baseURL || undefined) ||
    !modelsEqual ||
    form.defaultModel !== o.defaultModel ||
    form.useResponsesApi !== (o.useResponsesApi || false)
  )
})

// 保存按钮禁用状态：新增模式校验必填项，编辑模式校验是否修改
const saveDisabled = computed(() => {
  if (saving.value) return true
  if (editingId.value) return !dirty.value
  return form.models.length === 0 || !form.name.trim() || !form.apiKey.trim()
})

// Provider 配置表单数据
const form = reactive({
  name: '',
  type: 'openai' as ProviderType,
  apiKey: '',
  baseURL: '',
  modelInput: '',
  models: [] as string[],
  defaultModel: '',
  useResponsesApi: false
})

/**
 * 将 reactive form 数据同步到表单验证器。
 *
 * @remarks
 * 表单使用独立验证器管理错误状态，每次表单值变更时需调用此函数同步。
 */
function syncFormToValidator() {
  setValue('name', form.name)
  setValue('apiKey', form.apiKey)
  setValue('model', form.models.length > 0 ? 'ok' : '')
}

/**
 * 添加模型到列表。
 *
 * @remarks
 * 首个模型自动设为默认。空名称或重复名称阻止添加。
 */
function handleAddModel() {
  const name = form.modelInput.trim()
  // 空名称直接忽略
  if (!name) return
  // 重复名称提示
  if (form.models.includes(name)) {
    toast.warning('模型名称已存在')
    return
  }
  form.models.push(name)
  // 首个模型自动设为默认
  if (!form.defaultModel) {
    form.defaultModel = name
  }
  form.modelInput = ''
}

/**
 * 从模型列表中移除指定项。
 *
 * @remarks
 * 若移除的是当前默认模型，自动切换为列表第一个。
 *
 * @param index - 模型在列表中的索引
 */
function handleRemoveModel(index: number) {
  const removed = form.models[index]
  form.models.splice(index, 1)
  // 若移除的是默认模型，切换为第一个
  if (form.defaultModel === removed) {
    form.defaultModel = form.models[0] || ''
  }
}

// Provider 类型选项
const typeOptions = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'OpenAI 兼容', value: 'openai-compatible' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'DeepSeek', value: 'deepseek' }
] as const

/**
 * 从主进程加载 Provider 列表并初始化表单。
 *
 * @remarks
 * 组件挂载时自动调用。若存在已选中的 Provider，自动回填到表单。
 */
async function loadProviders() {
  // 从主进程加载设置
  const result = await window.api.settingsLoad()
  providers.value = result.providers
  selectedProviderId.value = result.selectedProviderId

  // 若存在已选中的 Provider，回填表单
  if (result.selectedProviderId) {
    const provider = providers.value.find((p) => p.id === result.selectedProviderId)
    if (provider) fillForm(provider)
  }
}

onMounted(loadProviders)

/**
 * 处理 Provider 类型切换。
 *
 * @param value - 新的 Provider 类型
 */
function handleTypeChange(value: ProviderType) {
  form.type = value
  syncFormToValidator()
}

// 处理输入框变更，同步验证器
function handleInput() {
  syncFormToValidator()
}

/**
 * 处理输入框失焦，触发字段级验证。
 *
 * @param field - 字段名称
 */
function handleBlur(field: string) {
  syncFormToValidator()
  touch(field)
}

/**
 * 保存 Provider 配置（新增或更新）。
 *
 * @remarks
 * 保存前执行全量表单验证。新增时自动分配 ID，保存成功后刷新列表。
 */
async function handleSave() {
  // 前置验证
  syncFormToValidator()
  if (!validateAll()) {
    toast.warning('请填写所有必填项')
    return
  }

  saving.value = true
  const wasEditing = !!editingId.value

  try {
    // 构建 Provider 数据
    const provider: ProviderInfo = {
      id: editingId.value || Date.now().toString(36),
      name: form.name.trim(),
      type: form.type,
      apiKey: form.apiKey.trim(),
      baseURL: form.baseURL.trim() || undefined,
      models: [...form.models],
      defaultModel: form.defaultModel,
      useResponsesApi: form.useResponsesApi || undefined
    }
    // 持久化到主进程
    await window.api.settingsProviderAdd(provider)
    // 刷新列表
    await loadProviders()

    // 新增模式清空表单
    if (!wasEditing) {
      resetForm()
    }

    toast.success(
      wasEditing ? `Provider "${provider.name}" 已更新` : `Provider "${provider.name}" 添加成功`
    )
  } catch (err) {
    toast.error('保存失败，请重试')
    console.error(err)
  } finally {
    saving.value = false
  }
}

/**
 * 删除指定 Provider。
 *
 * @param id - Provider ID
 * @param name - Provider 名称（用于 Toast 提示）
 */
async function handleRemove(id: string, name: string) {
  // 调用主进程删除
  await window.api.settingsProviderRemove(id)
  // 刷新列表
  await loadProviders()
  toast.info(`已移除 "${name}"`)
}

/**
 * 将 Provider 数据回填到表单。
 *
 * @remarks
 * 复制 models 数组避免引用共享。同时记录原始快照用于 dirty 对比。
 *
 * @param provider - Provider 配置
 */
function fillForm(provider: ProviderInfo) {
  editingId.value = provider.id
  form.name = provider.name
  form.type = provider.type as ProviderType
  form.apiKey = provider.apiKey
  form.baseURL = provider.baseURL || ''
  // 复制数组避免引用共享
  form.models = [...provider.models]
  form.defaultModel = provider.defaultModel
  form.useResponsesApi = provider.useResponsesApi || false
  form.modelInput = ''

  // 记录原始快照用于 dirty 对比
  originalSnapshot.value = {
    ...provider,
    models: [...provider.models]
  }
  // 同步验证器
  syncFormToValidator()
}

/**
 * 选中 Provider 并将数据加载到表单。
 *
 * @remarks
 * 调用 IPC 持久化选中状态，同时回填表单供编辑。
 *
 * @param id - Provider ID
 */
async function handleSelect(id: string) {
  // 持久化选中状态
  await window.api.settingsProviderSelect(id)
  selectedProviderId.value = id

  // 查找并回填表单
  const provider = providers.value.find((p) => p.id === id)
  if (provider) fillForm(provider)
}

/**
 * 清空表单，退出编辑模式。
 *
 * @remarks
 * 重置所有字段为默认值，清理快照和验证器状态。
 */
function resetForm() {
  editingId.value = null
  originalSnapshot.value = null
  // 重置所有表单字段
  form.name = ''
  form.type = 'openai'
  form.apiKey = ''
  form.baseURL = ''
  form.modelInput = ''
  form.models = []
  form.defaultModel = ''
  form.useResponsesApi = false
  // 清理验证器
  setValue('name', '')
  setValue('apiKey', '')
  setValue('model', '')
  touchAll()
}

/**
 * 导出 Provider 配置到 JSON 文件。
 *
 * @remarks
 * 弹出系统原生保存对话框，将当前所有 Provider 配置导出。
 */
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

/**
 * 从 JSON 文件导入 Provider 配置。
 *
 * @remarks
 * 弹出系统原生打开对话框，选择 JSON 文件后覆盖当前配置并重新注册 Provider。
 */
async function handleImport() {
  try {
    const result = await window.api.settingsImport()
    if (result) {
      // 刷新列表以反映导入结果
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

    <div v-if="form.type === 'openai'" class="form-group">
      <label class="form-label">Responses API</label>
      <div class="toggle-row">
        <el-switch v-model="form.useResponsesApi" />
        <span class="toggle-hint">
          {{
            form.useResponsesApi
              ? '使用 /v1/responses（支持 reasoning 流式输出，需 GPT-5 等新模型）'
              : '使用 /v1/chat/completions（兼容旧模型如 GPT-4o）'
          }}
        </span>
      </div>
    </div>

    <div class="form-group" :class="{ 'has-error': errors.model }">
      <label class="form-label"> 模型列表 <span class="required">*</span> </label>

      <div class="model-input-row">
        <input
          v-model="form.modelInput"
          class="form-input model-input"
          placeholder="输入模型名称，例如 gpt-4o"
          @keydown.enter.prevent="handleAddModel"
        />
        <button class="add-model-btn" :disabled="!form.modelInput.trim()" @click="handleAddModel">
          <el-icon><Plus /></el-icon>
        </button>
      </div>

      <div v-if="form.models.length > 0" class="model-list">
        <div
          v-for="model in form.models"
          :key="model"
          :class="['model-chip', { default: model === form.defaultModel }]"
          @click="form.defaultModel = model"
        >
          <el-icon v-if="model === form.defaultModel" class="model-check"><Select /></el-icon>
          <span class="model-name">{{ model }}</span>
          <button class="model-remove" @click.stop="handleRemoveModel(form.models.indexOf(model))">
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>

      <span v-if="errors.model" class="field-error">{{ errors.model }}</span>
      <span v-else class="form-hint">添加至少一个模型，点击模型可设为默认</span>
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
  color: var(--lq-text-faint);
  margin-bottom: 24px;
  line-height: 1.6;
}

.panel-desc code {
  padding: 2px 6px;
  border-radius: 4px;
  background: var(--lq-code-inline-bg);
  font-size: 12px;
  color: var(--lq-code-inline-text);
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--lq-text-muted);
  margin-bottom: 6px;
}

.required {
  color: var(--lq-accent-red);
  margin-left: 2px;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--lq-border-default);
  border-radius: 8px;
  background: var(--lq-bg-surface);
  color: var(--lq-text-secondary);
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
  font-family: inherit;
  box-sizing: border-box;
}

.form-input::placeholder {
  color: var(--lq-text-placeholder);
}

.form-input:focus {
  border-color: var(--lq-border-focus);
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
  color: var(--lq-text-placeholder);
  margin-top: 4px;
}

.type-selector {
  display: flex;
  gap: 8px;
}

.type-option {
  padding: 8px 16px;
  border: 1px solid var(--lq-border-default);
  border-radius: 8px;
  background: var(--lq-bg-surface);
  color: var(--lq-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.type-option:hover {
  background: var(--lq-bg-surface-hover);
  color: var(--lq-text-secondary);
}

.type-option.active {
  background: var(--lq-accent-indigo-bg);
  border-color: var(--lq-accent-indigo-border);
  color: var(--lq-accent-indigo-text);
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
  background: var(--lq-accent-gradient);
  color: var(--lq-text-on-accent);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-btn:hover:not(:disabled) {
  background: var(--lq-accent-gradient-hover);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cancel-btn {
  padding: 10px 20px;
  border: 1px solid var(--lq-border-default);
  border-radius: 8px;
  background: transparent;
  color: var(--lq-text-muted);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.cancel-btn:hover {
  background: var(--lq-bg-surface);
  color: var(--lq-text-secondary);
}

.provider-list {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid var(--lq-border-default);
}

.list-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--lq-text-muted);
  margin-bottom: 12px;
}

.provider-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  margin-bottom: 6px;
  border-radius: 8px;
  background: var(--lq-bg-surface);
  border: 1px solid var(--lq-border-subtle);
  cursor: pointer;
  transition: all 0.15s ease;
}

.provider-card:hover {
  background: var(--lq-bg-surface-hover);
  border-color: var(--lq-border-default);
}

.provider-card.selected {
  background: var(--lq-accent-indigo-bg);
  border-color: var(--lq-accent-indigo-border);
}

.provider-select-indicator {
  width: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--lq-accent-indigo-indicator);
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
  color: var(--lq-text-secondary);
}

.provider-type {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--lq-accent-indigo-bg);
  color: var(--lq-accent-indigo-text);
}

.provider-model {
  font-size: 12px;
  color: var(--lq-text-faint);
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
  color: var(--lq-text-hint);
  cursor: pointer;
  transition: all 0.15s ease;
}

.remove-btn:hover {
  background: var(--lq-accent-red-bg-hover);
  color: var(--lq-accent-red);
}

.import-export {
  display: flex;
  gap: 12px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid var(--lq-border-default);
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid var(--lq-border-default);
  border-radius: 8px;
  background: var(--lq-bg-surface);
  color: var(--lq-text-muted);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.action-btn:hover {
  background: var(--lq-bg-surface-hover);
  color: var(--lq-text-secondary);
}

.model-input-row {
  display: flex;
  gap: 8px;
}

.model-input {
  flex: 1;
}

.add-model-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 1px solid var(--lq-border-default);
  border-radius: 8px;
  background: var(--lq-bg-surface);
  color: var(--lq-text-muted);
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}

.add-model-btn:hover:not(:disabled) {
  background: var(--lq-accent-indigo-bg);
  border-color: var(--lq-accent-indigo-border);
  color: var(--lq-accent-indigo-text);
}

.add-model-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.model-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
}

.model-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1px solid var(--lq-border-default);
  border-radius: 6px;
  background: var(--lq-bg-surface);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.model-chip:hover {
  background: var(--lq-bg-surface-hover);
  border-color: var(--lq-border-strong);
}

.model-chip.default {
  background: var(--lq-accent-indigo-bg);
  border-color: var(--lq-accent-indigo-border);
}

.model-check {
  font-size: 12px;
  color: var(--lq-accent-indigo-indicator);
  flex-shrink: 0;
}

.model-name {
  font-size: 13px;
  color: var(--lq-text-secondary);
}

.model-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 3px;
  background: transparent;
  color: var(--lq-text-hint);
  cursor: pointer;
  font-size: 10px;
  flex-shrink: 0;
  transition: all 0.1s ease;
}

.model-remove:hover {
  background: var(--lq-accent-red-bg-hover);
  color: var(--lq-accent-red);
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toggle-hint {
  font-size: 12px;
  color: var(--lq-text-placeholder);
  line-height: 1.5;
}
</style>
