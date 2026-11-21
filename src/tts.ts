// Dutch text-to-speech with the browser's built-in voices (works offline
// once a Dutch voice is installed on the device).
import { useEffect, useState } from 'preact/hooks'

export type VoiceStatus = 'checking' | 'ok' | 'missing' | 'unsupported'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

function isDutch(v: SpeechSynthesisVoice) {
  return v.lang.replace('_', '-').toLowerCase().startsWith('nl')
}

function pickDutch(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const nl = voices.filter(isDutch)
  if (!nl.length) return null
  const nlNL = nl.filter((v) => v.lang.replace('_', '-').toLowerCase() === 'nl-nl')
  const pool = nlNL.length ? nlNL : nl
  // Prefer higher-quality local voices.
  return (
    pool.find((v) => /premium|enhanced|erweitert/i.test(v.name)) ??
    pool.find((v) => v.localService) ??
    pool[0]
  )
}

let cached: SpeechSynthesisVoice | null = null

/** Voices load asynchronously (especially on iPhone), so wait a moment. */
export function findDutchVoice(timeoutMs = 2500): Promise<SpeechSynthesisVoice | null> {
  if (!supported) return Promise.resolve(null)
  if (cached) return Promise.resolve(cached)
  return new Promise((resolve) => {
    const start = Date.now()
    const check = () => {
      const v = pickDutch(speechSynthesis.getVoices())
      if (v) {
        cached = v
        resolve(v)
      } else if (Date.now() - start > timeoutMs) {
        resolve(null)
      } else {
        setTimeout(check, 200)
      }
    }
    speechSynthesis.addEventListener?.('voiceschanged', check, { once: true })
    check()
  })
}

export async function speak(text: string, rate = 0.9): Promise<void> {
  if (!supported) return
  const voice = await findDutchVoice()
  speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(text)
  u.lang = 'nl-NL'
  if (voice) u.voice = voice
  u.rate = rate
  speechSynthesis.speak(u)
}

export function useDutchVoice() {
  const [status, setStatus] = useState<VoiceStatus>(supported ? 'checking' : 'unsupported')
  const [name, setName] = useState<string | null>(null)
  useEffect(() => {
    if (!supported) return
    let alive = true
    findDutchVoice().then((v) => {
      if (!alive) return
      setStatus(v ? 'ok' : 'missing')
      setName(v ? `${v.name} (${v.lang})` : null)
    })
    return () => {
      alive = false
    }
  }, [])
  return { status, name }
}
