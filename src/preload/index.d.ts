import { ElectronAPI } from '@electron-toolkit/preload'
import type { AiApi } from './types/ai.preload.types'
import type { SettingsApi } from './types/settings.preload.types'
import type { SessionsApi } from './types/sessions.preload.types'
import type { PetApi } from './types/pet.preload.types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: AiApi & SettingsApi & SessionsApi & PetApi
  }
}
