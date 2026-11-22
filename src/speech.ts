// Optional pronunciation check (SPEC exercise 16): the browser's speech
// recognition (nl-NL) transcribes what was said, and we compare it word by
// word with the target sentence. Needs internet on most phones; never required.

type Rec = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start(): void
  stop(): void
  abort(): void
  onresult: ((e: any) => void) | null
  onerror: ((e: any) => void) | null
  onend: (() => void) | null
}

const Ctor: (new () => Rec) | undefined =
  typeof window !== 'undefined' ? (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition : undefined

export const recognitionSupported = !!Ctor

export type ListenError = 'not-allowed' | 'network' | 'no-speech' | 'unsupported' | 'other'

export const LISTEN_ERROR_TEXT: Record<ListenError, string> = {
  'not-allowed':
    'Kein Zugriff aufs Mikrofon oder Diktieren ist aus. iPhone: Einstellungen → Allgemein → Tastatur → „Diktierfunktion“ einschalten, und beim Mikrofon-Dialog „Erlauben“ wählen.',
  network: 'Der Aussprache-Check braucht Internet. Offline kannst du dich aufnehmen und vergleichen.',
  'no-speech': 'Ich habe nichts gehört. Tippe auf 🎤, warte einen Moment und sprich dann deutlich – ruhig etwas lauter.',
  unsupported: 'Dieser Browser unterstützt keine Spracherkennung.',
  other: 'Die Spracherkennung hat nicht geklappt. Versuch es noch einmal.',
}

/** Timing: how long we keep listening. */
const WAIT_FOR_SPEECH_MS = 7000 // nothing heard at all → give up
const SILENCE_AFTER_SPEECH_MS = 1600 // pause after speaking → done
const MAX_MS = 12000 // hard cap

let active: { rec: Rec; finish: () => void } | null = null

/** Stop listening and evaluate what was heard so far ("fertig" tap). */
export function stopListening() {
  active?.finish()
}

/** Abort without evaluating (e.g. leaving the screen). */
export function cancelListening() {
  if (!active) return
  const a = active
  active = null
  try {
    a.rec.onend = null
    a.rec.onresult = null
    a.rec.onerror = null
    a.rec.abort()
  } catch {
    /* ignore */
  }
}

/**
 * Listen until the speaker is done. iPhone's recognizer stops at the first
 * short pause when continuous=false, which cut people off before they even
 * started – so we listen continuously and decide ourselves when to stop:
 * after a pause once something was said, after a timeout, or on "fertig".
 * Resolves with alternatives for the whole utterance (best one is picked later).
 */
export function listen(onInterim?: (text: string) => void): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!Ctor) return reject('unsupported' as ListenError)
    cancelListening()
    // Xander must not talk into the microphone.
    try {
      if (window.speechSynthesis?.speaking || window.speechSynthesis?.pending) window.speechSynthesis.cancel()
    } catch {
      /* ignore */
    }

    const r = new Ctor()
    r.lang = 'nl-NL'
    r.interimResults = true
    r.maxAlternatives = 5
    r.continuous = true

    // segments[i] = alternatives for result i (final or latest interim)
    let segments: string[][] = []
    let error: ListenError | null = null
    let done = false
    let stopping = false
    const startedAt = Date.now()
    let silenceTimer: ReturnType<typeof setTimeout> | undefined

    const heard = () => segments.some((s) => s[0]?.trim())

    const alternatives = (): string[] => {
      const n = Math.max(1, ...segments.map((s) => s.length))
      const out: string[] = []
      for (let k = 0; k < n; k++) {
        const t = segments
          .map((s) => s[k] ?? s[0] ?? '')
          .join(' ')
          .replace(/\s+/g, ' ')
          .trim()
        if (t && !out.includes(t)) out.push(t)
      }
      return out
    }

    const settle = () => {
      if (done) return
      done = true
      clearTimeout(silenceTimer)
      clearTimeout(waitTimer)
      clearTimeout(maxTimer)
      if (active?.rec === r) active = null
      if (heard()) resolve(alternatives())
      else reject(error ?? 'no-speech')
    }

    const finish = () => {
      if (done || stopping) return
      stopping = true
      try {
        r.stop() // → onend → settle (with whatever was heard)
      } catch {
        settle()
      }
      // Safety net in case onend never fires (seen on iOS).
      setTimeout(settle, 1500)
    }

    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        segments[i] = Array.from({ length: res.length }, (_, k) => String(res[k].transcript))
      }
      segments = segments.filter(Boolean)
      onInterim?.(segments.map((s) => s[0]).join(' ').trim())
      clearTimeout(silenceTimer)
      silenceTimer = setTimeout(finish, SILENCE_AFTER_SPEECH_MS)
    }

    r.onerror = (e: any) => {
      // "no-speech" and "aborted" are not fatal: onend decides based on what we heard.
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') error = 'not-allowed'
      else if (e.error === 'network') error = 'network'
      else if (e.error === 'no-speech' || e.error === 'aborted') error = error ?? 'no-speech'
      else error = 'other'
    }

    let restarted = false
    r.onend = () => {
      // iOS sometimes ends a session right after starting. Restart once.
      if (!stopping && !done && !heard() && !restarted && error !== 'not-allowed' && error !== 'network' && Date.now() - startedAt < 1500) {
        restarted = true
        error = null
        try {
          r.start()
          return
        } catch {
          /* fall through */
        }
      }
      settle()
    }

    const waitTimer = setTimeout(() => !heard() && finish(), WAIT_FOR_SPEECH_MS)
    const maxTimer = setTimeout(finish, MAX_MS)
    active = { rec: r, finish }

    try {
      r.start()
    } catch {
      error = 'other'
      settle()
    }
  })
}

