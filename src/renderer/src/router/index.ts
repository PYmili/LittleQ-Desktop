import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import HomePage from '@renderer/pages/HomePage.vue'
import SettingsPage from '@renderer/pages/SettingsPage.vue'

/**
 * 应用路由表。
 *
 * @remarks
 * 新增页面时在此数组中追加 `RouteRecordRaw` 条目即可。
 */
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomePage
  },
  {
    path: '/settings',
    name: 'settings',
    component: SettingsPage
  }
]

/**
 * Vue Router 实例。
 *
 * @remarks
 * 使用 `createWebHashHistory`（hash 模式）。
 * Electron 生产环境通过 `file://` 协议加载页面，无法使用 history 模式的 HTML5 History API。
 * hash 模式无服务器依赖，兼容 Electron 所有运行环境。
 *
 * @example
 * ```ts
 * // 编程式导航
 * import router from '@renderer/router'
 * router.push('/')
 * ```
 */
const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
