/**
 * 桌面宠物窗口入口脚本。
 *
 * @remarks
 * 通过 IPC 从主进程获取 SVG 内容并注入到 DOM 中。
 * 窗口大小由主进程根据缩放比例动态调整，
 * SVG 始终占满容器 100%。
 * DEBUG 边框由 `.debug-mode` CSS class 控制，
 * 开关状态通过 IPC `pet:get-debug` / `pet:debug-changed` 同步。
 */
let initialized = false

/**
 * 切换 DEBUG 边框显示。
 *
 * @param enabled - 是否显示调试边框
 */
function setDebugBorders(enabled: boolean): void {
  document.documentElement.classList.toggle('debug-mode', enabled)
  const mainGroup = document.querySelector('#main')
  if (mainGroup) {
    ;(mainGroup as HTMLElement).style.outline = enabled ? '2px solid lime' : ''
    ;(mainGroup as HTMLElement).style.outlineOffset = enabled ? '-1px' : ''
  }
}

async function initPet(): Promise<void> {
  if (initialized) return
  initialized = true

  const container = document.getElementById('pet-container')
  if (!container) return

  try {
    const svgContent: string = await window.api.petGetSvg()
    container.innerHTML = svgContent

    const svgEl = container.querySelector('svg')
    if (svgEl) {
      const w = svgEl.width.baseVal.value
      const h = svgEl.height.baseVal.value
      if (w > 0 && h > 0) {
        window.api.petReportSize(w, h)
      }
    }

    const isDebug = await window.api.petGetDebug()
    setDebugBorders(isDebug)

    window.api.onPetDebugChanged((enabled: boolean) => {
      setDebugBorders(enabled)
    })

    const mainGroup = container.querySelector('#main')
    if (mainGroup) {
      let dragging = false
      let lastScreenX = 0
      let lastScreenY = 0
      let pendingDx = 0
      let pendingDy = 0
      let rafId = 0

      mainGroup.addEventListener('mousedown', (e: Event) => {
        const me = e as MouseEvent
        dragging = true
        lastScreenX = me.screenX
        lastScreenY = me.screenY
      })

      document.addEventListener('mousemove', (e: MouseEvent) => {
        if (!dragging) return
        pendingDx += e.screenX - lastScreenX
        pendingDy += e.screenY - lastScreenY
        lastScreenX = e.screenX
        lastScreenY = e.screenY
        if (rafId) return
        rafId = requestAnimationFrame(() => {
          rafId = 0
          if (!dragging) return
          if (pendingDx !== 0 || pendingDy !== 0) {
            window.api.petMoveWindow(pendingDx, pendingDy)
            pendingDx = 0
            pendingDy = 0
          }
        })
      })

      document.addEventListener('mouseup', () => {
        dragging = false
      })
    }
  } catch (err) {
    console.error('Failed to load pet SVG:', err)
  }
}

initPet()
