import { ElectronAPI } from '@electron-toolkit/preload'

interface ProviderInfo {
  id: string
  name: string
  type: string
  apiKey: string
  baseURL?: string
  models: string[]
  defaultModel: string
}

interface SessionSummary {
  id: string
  title: string
  createdAt: number
  updatedAt: number
}

interface SessionData {
  id: string
  title: string
  messages: { id: string; role: 'user' | 'assistant'; content: string; timestamp: number }[]
  createdAt: number
  updatedAt: number
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      aiStream: (params: {
        messages: { role: string; content: string }[]
        config: { providerId: string; model: string }
      }) => Promise<void>

      onAiChunk: (
        callback: (chunk: {
          type: 'content' | 'tool_call' | 'done' | 'error'
          text?: string
          toolName?: string
          error?: string
        }) => void
      ) => () => void

      settingsLoad: () => Promise<{
        providers: ProviderInfo[]
        selectedProviderId: string | null
      }>
      settingsProviderAdd: (provider: ProviderInfo) => Promise<string | null>
      settingsProviderRemove: (id: string) => Promise<void>
      settingsProviderSelect: (id: string | null) => Promise<void>
      settingsExport: () => Promise<boolean>
      settingsImport: () => Promise<ProviderInfo[] | null>

      sessionsList: () => Promise<SessionSummary[]>
      sessionsLoad: (params: { id: string; createdAt: number }) => Promise<SessionData | null>
      sessionsSave: (session: SessionData) => Promise<void>
      sessionsDelete: (params: { id: string; createdAt: number }) => Promise<void>
    }
  }
}
