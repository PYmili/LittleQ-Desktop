# 代码编写规范

## 格式化

- **Prettier**：单引号、无分号、100 列、无尾逗号、`endOfLine: auto`
- **ESLint**：`vue3-recommended` + `@electron-toolkit` 规则集
- 关闭了 `vue/multi-word-component-names` 和 `vue/require-default-prop`
- 缩进 2 空格，LF 行尾，文件末尾保留空行，去除行尾空白（见 `.editorconfig`）

## 注释（TSDoc）

所有模块、接口、函数、组件必须编写 `/** */` 格式的 TSDoc 注释。

- 使用标准标签：`@remarks`、`@param`、`@returns`、`@example`
- 注释第一行写简要说明
- `eslint-plugin-tsdoc`（`tsdoc/syntax: warn`）在 `.ts`/`.tsx`/`.vue` 文件中自动检查 TSDoc 语法，基线为 0 warning

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
- Store 类型：`types/store/{module}.types.ts`
- 公共工具函数：`common/` 目录
