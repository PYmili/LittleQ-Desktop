/**
 * 宠物窗口模块的 preload API 类型。
 */
export interface PetApi {
  /** 获取宠物 SVG 内容 */
  petGetSvg: () => Promise<string>
  /** 获取宠物窗口是否可见 */
  petGetVisibility: () => Promise<boolean>
  /** 切换宠物窗口可见性，返回切换后的状态 */
  petToggleVisibility: () => Promise<boolean>
  /** 获取当前缩放比例 */
  petGetScale: () => Promise<number>
  /** 设置缩放比例（0.1~2.0） */
  petSetScale: (scale: number) => Promise<void>
  /** 监听缩放比例变更，返回取消监听的清理函数 */
  onPetScaleChanged: (callback: (scale: number) => void) => () => void
  /** 获取 DEBUG 边框开关状态 */
  petGetDebug: () => Promise<boolean>
  /** 设置 DEBUG 边框开关 */
  petSetDebug: (enabled: boolean) => Promise<void>
  /** 监听 DEBUG 边框开关变更，返回取消监听的清理函数 */
  onPetDebugChanged: (callback: (enabled: boolean) => void) => () => void
  /** 移动宠物窗口（供拖拽使用） */
  petMoveWindow: (dx: number, dy: number) => void
  /** 上报 SVG 基准尺寸，主进程据此调整窗口大小 */
  petReportSize: (width: number, height: number) => void
}
