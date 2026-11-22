// Record yourself (works offline). Last 20 recordings are kept on the device only.
import { db } from './db'

export const recordingSupported =
  typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined'

export interface RecordingRow {
  id?: number
  phrase: string // the Dutch text
  blob: Blob
  at: number
}

const KEEP = 20

function pickMime(): string | undefined {
  for (const m of ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']) {
    if (MediaRecorder.isTypeSupported?.(m)) return m
  }
  return undefined
}

export interface ActiveRecording {
  stop: () => Promise<Blob>
}

export async function startRecording(maxMs = 10000): Promise<ActiveRecording> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } })
  const mime = pickMime()
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined)
  const chunks: Blob[] = []
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data)
  let resolveStop: (b: Blob) => void
  const done = new Promise<Blob>((r) => (resolveStop = r))
  rec.onstop = () => {
    stream.getTracks().forEach((t) => t.stop())
    resolveStop(new Blob(chunks, { type: rec.mimeType || mime || 'audio/mp4' }))
  }
  rec.start()
  const timer = setTimeout(() => rec.state !== 'inactive' && rec.stop(), maxMs)
  return {
    stop: () => {
      clearTimeout(timer)
      if (rec.state !== 'inactive') rec.stop()
      return done
    },
  }
}

export async function saveRecording(phrase: string, blob: Blob): Promise<void> {
  await db.recordings.add({ phrase, blob, at: Date.now() })
  const all = await db.recordings.orderBy('at').primaryKeys()
  if (all.length > KEEP) await db.recordings.bulkDelete(all.slice(0, all.length - KEEP))
}

export async function countRecordings(): Promise<number> {
  return db.recordings.count()
}

export async function deleteRecordings(): Promise<void> {
  await db.recordings.clear()
}

let current: HTMLAudioElement | null = null

export function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    current?.pause()
    const url = URL.createObjectURL(blob)
    const a = new Audio(url)
    current = a
    a.onended = a.onerror = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    a.play().catch(() => resolve())
  })
}
