# AGENTS.md

## 项目概览

Electron 桌面应用，技术栈：`electron-vite` + Vue 3 (Composition API) + TypeScript，脚手架来自 [electron-vite-boilerplate](https://github.com/alex8088/electron-vite-boilerplate)。

## 核心命令

| 命令                  | 用途                                           |
| --------------------- | ---------------------------------------------- |
| `npm run dev`         | 启动开发环境（HMR + 主进程热重载）             |
| `npm run build`       | 类型检查 + electron-vite 构建（输出到 `out/`） |
| `npm run typecheck`   | 运行全部类型检查                               |
| `npm run lint`        | ESLint 检查并自动修复                          |
| `npm run format`      | Prettier 格式化                                |
| `npm run build:win`   | 构建 Windows 安装包                            |
| `npm run build:mac`   | 构建 macOS 安装包                              |
| `npm run build:linux` | 构建 Linux 安装包                              |

- **类型检查是构建的前提**：`build` 会先执行 `typecheck`（`tsc --noEmit` + `vue-tsc --noEmit`），失败则构建中断。
- `typecheck` 分两步：`typecheck:node`（主进程/preload）和 `typecheck:web`（渲染进程），必须都通过。
- 单步调试：VSCode 中运行 `Debug All`（launch.json 已配置主进程 + 渲染进程联调）。

## 项目结构

```
src/
├── main/                    # Electron 主进程（Node.js 环境）
│   ├── index.ts              # 窗口创建、IPC 注册入口
│   ├── common/               # 主进程公共工具
│   │   └── fs-utils.ts       # ensureDir、dateDir
│   ├── ai/                   # AI 模块
│   │   ├── agent.ts          # runAgent — streamText + fullStream 编排 + 错误提取
│   │   ├── providers.ts      # Provider 注册表 + getModel
│   │   └── tools.ts          # Agent 工具（readFile/writeFile）
│   ├── ipc-handlers/         # IPC 处理器（按模块拆分）
│   │   ├── index.ts           # registerAllIpcHandlers — 统一注册入口
│   │   ├── ai-ipc-handlers.ts # ai:stream
│   │   ├── settings-ipc-handlers.ts # Provider 管理 + 导入/导出
│   │   ├── sessions-ipc-handlers.ts # 会话 CRUD
│   │   └── pet-ipc-handlers.ts      # 宠物窗口控制
│   ├── stores/               # 主进程持久化 Store
│   │   ├── settings-store.ts # Provider + 宠物配置持久化（~/.little-q-desktop/settings.json）
│   │   └── session-store.ts  # 会话持久化（~/.little-q-desktop/sessions.json + 日期目录）
│   ├── types/                # 主进程类型声明
│   │   ├── index.ts           # Barrel 统一导出
│   │   ├── ai.d.ts            # ProviderSettings（含 useResponsesApi）、ChatConfig、StreamChunk 等
│   │   └── store/             # Store 类型
│   │       ├── settings-store.d.ts  # PetSettings、SettingsData
│   │       └── session-store.d.ts   # SessionMessage、SessionSummary、SessionData、SessionsIndex
│   └── windows/              # 独立窗口管理
│       └── pet-window.ts     # 宠物窗口生命周期 + 状态管理
├── preload/                 # 预加载脚本（contextBridge 暴露 API 给渲染进程）
│   ├── index.ts              # 入口，合并各模块 API 并暴露到 window.api
│   ├── index.d.ts            # window.electron / window.api 全局类型声明
│   ├── ai.preload.ts         # AI 对话 API（aiStream、onAiChunk）
│   ├── settings.preload.ts   # 设置管理 API（settings*、import/export）
│   ├── sessions.preload.ts   # 会话管理 API（sessions*）
│   ├── pet.preload.ts        # 宠物窗口 API（pet*）
│   └── types/                # preload 类型声明（.d.ts）
│       ├── ai.preload.d.ts
│       ├── settings.preload.d.ts
│       ├── sessions.preload.d.ts
│       └── pet.preload.d.ts
└── renderer/                # Vue 3 渲染进程
    ├── index.html            # HTML 入口（含 CSP 策略）
    ├── pet.html              # 宠物窗口 HTML 入口
    └── src/
        ├── main.ts          # Vue 挂载入口（Pinia + Router + ElementPlus 图标）
        ├── pet.ts            # 宠物窗口渲染入口
        ├── App.vue          # 根组件（`<router-view />`）
        ├── env.d.ts
        ├── api/             # API 层（axios 封装实例）
        │   ├── index.ts
        │   └── request.ts
        ├── assets/          # 全局样式（base.css、main.css、icon.svg）
        ├── common/          # 渲染进程公共工具
        │   └── id-utils.ts  # genId（nanoid）
        ├── components/      # 可复用组件
        │   ├── SideBar.vue
        │   ├── ChatArea.vue
        │   ├── ChatInput.vue
        │   ├── MessageList.vue
        │   ├── TypingIndicator.vue   # AI 等待回复时的加载动画
        │   └── settings/
        │       ├── AiProviderPanel.vue
        │       ├── PetPanel.vue
        │       └── GeneralPanel.vue   # 通用设置（含主题切换）
        ├── composables/     # 组合式函数
        │   ├── useToast.ts
        │   └── useFormValidation.ts
        ├── pages/           # 路由页面
        │   ├── HomePage.vue
        │   └── SettingsPage.vue
        ├── router/          # Vue Router 配置
        │   └── index.ts
        ├── stores/          # Pinia 状态管理
        │   ├── chat.ts      # 会话 Store（单会话懒加载架构）
        │   └── theme.ts     # 主题 Store（明暗切换 + 持久化）
        └── types/           # 渲染进程类型
            ├── provider.ts      # ProviderType、ProviderInfo
            └── store/
                └── chat.d.ts  # ConversationModel、ConversationSummary、MessageModel
```

- 构建输出目录 `out/`（git 忽略），`dist/` 为 electron-builder 打包产物（git 忽略）。
- 路径别名 `@renderer` → `src/renderer/src`（在 `tsconfig.web.json` 和 `electron.vite.config.ts` 中定义）。
- 主进程/preload 启用了 `bytecodePlugin()`，生产构建会将 TS 编译为 V8 字节码进行源码保护。
- Element Plus 使用 `unplugin-vue-components` + `unplugin-auto-import` 按需导入，图标全局注册。
- **类型声明文件统一使用 `.d.ts` 后缀**（如 `ai.d.ts`、`settings-store.d.ts`），模块 barrel 文件使用 `.ts` 后缀（如 `types/index.ts`）。

## 开发检查清单

**每次编写代码后必须执行以下检查：**

- **vue-tsc**：当前 `vue-tsc@1.8.27` 与 TypeScript 5.9 不兼容，`typecheck:web` 会失败但不影响构建。
- **ESLint 检查**：`npm run lint`，目标 0 error。ESLint 带 `--fix` 会自动修复格式问题。
- **Prettier 格式化**：`npm run format`，确保全部文件 unchanged。
- **TSDoc 注释规范**：所有模块、接口、函数、组件必须编写 `/** */` 格式的 TSDoc 注释（使用标准标签 `@remarks`、`@param`、`@returns`、`@example`），并在注释第一行写简要说明。`eslint-plugin-tsdoc`（`tsdoc/syntax: warn`）仅在 `.ts`/`.tsx`/`.vue` 文件中生效，自动检查 TSDoc 语法，基线为 0 warning。
- **类型检查**：`npm run typecheck`，分为 `typecheck:node` 和 `typecheck:web` 两步。

检查顺序为：`lint` → `format` → `typecheck`。

## 代码约定

详见 [`docs/coding-standards.md`](docs/coding-standards.md)。包含格式化规则、TSDoc 注释规范、接口/类型命名规范、文件组织约定。

## 开发注意

- **包管理器**：使用 npm 运行脚本，但 `.npmrc` 中 `shamefully-hoist=true` 表明底层实际使用 pnpm。`pnpm-workspace.yaml` 存在，不要删除。
- **npm mirror**：`.npmrc` 中 `electron_mirror` 供 `electron-builder` 使用。但 `@electron/get` v5（Electron 36+）不再读取 `.npmrc`，需通过 `ELECTRON_MIRROR` 环境变量指定镜像。所有 `electron-vite` 和 `electron-builder` 相关脚本已通过 `cross-env` 设置该变量，国内环境必须保留。
- **Electron 二进制缺失**：pnpm workspace 配置下，`electron` 包的 `install.js`（下载二进制）可能不自动执行。如遇 `Error: Electron uninstall`，手动执行：
  ```
  $env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
  node node_modules/electron/install.js
  ```
- **CSP**：渲染进程的 `index.html` 中设置了严格的 CSP（`default-src 'self'`），添加外部资源时需同步更新。
- **preload 类型**：新增 `contextBridge` API 后，需同步更新对应模块的 `src/preload/types/xxx.preload.d.ts` 和 `src/preload/index.d.ts`，否则渲染进程中会报类型错误。
- **electron-builder**：`postinstall` 会运行 `electron-builder install-app-deps`，确保原生依赖正确编译。

## 数据持久化

### 目录结构

```
~/.little-q-desktop/
├── settings.json          # Provider 配置（Providers + selectedProviderId + pet + theme）
├── theme                  # 主题偏好：'dark' | 'light'
└── sessions/
    ├── sessions.json      # 会话索引（id、title、createdAt、updatedAt — 不含 messages）
    └── {YYYY-MM-DD}/      # 按会话创建日期分目录
        └── {id}.json      # 单会话完整数据（messages + metadata）
```

### 模块职责

| 模块       | 文件                                       | 职责                              |
| ---------- | ------------------------------------------ | --------------------------------- |
| 设置 Store | `src/main/stores/settings-store.ts`        | Provider + 宠物 + 主题配置读写    |
| 会话 Store | `src/main/stores/session-store.ts`         | 会话索引 + 详情读写               |
| 设置类型   | `src/main/types/store/settings-store.d.ts` | PetSettings、SettingsData         |
| 会话类型   | `src/main/types/store/session-store.d.ts`  | SessionMessage、SessionSummary 等 |

- **IPC 通道**：`settings:*`（设置）、`sessions:list/load/save/delete`（会话）、`pet:*`（宠物）
- **渲染进程**：`stores/chat.ts` 通过 `window.api.sessions*` 调用 IPC

### 单会话懒加载架构

`stores/chat.ts` 采用单一活跃会话模式，避免内存溢出：

| 变量                 | 类型                             | 用途                                   |
| -------------------- | -------------------------------- | -------------------------------------- |
| `summaries`          | `ref<ConversationSummary[]>`     | 侧边栏展示用，启动时全量加载           |
| `activeConversation` | `ref<ConversationModel \| null>` | 当前活跃会话完整数据（唯一一份在内存） |
| `activeId`           | `ref<string \| null>`            | 当前活跃会话 ID                        |

- **加载策略**：`init()` 加载摘要列表 + 仅加载最近一条完整会话
- **切换会话**：`switchConversation(id)` 先持久化旧会话，再懒加载新会话并覆盖 `activeConversation`
- **创建会话**：直接覆盖 `activeConversation`，旧会话已在上一步持久化
- **删除会话**：先删磁盘（`await`）→ 成功后清理摘要列表 → 若匹配活跃会话则清空并切换
- **持久化时机**：`addMessage` 非流式消息立即持久化；流式消息延迟到 `finishStreaming` 时持久化（避免写入空 content）
- `cleanForSave()` 序列化时保留 `reasoning` 字段（思考过程内容）

## AI 集成

### Vercel AI SDK 版本

| 包                  | 版本 | 用途                                                        |
| ------------------- | ---- | ----------------------------------------------------------- |
| `ai`                | ^6.x | `streamText`、`stepCountIs`、`ModelMessage`、`APICallError` |
| `@ai-sdk/openai`    | ^3.x | OpenAI / OpenAI 兼容接口                                    |
| `@ai-sdk/anthropic` | ^3.x | Anthropic Claude                                            |
| `@ai-sdk/deepseek`  | ^2.x | DeepSeek（原生 reasoning 支持）                             |
| `zod`               | ^4.x | Agent 工具参数校验                                          |

### Provider 注册与兼容性

- **Provider 注册表**：`src/main/ai/providers.ts` 中 `providerMap: Map<string, OpenAIProvider | AnthropicProvider | DeepSeekProvider>`，另有 `providerMetaMap` 存储 API 模式等元数据
- **启动初始化**：`ipc-handlers/settings-ipc-handlers.ts` 的 `initProviders()` 在应用启动时从 `settings.json` 加载所有 Provider 并注册到 `providerMap`
- **API 模式选择**：`getModel()` 根据 `ProviderSettings.useResponsesApi` 决定调用方式：
  - `openai` + `useResponsesApi = true` → `provider(model)` 走 Responses API（`/v1/responses`，支持 reasoning 流式输出）
  - 其余所有类型 → `provider.chat(model)` 走 Chat Completions / Messages API（`/v1/chat/completions`）
- **内存清理**：删除 Provider 时同步调用 `unregisterProvider()` 清理 `providerMap` 和 `providerMetaMap`；导入配置时先调用 `clearAllProviders()` 避免旧 Provider 残留
- **Anthropic 兼容**：`AnthropicProvider` 同样有 `.chat()` 方法（映射到 Messages API），无需分支判断

### Agent 编排

- `streamText` + `stepCountIs(10)` 实现 ReAct 循环，LLM 在 10 步内反复迭代（判断是否需要调用工具）
- **使用 `fullStream` 而非 `textStream`**：v6 中 API 错误（如余额不足、鉴权失败）作为 `fullStream` 中的 `error` part 出现，`textStream`（`AsyncIterableStream<string>`）只产出文本字符串，无法捕获这类错误
- **错误提取**：`formatErrorMessage()` 使用 `APICallError.isInstance()` 检测 API 错误，优先提取 `data.error.message` 作为用户消息，拼接 `[HTTP xxx]` 前缀
- **内容推送**：`text-delta` → `type: 'content'`；`reasoning-delta` → `type: 'reasoning'`（思考过程，由 DeepSeek Provider 原生支持或 OpenAI Responses API 提供）；`error` → `type: 'error'`（含提取后的消息）；`tool-error` → `type: 'error'`；其他 part 类型（`tool-call`、`start-step` 等）不推送到前端

### IPC 注意事项

- **reactive 对象不能直接传 IPC**：Vue 的 `reactive()` 返回 Proxy 对象，`structuredClone` 无法序列化。传参时使用 `{ ...reactiveObj }` 展开为普通对象。
- **AI 调用在主进程**：API Key 仅在主进程中使用，不暴露给渲染进程。流式回复通过 `webContents.send('ai:chunk')` 实时推送。

### Markdown 渲染

- **库**：`markdown-it` + `highlight.js`（`github-dark` 主题）
- **触发时机**：AI 回复流式输出完毕（`Message.streaming` 从 `true` → `false`）后，由 `MessageList.vue` 中的 `renderMarkdown()` 渲染为 HTML，通过 `v-html` 注入
- **流式输出中**：显示原始纯文本，不渲染 Markdown
- **`Message.streaming` 字段**：`ChatInput.vue` 在创建 assistant 消息时设为 `true`，在 `done`/`error`/`catch` 中调用 `chatStore.finishStreaming()` 置为 `false`

## 主题系统

### 架构

- **主题 Store**：`src/renderer/src/stores/theme.ts`，采用 Pinia setup store，管理 `isDark` 状态
- **CSS 变量体系**：`src/renderer/src/assets/base.css` 中定义 `:root`（亮色：雾蓝冷色系）和 `html.dark`（暗色）两套 `--lq-*` 变量
- **Element Plus 集成**：导入 `element-plus/theme-chalk/dark/css-vars.css`，通过 `html.dark` class 自动切换 EP 组件主题
- **代码高亮**：`highlight.js` 使用 `github-dark` 主题作为基础，亮色模式通过 `html:not(.dark)` 覆盖关键选择器颜色

### 主题切换流程

1. `main.ts` 启动时调用 `themeStore.init()` 从主进程加载持久化偏好
2. `GeneralPanel.vue` 中的 `el-switch` 直接绑定 `themeStore.isDark`
3. `watch(isDark)` 自动同步 `html.dark` class + 通过 IPC 持久化

### 颜色映射

所有组件 scoped 样式通过 `var(--lq-*)` 引用全局变量，亮暗切换时无需修改组件代码。

## 宠物窗口

### 生命周期

宠物窗口由 `src/main/windows/pet-window.ts` 统一管理，采用条件创建策略：

- **启动时**：根据 `settings.json` 中的 `pet.visible` 决定是否创建
- **切换可见性**：通过 `pet:toggle-visibility` IPC 创建或销毁窗口（非 hide/show）
- **状态管理**：缩放比例、DEBUG 模式、SVG 基准尺寸通过 getter/setter 函数操作，避免跨模块直接赋值

### 窗口配置

- `type: 'toolbar'` + `hasShadow: false` 避免 Windows DWM 边框伪影
- 透明背景 + 无边框 + 置顶 + `skipTaskbar` + `focusable: false`
- 拖拽通过 `pet:move` IPC 以增量偏移方式实现

### 相关文件

| 文件                                                | 职责                      |
| --------------------------------------------------- | ------------------------- |
| `src/main/windows/pet-window.ts`                    | 窗口创建、销毁、状态管理  |
| `src/main/ipc-handlers/pet-ipc-handlers.ts`         | Pet IPC 处理器            |
| `src/preload/pet.preload.ts`                        | Pet API 暴露到 window.api |
| `src/renderer/pet.html`                             | 宠物窗口 HTML 入口        |
| `src/renderer/src/pet.ts`                           | 宠物窗口渲染逻辑          |
| `src/renderer/src/components/settings/PetPanel.vue` | 宠物设置面板              |