// ---------- scoring ----------

const NUM: Record<string, string> = {
  '0': 'nul', '1': 'een', '2': 'twee', '3': 'drie', '4': 'vier', '5': 'vijf', '6': 'zes', '7': 'zeven',
  '8': 'acht', '9': 'negen', '10': 'tien', '11': 'elf', '12': 'twaalf', '20': 'twintig', '30': 'dertig',
}

export function tokens(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[.,!?;:"„“”…()–-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => NUM[w] ?? w)
    .map((w) => (w === 'één' ? 'een' : w))
}

function lev(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
  return d[a.length][b.length]
}

function sim(a: string, b: string): number {
  if (a === b) return 1
  return 1 - lev(a, b) / Math.max(a.length, b.length)
}

export type WordMark = { word: string; status: 'ok' | 'close' | 'missing' }

export interface SpeechScore {
  score: number // 0–100
  marks: WordMark[] // per target word, in original spelling
  heard: string
}

/** Align heard words to target words (LCS with fuzzy matching). */
export function scoreSpeech(target: string, heard: string): SpeechScore {
  const tDisplay = target.replace(/[.,!?;:"„“”…]/g, '').split(/\s+/).filter(Boolean)
  const t = tokens(target)
  const h = tokens(heard)
  const n = t.length
  const m = h.length
  const val = (i: number, j: number) => {
    const s = sim(t[i], h[j])
    return s === 1 ? 1 : s >= 0.75 ? 0.5 : 0
  }
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--) {
      const v = val(i, j)
      dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1], v ? v + dp[i + 1][j + 1] : 0)
    }
  const marks: WordMark[] = []
  let i = 0
  let j = 0
  while (i < n) {
    const v = j < m ? val(i, j) : 0
    if (j < m && v && dp[i][j] === v + dp[i + 1][j + 1]) {
      marks.push({ word: tDisplay[i] ?? t[i], status: v === 1 ? 'ok' : 'close' })
      i++
      j++
    } else if (j < m && dp[i][j + 1] >= dp[i + 1][j]) {
      j++
    } else {
      marks.push({ word: tDisplay[i] ?? t[i], status: 'missing' })
      i++
    }
  }
  const raw = n ? dp[0][0] / n : 0
  // Penalise lots of extra words a little.
  const extra = Math.max(0, m - n)
  let score = Math.round(Math.max(0, raw - extra * 0.05) * 100)
  // Recognizers sometimes split or join compounds ("goede morgen" vs "goedemorgen"):
  // compare without spaces as a fallback.
  const joined = sim(t.join(''), h.join(''))
  if (n !== m && joined >= 0.9 && joined * 100 > score) {
    score = Math.round(joined * 100)
    return { score, marks: tDisplay.map((w) => ({ word: w, status: joined === 1 ? 'ok' : 'close' })), heard }
  }
  return { score, marks, heard }
}

export function bestScore(target: string, alternatives: string[]): SpeechScore {
  return alternatives.map((a) => scoreSpeech(target, a)).sort((a, b) => b.score - a.score)[0]
}

export function verdict(score: number): { text: string; level: 'good' | 'mid' | 'bad' } {
  if (score >= 90) return { text: 'Sehr gut – das versteht jeder Niederländer!', level: 'good' }
  if (score >= 60) return { text: 'Fast! Achte auf die markierten Wörter.', level: 'mid' }
  return { text: 'Noch nicht verstanden. Hör dir das Vorbild an und versuch es nochmal.', level: 'bad' }
}
