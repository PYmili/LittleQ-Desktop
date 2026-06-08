<h1 align="center">
  <br>
  <img src="/resources/pet/svg/little-q-idle.svg" alt="LittleQ" width="96">
  <br>
  LittleQ Desktop
  <br>
</h1>

<p align="center">An AI-powered desktop assistant with agent capabilities, model switching, reasoning display, theme system, and real-time streaming.</p>

<p align="center">
  <a href="./README.md">中文</a>
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

## Overview

**LittleQ Desktop** is a cross-platform desktop AI assistant built with Electron and Vue 3. It leverages the [Vercel AI SDK](https://sdk.vercel.ai/) to provide:

- **Multi-provider chat** — OpenAI, Anthropic Claude, DeepSeek, or any OpenAI-compatible endpoint
- **Agent mode** — AI can read/write files on your machine via built-in tools
- **Streaming responses** — Real-time Markdown rendering with syntax highlighting
- **Session management** — Persistent chat history with local file storage
- **Desktop pet** — Draggable SVG desktop companion with scale and position memory

All API keys stay on your machine — **nothing leaves your computer** except the AI requests you make.

## Screenshots

<p align="center">
  <img src="/images/preview.png" alt="preview">
</p>

## Features

| Category              | Details                                                                                   |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **AI Providers**      | OpenAI, Anthropic Claude, DeepSeek, or any OpenAI-compatible API (Ollama, vLLM, etc.)     |
| **Model Switching**   | Multiple models per provider with one-click switching from chat input                     |
| **Reasoning Display** | Collapsible AI reasoning/thinking display (DeepSeek-R1 / OpenAI Responses API)            |
| **Agent Tools**       | Built-in `readFile` / `writeFile` tools let the AI interact with your project files       |
| **Streaming**         | Real-time response streaming with Markdown rendering and code syntax highlighting         |
| **Theme System**      | Dark / fog-blue light theme with CSS variables and Element Plus integration               |
| **Desktop Pet**       | Draggable SVG desktop companion with scale control and position memory                    |
| **Sessions**          | Create, switch, and delete chat sessions; auto-persisted to disk (`~/.little-q-desktop/`) |
| **Config Management** | One-click export/import of provider settings for easy sharing and migration               |
| **Cross-platform**    | Windows, macOS, Linux — packaged by `electron-builder`                                    |
| **Source Protection** | Production builds compile to V8 bytecode via `electron-vite` bytecode plugin              |

## Tech Stack

| Layer             | Technology                                                                      |
| ----------------- | ------------------------------------------------------------------------------- |
| **Desktop Shell** | Electron 42                                                                     |
| **Build Tool**    | electron-vite                                                                   |
| **Frontend**      | Vue 3 (Composition API) + Pinia + Vue Router                                    |
| **UI Framework**  | Element Plus                                                                    |
| **AI SDK**        | Vercel AI SDK 6.x + `@ai-sdk/openai` + `@ai-sdk/anthropic` + `@ai-sdk/deepseek` |
| **Markdown**      | markdown-it + highlight.js                                                      |
| **Language**      | TypeScript (strict)                                                             |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) >= 18
- (Optional) An API key for your preferred AI provider

### Install & Run

```bash
# Clone the repository
git clone https://github.com/PYmili/LittleQ-Desktop.git
cd LittleQ-Desktop

# Install dependencies
npm install

# Start development
npm run dev
```

On first launch, open **Settings** (gear icon in the sidebar) and configure your AI provider with an API key.

### Build

```bash
# Windows
npm run build:win

# macOS
npm run build:mac

# Linux
npm run build:linux
```

Packaged output will be in the `dist/` directory.

## Project Structure

