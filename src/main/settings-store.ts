import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { dialog } from 'electron'
import type { ProviderSettings } from './ai/types'
import { ensureDir } from './common/fs-utils'

/**
 * 应用设置 Store。
 *
 * @remarks
 * 使用 JSON 文件持久化，存放于 `{用户目录}/.little-q-desktop/settings.json`。
 * 用户可通过导出/导入功能分享配置。
 */

/** 设置文件目录 */
const SETTINGS_DIR = join(homedir(), '.little-q-desktop')

/** 设置文件路径 */
const SETTINGS_PATH = join(SETTINGS_DIR, 'settings.json')

/** 设置数据格式 */
interface SettingsData {
  version: number
  providers: ProviderSettings[]
  selectedProviderId: string | null
}

/** 默认空设置 */
const DEFAULT_SETTINGS: SettingsData = {
  version: 1,
  providers: [],
  selectedProviderId: null
}

/** 内存中的设置缓存 */
let cachedSettings: SettingsData | null = null

/**
 * 从磁盘加载设置。
 *
 * @remarks
 * 文件不存在时返回默认空设置。解析失败时也返回默认值并打印警告。
 *
 * @returns 当前设置数据
 */
export function loadSettings(): SettingsData {
  try {
    ensureDir(SETTINGS_DIR)
    if (!existsSync(SETTINGS_PATH)) {
      writeFileSync(SETTINGS_PATH, JSON.stringify(DEFAULT_SETTINGS, null, 2), 'utf-8')
      cachedSettings = { ...DEFAULT_SETTINGS }
      return cachedSettings
    }
    const raw = readFileSync(SETTINGS_PATH, 'utf-8')
    const parsed = JSON.parse(raw)
    cachedSettings = {
      version: parsed.version || DEFAULT_SETTINGS.version,
      providers: parsed.providers || [],
      selectedProviderId: parsed.selectedProviderId || null
    }
    return cachedSettings
  } catch (err) {
    console.warn('[Settings] 读取失败，使用默认配置', err)
    cachedSettings = { ...DEFAULT_SETTINGS }
    return cachedSettings
  }
}

/**
 * 保存设置到磁盘。
 *
 * @param data - 待保存的设置数据
 */
export function saveSettings(data: SettingsData): void {
  try {
    ensureDir(SETTINGS_DIR)
    writeFileSync(SETTINGS_PATH, JSON.stringify(data, null, 2), 'utf-8')
    cachedSettings = data
  } catch (err) {
    console.error('[Settings] 保存失败:', err)
  }
}

/**
 * 获取所有 Provider。
 *
 * @returns Provider 列表
 */
export function getProviders(): ProviderSettings[] {
  if (!cachedSettings) loadSettings()
  return cachedSettings?.providers || []
}

/**
 * 添加或更新 Provider。
 *
 * @remarks
 * 若此前无 Provider，添加后自动选中。
 *
 * @param provider - Provider 配置
 */
export function addProvider(provider: ProviderSettings): void {
  const settings = cachedSettings || loadSettings()
  const idx = settings.providers.findIndex((p) => p.id === provider.id)
  if (idx >= 0) {
    settings.providers[idx] = provider
  } else {
    settings.providers.push(provider)
    if (settings.providers.length === 1) {
      settings.selectedProviderId = provider.id
    }
  }
  saveSettings(settings)
}

/**
 * 删除 Provider。
 *
 * @remarks
 * 若删除的是当前选中的 Provider，自动清除选中状态。
 *
 * @param id - Provider ID
 */
export function removeProvider(id: string): void {
  const settings = cachedSettings || loadSettings()
  settings.providers = settings.providers.filter((p) => p.id !== id)
  if (settings.selectedProviderId === id) {
    settings.selectedProviderId = null
  }
  saveSettings(settings)
}

/**
 * 获取当前选中的 Provider ID。
 *
 * @returns Provider ID，未选中时返回 null
 */
export function getSelectedProviderId(): string | null {
  if (!cachedSettings) loadSettings()
  return cachedSettings?.selectedProviderId || null
}

/**
 * 设置当前选中的 Provider ID。
 *
 * @param id - Provider ID，传 null 清除选中
 */
export function setSelectedProviderId(id: string | null): void {
  const settings = cachedSettings || loadSettings()
  settings.selectedProviderId = id
  saveSettings(settings)
}

/**
 * 导出配置到用户指定路径。
 *
 * @remarks
 * 弹出保存对话框，将当前设置导出为 JSON 文件。
 */
export async function exportSettings(): Promise<boolean> {
  const settings = cachedSettings || loadSettings()
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: '导出配置',
    defaultPath: 'littleq-config.json',
    filters: [{ name: 'JSON 文件', extensions: ['json'] }]
  })
  if (canceled || !filePath) return false
  writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8')
  return true
}

/**
 * 从用户指定路径导入配置。
 *
 * @remarks
 * 弹出打开对话框，选中 JSON 文件后覆盖当前设置。
 * 导入的 providers 会逐一注册到 AI Provider 注册表。
 *
 * @returns 导入的 Provider 列表，取消时返回 null
 */
export async function importSettings(): Promise<ProviderSettings[] | null> {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: '导入配置',
    filters: [{ name: 'JSON 文件', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (canceled || filePaths.length === 0) return null
  try {
    const raw = readFileSync(filePaths[0], 'utf-8')
    const data = JSON.parse(raw) as SettingsData
    cachedSettings = data
    saveSettings(data)
    return data.providers || []
  } catch {
    console.error('[Settings] 导入失败：文件格式错误')
    return null
  }
}
