import { ipcRenderer } from 'electron'
import type { PetApi } from './types/pet.preload'

/**
 * 宠物窗口模块的 preload API。
 */
export const petApi: PetApi = {
  /**
   * 获取宠物 SVG 内容。
   *
   * @returns SVG 文件内容字符串
   */
  petGetSvg: () => ipcRenderer.invoke('pet:get-svg'),

  /**
   * 获取宠物窗口是否可见。
   *
   * @returns 可见状态
   */
  petGetVisibility: () => ipcRenderer.invoke('pet:get-visibility'),

  /**
   * 切换宠物窗口可见性。
   *
   * @returns 切换后的可见状态
   */
  petToggleVisibility: () => ipcRenderer.invoke('pet:toggle-visibility'),

  /**
   * 获取当前宠物缩放比例。
   *
   * @returns 缩放比例（0.1~2.0）
   */
  petGetScale: () => ipcRenderer.invoke('pet:get-scale'),

  /**
   * 设置宠物缩放比例。
   *
   * @param scale - 缩放比例（0.1~2.0）
   */
  petSetScale: (scale) => ipcRenderer.invoke('pet:set-scale', scale),

  /**
   * 监听宠物缩放比例变更。
   *
   * @param callback - 接收到新缩放比例时的回调
   * @returns 取消监听的清理函数
   */
  onPetScaleChanged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, scale: unknown): void =>
      callback(scale as number)
    ipcRenderer.on('pet:scale-changed', handler)
    return () => ipcRenderer.removeListener('pet:scale-changed', handler)
  },

  /**
   * 获取宠物窗口 DEBUG 边框开关状态。
   *
   * @returns DEBUG 是否开启
   */
  petGetDebug: () => ipcRenderer.invoke('pet:get-debug'),

  /**
   * 设置宠物窗口 DEBUG 边框开关。
   *
   * @param enabled - 是否开启 DEBUG 边框
   */
  petSetDebug: (enabled) => ipcRenderer.invoke('pet:set-debug', enabled),

  /**
   * 监听宠物 DEBUG 边框开关变更。
   *
   * @param callback - 接收到新状态时的回调
   * @returns 取消监听的清理函数
   */
  onPetDebugChanged: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, enabled: unknown): void =>
      callback(enabled as boolean)
    ipcRenderer.on('pet:debug-changed', handler)
    return () => ipcRenderer.removeListener('pet:debug-changed', handler)
  },

  /**
   * 移动宠物窗口（供拖拽使用）。
   *
   * @param dx - 水平位移量（px）
   * @param dy - 垂直位移量（px）
   */
  petMoveWindow: (dx, dy) => {
    ipcRenderer.send('pet:move', dx, dy)
  },

  /**
   * 上报 SVG 的基准尺寸，主进程据此调整窗口大小。
   *
   * @param width - SVG 基准宽度（px）
   * @param height - SVG 基准高度（px）
   */
  petReportSize: (width, height) => {
    ipcRenderer.send('pet:report-size', width, height)
  }
}
