import { ipcMain, app } from 'electron'
import { readFileSync } from 'fs'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import * as Settings from '../stores/settings-store'
import * as PetWindow from '../windows/pet-window'

/**
 * 注册宠物窗口相关 IPC 处理器。
 *
 * @remarks
 * 包括窗口可见性、缩放、调试边框、拖拽移动、SVG 资源加载等。
 */
export function registerPetHandlers(): void {
  // 从持久化配置初始化宠物状态
  const pet = Settings.getPetSettings()
  PetWindow.setScale(pet.scale)
  PetWindow.setDebug(pet.debug)

  ipcMain.handle('pet:get-svg', async () => {
    // 根据运行环境解析 SVG 资源路径
    const basePath = is.dev
      ? join(app.getAppPath(), 'resources')
      : join(process.resourcesPath, 'app.asar.unpacked', 'resources')
    const svgPath = join(basePath, 'pet', 'svg', 'little-q-idle.svg')
    return readFileSync(svgPath, 'utf-8')
  })

  ipcMain.handle('pet:get-visibility', async () => {
    // 窗口未创建或已销毁时视为不可见
    const win = PetWindow.getPetWindow()
    return win !== null && win.isVisible()
  })

  ipcMain.handle('pet:toggle-visibility', async () => {
    const petSettings = Settings.getPetSettings()
    if (petSettings.visible) {
      // 当前可见 → 销毁窗口并持久化状态
      PetWindow.destroyPetWindow()
      Settings.savePetSettings({ visible: false })
      return false
    } else {
      // 当前不可见 → 创建窗口、设置尺寸并显示
      const win = PetWindow.createPetWindow()
      const size = PetWindow.getWindowSize()
      win.setBounds(size)
      win.show()
      Settings.savePetSettings({ visible: true })
      return true
    }
  })

  ipcMain.handle('pet:get-scale', async () => {
    return PetWindow.getScale()
  })

  ipcMain.handle('pet:set-scale', async (_event, scale: number) => {
    // 更新内存中的缩放比例
    PetWindow.setScale(scale)
    Settings.savePetSettings({ scale })
    // 如果窗口存在，实时调整尺寸并通知渲染进程
    const win = PetWindow.getPetWindow()
    if (win) {
      const size = PetWindow.getWindowSize()
      win.setBounds(size)
      win.webContents.send('pet:scale-changed', scale)
    }
  })

  ipcMain.handle('pet:get-debug', async () => {
    return PetWindow.isDebugEnabled()
  })

  ipcMain.handle('pet:set-debug', async (_event, enabled: boolean) => {
    // 更新 DEBUG 边框开关状态
    PetWindow.setDebug(enabled)
    Settings.savePetSettings({ debug: enabled })
    // 如果窗口存在，实时通知渲染进程切换边框显示
    const win = PetWindow.getPetWindow()
    if (win) {
      win.webContents.send('pet:debug-changed', enabled)
    }
  })

  ipcMain.on('pet:move', (_event, dx: number, dy: number) => {
    const win = PetWindow.getPetWindow()
    if (!win) return
    // 获取当前位置并应用增量偏移
    const [x, y] = win.getPosition()
    const size = PetWindow.getWindowSize()
    win.setBounds({ x: x + dx, y: y + dy, ...size })
  })

  ipcMain.on('pet:report-size', (_event, w: number, h: number) => {
    // 更新 SVG 基准尺寸
    PetWindow.setBaseSize(w, h)
    // 如果窗口存在，按新尺寸重新计算并应用窗口大小
    const win = PetWindow.getPetWindow()
    if (win) {
      const size = PetWindow.getWindowSize()
      win.setBounds(size)
    }
  })
}
