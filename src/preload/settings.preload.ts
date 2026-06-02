import { ipcRenderer } from 'electron'
import type { SettingsApi } from './types/settings.preload'

/**
 * 设置管理模块的 preload API。
 */
export const settingsApi: SettingsApi = {
  /**
   * 加载所有设置（含 Provider 列表）。
   *
   * @returns 当前配置数据
   */
  settingsLoad: () => ipcRenderer.invoke('settings:load'),

  /**
   * 添加或更新 Provider 配置（自动持久化到磁盘）。
   *
   * @param provider - Provider 配置
   */
  settingsProviderAdd: (provider) => ipcRenderer.invoke('settings:provider:add', provider),

  /**
   * 删除 Provider 配置。
   *
   * @param id - Provider ID
   */
  settingsProviderRemove: (id) => ipcRenderer.invoke('settings:provider:remove', id),

  /**
   * 设置当前选中的 Provider。
   *
   * @param id - Provider ID，传 null 清除选中
   */
  settingsProviderSelect: (id) => ipcRenderer.invoke('settings:provider:select', id),

  /**
   * 导出配置到用户指定路径。
   *
   * @returns true 表示已保存，false 表示用户取消
   */
  settingsExport: () => ipcRenderer.invoke('settings:export'),

  /**
   * 从用户指定路径导入配置。
   *
   * @returns 导入的 Provider 列表，取消时返回 null
   */
  settingsImport: () => ipcRenderer.invoke('settings:import')
}
