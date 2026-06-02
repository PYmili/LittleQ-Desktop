# 宠物窗口上/左边框黑线问题

## 现象

桌面宠物（Pet）窗口的上边缘和左边缘出现细小的黑线（约 1px），仅在 Windows 平台出现。开启 DEBUG 边框模式后黑边消失。

## 根因分析

### 问题定位过程

1. **排除 SVG 问题**：确认 SVG 资源本身无边框
2. **DEBUG 模式测试**：开启 DEBUG 边框后黑边消失，说明问题在渲染合成层，而非窗口边框
3. **CSS `outline` 修复无效**：添加 `outline: 1px solid transparent` 不生效，说明透明轮廓不触发 GPU 合成层

### 根本原因

Windows 下 Electron 透明无边框窗口存在两个层面问题：

1. **DWM 合成层**：即使设置 `frame: false` + `transparent: true`，Windows DWM（Desktop Window Manager）仍会为窗口添加微妙的边框阴影，表现为 1px 黑边
2. **GPU 合成伪影**：Chromium 渲染引擎在透明窗口中，`html`/`body` 元素与窗口客户区的边缘存在亚像素合成偏移（sub-pixel compositing artifact），导致上/左边出现黑色渲染残留

## 解决方案

三管齐下，从窗口层、布局层、合成层同时修复：

### 1. 窗口层：移除 DWM 阴影

`src/main/windows/pet-window.ts` — `createPetWindow()`：

```typescript
const petWindow = new BrowserWindow({
  // ... 其他选项
  hasShadow: false, // 禁用窗口阴影
  type: 'toolbar' // Windows: 使用 WS_EX_TOOLWINDOW 样式，去除 DWM 边框
})

petWindow.setHasShadow(false) // 运行时确保阴影已禁用
```

- `hasShadow: false`：构造函数中声明无阴影
- `type: 'toolbar'`：Windows 平台使用 `WS_EX_TOOLWINDOW` 扩展样式，改变 DWM 对该窗口的合成行为
- `setHasShadow(false)`：运行时再次确认阴影已移除

### 2. 布局层：精确对齐窗口原点

`src/renderer/pet.html` — CSS：

```css
html {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent !important;
}
```

- `position: fixed` + `left: 0; top: 0` 确保 `html` 元素精确固定在窗口客户区原点 (0, 0)，消除任何布局偏移的可能

### 3. 合成层：强制 GPU 独立图层

`src/renderer/pet.html` — CSS：

```css
html {
  will-change: transform;
}

body {
  will-change: transform;
}
```

- `will-change: transform` 告知浏览器该元素将被变换，强制 Chromium 为其创建独立的 GPU 合成层（compositing layer）
- 独立合成层避免了与窗口边缘共享合成缓冲区时的亚像素渲染伪影

## 关键知识点

| 概念                           | 说明                                                            |
| ------------------------------ | --------------------------------------------------------------- |
| DWM (Desktop Window Manager)   | Windows 桌面合成器，即使无边框窗口也可能添加阴影/边框           |
| `WS_EX_TOOLWINDOW`             | Windows 扩展窗口样式，Electron 中通过 `type: 'toolbar'` 启用    |
| `will-change`                  | CSS 属性，提示浏览器预先创建 GPU 合成层，避免边缘合成伪影       |
| sub-pixel compositing artifact | GPU 合成层之间因亚像素偏移产生的黑色/白色边缘线，常见于透明窗口 |
| compositing layer              | Chromium 渲染流程中的独立图层，拥有独立的 GPU 纹理和合成参数    |

## 涉及文件

| 文件                    | 修改内容                                                     |
| ----------------------- | ------------------------------------------------------------ |
| `src/main/windows/pet-window.ts` | `hasShadow: false`、`type: 'toolbar'`、`setHasShadow(false)` |
| `src/renderer/pet.html` | `position: fixed` 布局 + `will-change: transform` 合成层修复 |