```
src/
├── main/                     # Electron main process
│   ├── index.ts               #   Window creation, IPC registration
│   ├── ai/                    #   AI module
│   │   ├── agent.ts           #     runAgent — streamText + fullStream orchestration
│   │   ├── providers.ts       #     Provider registry + getModel
│   │   └── tools.ts           #     Agent tools (readFile / writeFile)
│   ├── common/                #   Shared utilities
│   │   └── fs-utils.ts        #     ensureDir, dateDir
│   ├── ipc-handlers/          #   IPC handlers (modular)
│   │   ├── index.ts           #     Unified registration
│   │   ├── ai-ipc-handlers.ts #     AI streaming
│   │   ├── settings-ipc-handlers.ts # Provider management + import/export
│   │   ├── sessions-ipc-handlers.ts # Session CRUD
│   │   └── pet-ipc-handlers.ts#     Pet window control
│   ├── stores/                #   Persistence stores
│   │   ├── settings-store.ts  #     Provider + pet settings
│   │   └── session-store.ts   #     Session data
│   ├── types/                 #   Type declarations
│   │   ├── index.ts           #     Barrel exports
│   │   ├── ai.d.ts            #     AI-related types
│   │   └── store/             #     Store type declarations
│   └── windows/               #   Standalone window management
│       └── pet-window.ts      #     Pet window lifecycle
├── preload/                   # Preload scripts (contextBridge)
│   ├── index.ts               #   Entry point, merges and exposes all API modules
│   ├── index.d.ts             #   window.api global type declaration
│   ├── ai.preload.ts          #   AI chat API
│   ├── settings.preload.ts    #   Settings API
│   ├── sessions.preload.ts    #   Session API
│   ├── pet.preload.ts         #   Pet window API
│   └── types/                 #   Preload type declarations
└── renderer/                  # Vue 3 renderer process
    ├── index.html             #   Main window HTML entry
    ├── pet.html               #   Pet window HTML entry
    └── src/
        ├── main.ts            #   Vue mount entry
        ├── pet.ts             #   Pet window render entry
        ├── App.vue            #   Root component
        ├── components/        #   UI components
        │   ├── SideBar.vue
        │   ├── ChatArea.vue
        │   ├── ChatInput.vue
        │   ├── MessageList.vue
        │   ├── TypingIndicator.vue
        │   └── settings/
        │       ├── AiProviderPanel.vue
        │       ├── PetPanel.vue
        │       └── GeneralPanel.vue
        ├── composables/       #   Composables
        ├── pages/             #   Route pages
        ├── router/            #   Vue Router
        ├── stores/            #   Pinia stores (chat, theme)
        └── types/             #   Renderer type declarations
```

### Data Directory

```
~/.little-q-desktop/
├── settings.json          # Provider configs + selected provider + theme + pet settings
└── sessions/
    ├── sessions.json      # Session index (id, title, timestamps)
    └── YYYY-MM-DD/        # Sessions organized by creation date
        └── {id}.json      # Full session data with messages
```

## Architecture Highlights

### Agent Loop

The agent uses `streamText` + `stepCountIs(10)` from the Vercel AI SDK to implement a ReAct loop. The AI autonomously decides whether to call tools (up to 10 steps) before producing a final response.

### Error Handling

API errors (e.g., insufficient balance, auth failures) are captured from the `fullStream` and forwarded to the chat UI with the original error message and HTTP status code:

```
[HTTP 402] Insufficient Balance
```

### Secure IPC

All AI API keys reside in the main process only. The renderer communicates via `contextBridge` (isolated context), and streaming responses are pushed through `webContents.send()`.

### Desktop Pet

A draggable SVG desktop companion using transparent frameless window with `type: 'toolbar'` to prevent Windows DWM border artifacts. Supports scale adjustment, position memory, and create/destroy visibility toggle strategy.

## Configuration

### Adding a Provider

1. Go to **Settings** → **AI 服务**
2. Click **添加 Provider**
3. Fill in the provider details:

| Field   | Example             |
| ------- | ------------------- |
| Name    | My DeepSeek         |
| Type    | deepseek            |
| API Key | `sk-xxx`            |
| Models  | `deepseek-v4-flash`           |

Select a model from the list as the default; switch models anytime from the chat input indicator.

## Development

### Scripts

| Command             | Description                                      |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Start dev server (HMR + main process hot reload) |
| `npm run build`     | Type-check + production build                    |
| `npm run lint`      | ESLint check + auto-fix                          |
| `npm run format`    | Prettier formatting                              |
| `npm run typecheck` | Full TypeScript type checking                    |

### Debugging

Open the project in VS Code and run the **Debug All** launch configuration — it attaches to both the main and renderer processes simultaneously.

## License

MIT (C) [PYmili](https://github.com/PYmili)
