import type { ProviderSettings } from '../ai'

/**
 * 宠物桌面组件的运行时设置。
 *
 * @remarks
 * 控制宠物窗口的可视性、缩放比例以及调试边框显示。
 */
export interface PetSettings {
  /** 宠物窗口是否可见 */
  visible: boolean
  /** SVG 缩放比例（基准宽度 × 此值 = 窗口宽度） */
  scale: number
  /** 是否显示 DEBUG 边框（用于调试窗口尺寸） */
  debug: boolean
}

/**
 * 应用设置的完整数据结构。
 *
 * @remarks
 * 所有设置持久化到 `~/.little-q-desktop/settings.json`。
 * `version` 字段用于未来的迁移兼容性。
 */
export interface SettingsData {
  /** 数据格式版本号，用于兼容性迁移 */
  version: number
  /** 已配置的 AI Provider 列表 */
  providers: ProviderSettings[]
  /** 当前选中的 Provider ID，未选中时为 null */
  selectedProviderId: string | null
  /** 宠物桌面组件设置 */
  pet: PetSettings
  /** 主题偏好：'dark' 或 'light' */
  theme: 'dark' | 'light'
}
