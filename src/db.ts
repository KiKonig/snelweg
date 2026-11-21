// On-device storage (IndexedDB via Dexie). Nothing ever leaves the phone
// except through the user's own export.
import Dexie, { type Table } from 'dexie'

export interface KV {
  key: string
  value: unknown
}

export interface Settings {
  dailyMinutes: number
  audioOn: boolean
  audioRate: number
}

export interface Stats {
  streak: number
  lastSessionDate: string | null // YYYY-MM-DD, local time
  sessionsDone: number
  itemsSeen: number
}

class SnelwegDB extends Dexie {
  kv!: Table<KV, string>
  constructor() {
    super('snelweg')
    this.version(1).stores({ kv: 'key' })
  }
}

export const db = new SnelwegDB()

export const DEFAULT_SETTINGS: Settings = { dailyMinutes: 30, audioOn: true, audioRate: 0.9 }
export const DEFAULT_STATS: Stats = { streak: 0, lastSessionDate: null, sessionsDone: 0, itemsSeen: 0 }

async function getKV<T>(key: string, fallback: T): Promise<T> {
  const row = await db.kv.get(key)
  return { ...fallback, ...((row?.value as Partial<T>) ?? {}) }
}

export const getSettings = () => getKV('settings', DEFAULT_SETTINGS)
export const saveSettings = (s: Settings) => db.kv.put({ key: 'settings', value: s })
export const getStats = () => getKV('stats', DEFAULT_STATS)

export function localDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Called when a daily session is finished: updates streak and counters. */
export async function recordSession(items: number): Promise<Stats> {
  const s = await getStats()
  const today = localDate()
  const yesterday = localDate(new Date(Date.now() - 86_400_000))
  if (s.lastSessionDate !== today) {
    s.streak = s.lastSessionDate === yesterday ? s.streak + 1 : 1
  }
  s.lastSessionDate = today
  s.sessionsDone += 1
  s.itemsSeen += items
  await db.kv.put({ key: 'stats', value: s })
  return s
}

/** Streak only counts if the last session was today or yesterday. */
export function currentStreak(s: Stats): number {
  const today = localDate()
  const yesterday = localDate(new Date(Date.now() - 86_400_000))
  return s.lastSessionDate === today || s.lastSessionDate === yesterday ? s.streak : 0
}

// ---------- Export / import / reset ----------

const EXPORT_APP = 'snelweg'
const EXPORT_FORMAT = 1

export async function exportProgress(): Promise<File> {
  const tables: Record<string, unknown[]> = {}
  for (const t of db.tables) tables[t.name] = await t.toArray()
  const data = {
    app: EXPORT_APP,
    format: EXPORT_FORMAT,
    dbVersion: db.verno,
    exportedAt: new Date().toISOString(),
    tables,
  }
  const name = `snelweg-fortschritt-${localDate()}.json`
  return new File([JSON.stringify(data, null, 2)], name, { type: 'application/json' })
}

export async function importProgress(file: File): Promise<void> {
  let data: any
  try {
    data = JSON.parse(await file.text())
  } catch {
    throw new Error('Die Datei ist keine gültige JSON-Datei.')
  }
  if (data?.app !== EXPORT_APP || typeof data.tables !== 'object') {
    throw new Error('Das ist keine Snelweg-Sicherung.')
  }
  if (data.format > EXPORT_FORMAT) {
    throw new Error('Diese Sicherung stammt aus einer neueren App-Version. Bitte zuerst die App aktualisieren.')
  }
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) {
      await t.clear()
      const rows = data.tables[t.name]
      if (Array.isArray(rows)) await t.bulkPut(rows)
    }
  })
}

export async function resetProgress(): Promise<void> {
  await db.transaction('rw', db.tables, async () => {
    for (const t of db.tables) await t.clear()
  })
}

/** Ask the browser not to evict our data (important on iPhone). */
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted && (await navigator.storage.persisted())) return true
    return (await navigator.storage?.persist?.()) ?? false
  } catch {
    return false
  }
}
