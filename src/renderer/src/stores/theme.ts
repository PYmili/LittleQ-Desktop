import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

/**
 * 主题管理 Store。
 *
 * @remarks
 * 管理应用明暗主题状态，通过切换 `<html>` 元素的 `dark` class 实现。
 * 默认为暗色主题（`isDark = true`），与项目初始风格一致。
 * 主题偏好通过 IPC 持久化到主进程 `settings.json`。
 *
 * @example
 * ```ts
 * const themeStore = useThemeStore()
 * await themeStore.init()
 * themeStore.toggleTheme()
 * ```
 */
export const useThemeStore = defineStore('theme', () => {
  const isDark = ref(true)

  /**
   * 初始化主题：从持久化设置加载偏好，并应用到 DOM。
   *
   * @returns Promise<void>
   */
  async function init(): Promise<void> {
    try {
      // 从主进程加载持久化的主题偏好
      const theme = await window.api.settingsLoadTheme()
      isDark.value = theme === 'dark'
    } catch {
      // 加载失败时回退为默认暗色主题
      isDark.value = true
    }
    // 将主题应用到 DOM
    applyTheme()
  }

  /**
   * 切换主题（暗 ↔ 明）。
   */
  function toggleTheme(): void {
    isDark.value = !isDark.value
  }

  /**
   * 将主题状态应用到 DOM（切换 `<html>` 的 `dark` class）。
   */
  function applyTheme(): void {
    document.documentElement.classList.toggle('dark', isDark.value)
  }

  /**
   * 持久化主题偏好到主进程设置文件。
   */
  function persist(): void {
    // 通过 IPC 将主题偏好写入 settings.json（不阻塞 UI）
    window.api.settingsSaveTheme(isDark.value ? 'dark' : 'light').catch((err) => {
      console.error('[ThemeStore] 保存主题失败:', err)
    })
  }

  watch(isDark, () => {
    // 同步 DOM class
    applyTheme()
    // 持久化到磁盘
    persist()
  })

  return { isDark, init, toggleTheme, applyTheme }
})
