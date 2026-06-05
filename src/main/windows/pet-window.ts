import { BrowserWindow } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

// 当前宠物窗口实例，null 表示未创建或已销毁
let petWindow: BrowserWindow | null = null

// 宠物缩放比例
let currentScale = 0.3

// DEBUG 边框开关
let petDebug = false

// SVG 上报的基准宽度
let baseWidth = 256

// SVG 上报的基准高度
let baseHeight = 256

/**
 * 获取宠物缩放比例。
 *
 * @returns 当前缩放比例
 */
export function getScale(): number {
  return currentScale
}

/**
 * 设置宠物缩放比例。
 *
 * @param scale - 新的缩放比例
 */
export function setScale(scale: number): void {
  currentScale = scale
}

/**
 * 获取 DEBUG 边框开关状态。
 *
 * @returns 是否开启 DEBUG 边框
 */
export function isDebugEnabled(): boolean {
  return petDebug
}

/**
 * 设置 DEBUG 边框开关。
 *
 * @param enabled - 是否开启
 */
export function setDebug(enabled: boolean): void {
  petDebug = enabled
}

/**
 * 更新 SVG 上报的基准尺寸。
 *
 * @param w - 基准宽度
 * @param h - 基准高度
 */
export function setBaseSize(w: number, h: number): void {
  baseWidth = w
  baseHeight = h
}

/**
 * 根据当前缩放比例计算窗口尺寸。
 *
 * @returns 缩放后的窗口宽高
 */
export function getWindowSize(): { width: number; height: number } {
  return {
    width: Math.round(baseWidth * currentScale),
    height: Math.round(baseHeight * currentScale)
  }
}

/**
 * 获取当前宠物窗口实例。
 *
 * @returns 窗口实例，未创建或已销毁时返回 null
 */
export function getPetWindow(): BrowserWindow | null {
  if (petWindow && !petWindow.isDestroyed()) return petWindow
  petWindow = null
  return null
}

/**
 * 创建宠物窗口。
 *
 * @remarks
 * 无边框、透明背景、置顶，加载 pet.html。
 * 若窗口已存在则直接返回现有实例。
 *
 * @returns 宠物窗口实例
 */
export function createPetWindow(): BrowserWindow {
  const existing = getPetWindow()
  if (existing) return existing

  const win = new BrowserWindow({
    width: 90,
    height: 96,
    show: false,
    frame: false,
    transparent: true,
    thickFrame: false,
    backgroundColor: '#00000000',
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    type: 'toolbar',
    title: 'LittleQ Pet',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  // 取消窗口的阴影
  win.setHasShadow(false)

  // 页面（包括所有资源）完全加载完成后，设置背景颜色
  win.webContents.on('did-finish-load', () => {
    win.setBackgroundColor('#00000000')
  })

  // 窗口关闭时，释放petWindow的指针
  win.on('closed', () => {
    petWindow = null
  })

  // 加载html文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    const baseUrl = process.env['ELECTRON_RENDERER_URL'].replace(/\/+$/, '')
    win.loadURL(`${baseUrl}/pet.html`)
  } else {
    win.loadFile(join(__dirname, '../renderer/pet.html'))
  }

  petWindow = win
  return win
}

/**
 * 销毁宠物窗口。
 *
 * @remarks
 * 安全关闭窗口并将实例引用置 null。
 * 窗口销毁后如需重新显示，调用 {@link createPetWindow} 重新创建。
 */
export function destroyPetWindow(): void {
  const win = getPetWindow()
  if (win) {
    win.close()
    petWindow = null
  }
}
