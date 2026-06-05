/**
 * Provider 配置信息。
 */
export interface ProviderInfo {
  /** Provider 唯一标识 */
  id: string
  /** 用户自定义的显示名称 */
  name: string
  /** Provider 类型（openai / openai-compatible / anthropic） */
  type: string
  /** API Key */
  apiKey: string
  /** API 基础 URL（openai-compatible 时必填） */
  baseURL?: string
  /** 可用模型列表 */
  models: string[]
  /** 默认模型 */
  defaultModel: string
}

/**
 * 设置管理模块的 preload API 类型。
 */
export interface SettingsApi {
  /** 加载所有设置（含 Provider 列表和选中项） */
  settingsLoad: () => Promise<{ providers: ProviderInfo[]; selectedProviderId: string | null }>
  /** 添加或更新 Provider 配置，返回当前选中的 Provider ID */
  settingsProviderAdd: (provider: ProviderInfo) => Promise<string | null>
  /** 删除指定 Provider */
  settingsProviderRemove: (id: string) => Promise<void>
  /** 设置当前选中的 Provider，传 null 清除选中 */
  settingsProviderSelect: (id: string | null) => Promise<void>
  /** 导出配置到用户指定路径，返回是否成功 */
  settingsExport: () => Promise<boolean>
  /** 从用户指定路径导入配置，返回导入的 Provider 列表 */
  settingsImport: () => Promise<ProviderInfo[] | null>
  /** 加载主题偏好，返回 'dark' 或 'light' */
  settingsLoadTheme: () => Promise<'dark' | 'light'>
  /** 保存主题偏好 */
  settingsSaveTheme: (theme: 'dark' | 'light') => Promise<void>
}
