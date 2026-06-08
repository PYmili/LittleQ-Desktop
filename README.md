<h1 align="center">
  <br>
  <img src="/resources/pet/svg/little-q-idle.svg" alt="LittleQ" width="96">
  <br>
  LittleQ Desktop
  <br>
</h1>

<p align="center">一款支持 Agent 工具调用、多模型切换、AI 思考过程展示、明暗主题、流式对话的 AI 桌面助手。</p>

<p align="center">
  <a href="README.en.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-42.x-47848F?logo=electron&logoColor=white" alt="Electron">
  <img src="https://img.shields.io/badge/Vue-3.4-4FC08D?logo=vue.js&logoColor=white" alt="Vue">
  <img src="https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7.3-646CFF?logo=vite&logoColor=white" alt="Vite">
  <img src="https://img.shields.io/badge/AI_SDK-6.x-black?logo=vercel&logoColor=white" alt="AI SDK">
  <img src="https://img.shields.io/badge/license-MIT-blue" alt="License">
</p>

---

## 简介

**LittleQ Desktop** 是一款基于 Electron + Vue 3 构建的跨平台桌面 AI 助手，集成了 [Vercel AI SDK](https://sdk.vercel.ai/)，具备以下能力：

- **多 Provider 对话** — 支持 OpenAI、Anthropic Claude、DeepSeek 及任意 OpenAI 兼容接口（如 Ollama、vLLM）
- **Agent 模式** — AI 可通过内置工具读写本地项目文件
- **流式响应** — 实时 Markdown 渲染，支持代码语法高亮
- **会话管理** — 聊天记录持久化至本地磁盘，支持多会话切换
- **桌面宠物** — 可拖拽的 SVG 桌面宠物，支持缩放与位置记忆

所有 API Key 仅存储在本地 — **除了您发出的 AI 请求本身，没有任何数据离开您的设备**。

## 截图

<p align="center">
  <img src="/images/preview.png" alt="preview">
</p>

## 功能特性

| 类别            | 说明                                                           |
| --------------- | -------------------------------------------------------------- |
| **多 Provider** | 支持 OpenAI、Anthropic Claude、DeepSeek 及任意 OpenAI 兼容 API |
| **多模型切换**  | 每个 Provider 可配置多个模型，对话中一键切换                   |
| **思考过程**    | 支持展示 AI 思考过程（DeepSeek-R1 / OpenAI Responses API）     |
| **Agent 工具**  | 内置 `readFile` / `writeFile` 工具，AI 可直接读写项目文件      |
| **流式输出**    | 实时流式回复，Markdown 渲染 + 代码高亮                         |
| **主题系统**    | 暗色 / 雾蓝亮色双主题，全局 CSS 变量 + Element Plus 联动切换   |
| **桌面宠物**    | 可拖拽 SVG 桌面宠物，支持缩放调节、位置记忆                    |
| **会话管理**    | 新建、切换、删除会话；自动持久化到 `~/.little-q-desktop/`      |
| **配置管理**    | 一键导出/导入 Provider 配置，方便分享与迁移                    |
| **跨平台**      | Windows / macOS / Linux，通过 `electron-builder` 打包          |
| **源码保护**    | 生产构建使用 `electron-vite` 字节码插件编译为 V8 字节码        |

## 技术栈

| 层级         | 技术                                                                            |
| ------------ | ------------------------------------------------------------------------------- |
| **桌面框架** | Electron 42                                                                     |
| **构建工具** | electron-vite                                                                   |
| **前端**     | Vue 3 (Composition API) + Pinia + Vue Router                                    |
| **UI 框架**  | Element Plus                                                                    |
| **AI SDK**   | Vercel AI SDK 6.x + `@ai-sdk/openai` + `@ai-sdk/anthropic` + `@ai-sdk/deepseek` |
| **Markdown** | markdown-it + highlight.js                                                      |
| **语言**     | TypeScript (strict)                                                             |

## 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18
- （可选）AI Provider 对应的 API Key

### 安装与运行

```bash
# 克隆仓库
git clone https://github.com/PYmili/LittleQ-Desktop.git
cd LittleQ-Desktop

# 安装依赖
npm install

# 启动开发环境
npm run dev
```

首次启动后，打开 **设置**（侧边栏齿轮图标），配置 AI Provider 的 API Key 即可使用。

### 构建打包

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

打包产物在 `dist/` 目录下。

## 项目结构

```
src/
├── main/                     # Electron 主进程
│   ├── index.ts               #   窗口创建、IPC 注册入口
│   ├── ai/                    #    AI 模块
│   │   ├── agent.ts           #     runAgent — streamText + fullStream 编排
│   │   ├── providers.ts       #     Provider 注册表 + getModel
│   │   └── tools.ts           #     Agent 工具（readFile / writeFile）
│   ├── common/                #    公共工具
│   │   └── fs-utils.ts        #     ensureDir、dateDir
│   ├── ipc-handlers/          #    IPC 处理器（按模块拆分）
│   │   ├── index.ts           #     统一注册入口
│   │   ├── ai-ipc-handlers.ts #     AI 对话流
│   │   ├── settings-ipc-handlers.ts # Provider 管理 + 导入/导出
│   │   ├── sessions-ipc-handlers.ts # 会话 CRUD
│   │   └── pet-ipc-handlers.ts#     宠物窗口控制
│   ├── stores/                #    持久化 Store
│   │   ├── settings-store.ts  #     Provider + 宠物配置
│   │   └── session-store.ts   #     会话数据
│   ├── types/                 #    类型声明
│   │   ├── index.ts           #     Barrel 统一导出
│   │   ├── ai.d.ts            #     AI 相关类型
│   │   └── store/             #     Store 类型声明
│   └── windows/               #    独立窗口管理
│       └── pet-window.ts      #     宠物窗口生命周期
├── preload/                   # 预加载脚本（contextBridge）
│   ├── index.ts               #   入口，合并各模块 API 并暴露
│   ├── index.d.ts             #   window.api 全局类型声明
│   ├── ai.preload.ts          #   AI 对话 API
│   ├── settings.preload.ts    #   设置管理 API
│   ├── sessions.preload.ts    #   会话管理 API
│   ├── pet.preload.ts         #   宠物窗口 API
│   └── types/                 #   preload 类型声明
└── renderer/                  # Vue 3 渲染进程
    ├── index.html             #   主窗口 HTML 入口
    ├── pet.html               #   宠物窗口 HTML 入口
    └── src/
        ├── main.ts            #   Vue 挂载入口
        ├── pet.ts             #   宠物窗口渲染入口
        ├── App.vue            #   根组件
        ├── components/        #   UI 组件
        │   ├── SideBar.vue
        │   ├── ChatArea.vue
        │   ├── ChatInput.vue
        │   ├── MessageList.vue
        │   ├── TypingIndicator.vue
        │   └── settings/
        │       ├── AiProviderPanel.vue
        │       ├── PetPanel.vue
        │       └── GeneralPanel.vue
        ├── composables/       #   组合式函数
        ├── pages/             #   路由页面
        ├── router/            #   Vue Router
        ├── stores/            #   Pinia Store（chat, theme）
        └── types/             #   渲染进程类型声明
```

### 数据目录

```
~/.little-q-desktop/
├── settings.json          # Provider 配置 + 选中 Provider + 主题偏好 + 宠物设置
└── sessions/
    ├── sessions.json      # 会话索引（id、标题、时间戳）
    └── YYYY-MM-DD/        # 按创建日期分目录存储
        └── {id}.json      # 单会话完整数据（含消息列表）
```

## 架构要点

### Agent 循环

使用 Vercel AI SDK 的 `streamText` + `stepCountIs(10)` 实现 ReAct 循环。AI 在 10 步内自主判断是否需要调用工具，反复迭代直至输出最终回复。

### 错误处理

API 错误（如余额不足、鉴权失败）通过 `fullStream` 捕获，并将原始错误消息与 HTTP 状态码一起发送到聊天界面：

```
[HTTP 402] Insufficient Balance
```

### 安全 IPC 架构

所有 AI API Key 仅存储在主进程中。渲染进程通过 `contextBridge`（隔离上下文）通信，流式回复通过 `webContents.send()` 实时推送到前端。

### 桌面宠物

可拖拽的 SVG 桌面宠物窗口，采用透明无边框 + `type: 'toolbar'` 配置避免 Windows DWM 边框伪影。支持缩放比例调节、位置记忆，可见性切换采用窗口创建/销毁策略。

## 配置 Provider

1. 进入 **设置** → **AI 服务**
2. 点击 **添加 Provider**
3. 填写配置信息：

| 字段     | 示例                |
| -------- | ------------------- |
| 名称     | 我的 DeepSeek       |
| 类型     | deepseek            |
| API Key  | `sk-xxx`            |
| 模型列表 | `deepseek-v4-flash`           |

列表中选择一个模型作为该 Provider 的默认模型，对话中可通过底部指示器随时切换。

## 开发指南

### 常用命令

| 命令                | 说明                               |
| ------------------- | ---------------------------------- |
| `npm run dev`       | 启动开发环境（HMR + 主进程热重载） |
| `npm run build`     | 类型检查 + 生产构建                |
| `npm run lint`      | ESLint 检查并自动修复              |
| `npm run format`    | Prettier 格式化                    |
| `npm run typecheck` | 全部 TypeScript 类型检查           |

### 调试

在 VS Code 中运行 **Debug All** 启动配置，可同时附加主进程与渲染进程进行调试。

## License

MIT (C) [PYmili](https://github.com/PYmili)
