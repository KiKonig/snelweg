// App-wide settings, loaded once from IndexedDB and kept in memory.
import { createContext, type ComponentChildren } from 'preact'
import { useContext, useEffect, useState } from 'preact/hooks'
import { DEFAULT_SETTINGS, getSettings, saveSettings, type Settings } from './db'
export type { Settings }

interface Ctx {
  settings: Settings
  update: (patch: Partial<Settings>) => void
  reload: () => Promise<void>
}

const SettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  update: () => {},
  reload: async () => {},
})

export function SettingsProvider({ children }: { children: ComponentChildren }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const reload = async () => setSettings(await getSettings())
  useEffect(() => {
    reload()
  }, [])
  const update = (patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      saveSettings(next)
      return next
    })
  }
  return <SettingsContext.Provider value={{ settings, update, reload }}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
