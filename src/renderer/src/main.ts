import './assets/main.css'

// 函数式调用的 Element Plus 组件需手动导入样式（因不在模板中使用，unplugin 无法自动收集）
import 'element-plus/es/components/message/style/css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'

/**
 * LittleQ 应用启动入口。
 *
 * @remarks
 * 按顺序执行以下初始化：
 * 1. **Pinia 状态管理**：`createPinia` + `pinia-plugin-persistedstate` 持久化插件
 * 2. **Element Plus 图标**：全局注册所有 `@element-plus/icons-vue` 组件
 * 3. **Vue Router**：hash 模式路由
 * 4. 挂载到 `#app` DOM 节点
 */
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(pinia).use(router).mount('#app')
