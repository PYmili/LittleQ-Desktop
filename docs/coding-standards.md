# 代码编写规范

## 格式化

- **Prettier**：单引号、无分号、100 列、无尾逗号、`endOfLine: auto`
- **ESLint**：`vue3-recommended` + `@electron-toolkit` 规则集
- 关闭了 `vue/multi-word-component-names` 和 `vue/require-default-prop`
- 缩进 2 空格，LF 行尾，文件末尾保留空行，去除行尾空白（见 `.editorconfig`）

## 注释（TSDoc）

### TSDoc 使用范围

`/** */` 格式的 TSDoc 注释**仅**用于以下声明：

- 模块（文件顶部）
- 接口 / 类型定义
- 函数声明（`function`、`export function`）
- 组件声明

使用标准标签：`@remarks`、`@param`、`@returns`、`@example`。注释第一行写简要说明。

`eslint-plugin-tsdoc`（`tsdoc/syntax: warn`）在 `.ts`/`.tsx`/`.vue` 文件中自动检查 TSDoc 语法，基线为 0 warning。

### 单行注释

函数体内部、模块级变量、内联说明等**非声明**的注释，统一使用 `//` 格式：

```ts
// ✅ 正确：函数内步骤注释
function processData(data: Data[]): Result {
  // 筛选有效数据
  const valid = data.filter((d) => d.value > 0)
  // 按时间排序
  valid.sort((a, b) => a.time - b.time)
  // 聚合计算
  return aggregate(valid)
}

// ✅ 正确：模块级变量注释
const MAX_RETRY = 3

// ❌ 错误：禁止在函数体内使用 TSDoc 格式
/** 筛选有效数据 */
const valid = data.filter(...)
```

### 函数内步骤注释

函数内代码必须按照逻辑步骤或代码块，使用 `//` 进行注释编写，**不允许函数体内零注释**。

要求如下：

- 每个逻辑步骤、独立的代码块前应有 `//` 说明该步骤的目的
- 注释应描述"做什么"，而非"怎么做"（代码本身说明"怎么做"）
- 单行简单语句（如 `return`、单次赋值）可省略
- 条件分支（`if`/`else`）、循环、错误处理块必须有注释

```ts
// ✅ 正确：有步骤注释的函数
function createPetWindow(): BrowserWindow {
  const win = new BrowserWindow({
    // ... 窗口配置
  })

  // 禁用窗口阴影，避免 Windows DWM 边框伪影
  win.setHasShadow(false)

  // 页面加载完成后确保透明背景生效
  win.webContents.on('did-finish-load', () => {
    win.setBackgroundColor('#00000000')
  })

  // 窗口关闭时清理实例引用
  win.on('closed', () => {
    petWindow = null
  })

  // 根据环境加载不同的入口文件
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'] + 'pet.html')
  } else {
    win.loadFile(join(__dirname, '../renderer/pet.html'))
  }

  petWindow = win
  return win
}
```

```ts
// ✅ 正确：即使是简单函数也应有基本步骤注释
function loadSession(id: string, createdAt: number): SessionData | null {
  // 构建会话文件路径
  const filePath = sessionPath(id, createdAt)
  if (!existsSync(filePath)) return null
  // 读取并解析会话数据
  const raw = readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}
```

```ts
// ❌ 错误：函数体完全无注释
function formatErrorMessage(err: unknown): string {
  if (APICallError.isInstance(err)) {
    const msg = err.data?.error?.message || err.message
    return `[HTTP ${err.statusCode}] ${msg}`
  }
  if (err instanceof Error) return err.message
  return String(err)
}
```

## 接口/类型命名规范

按用途选择后缀，不使用冗余前缀（如 `I`）：

| 后缀                         | 适用场景           | 示例                       |
| ---------------------------- | ------------------ | -------------------------- |
| `Entity` / `Model`           | 核心业务对象       | `UserEntity`、`ChatModel`  |
| `Dto` / `Payload` / `Params` | API 出入参         | `LoginDto`、`SavePayload`  |
| `Props`                      | Vue/React 组件属性 | `ButtonProps`              |
| `State` / `Store`            | 状态管理           | `ChatState`                |
| `Config` / `Options`         | 配置项             | `ChartConfig`、`AiOptions` |

### Vue 组件 Props 类型

Props 类型只用于当前组件时，使用 `Props` 后缀，定义在组件文件内或同目录 `types.ts` 中：

```ts
// ❌ 错误
interface ButtonType { ... }

// ✅ 正确
interface ButtonProps { ... }
```

### Store 中的 Models

Store 中定义核心业务对象时，使用 `Model` 后缀：

```ts
// ❌ 错误
export interface Message { ... }
export interface Conversation { ... }

// ✅ 正确
export interface MessageModel { ... }
export interface ConversationModel { ... }
```

## 文件组织

- 类型定义与业务逻辑分离：接口/类型放在 `types/` 目录下，通过 `import type` 引用
- **类型声明文件统一使用 `.d.ts` 后缀**：如 `ai.d.ts`、`settings-store.d.ts`、`ai.preload.d.ts`
- 模块 barrel 文件（仅含 `export type` 重导出）使用 `.ts` 后缀：如 `types/index.ts`
- Store 类型：`types/store/{module}.d.ts`
- Preload 类型：`types/{module}.preload.d.ts`
- 公共工具函数：`common/` 目录
