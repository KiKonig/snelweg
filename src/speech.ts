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
  'no-speech': 'Ich habe nichts gehört. Tippe noch einmal und sprich deutlich ins Mikrofon.',
  unsupported: 'Dieser Browser unterstützt keine Spracherkennung.',
  other: 'Die Spracherkennung hat nicht geklappt. Versuch es noch einmal.',
}

let active: Rec | null = null

export function stopListening() {
  try {
    active?.stop()
  } catch {
    /* ignore */
  }
}

/**
 * Listen once. Resolves with all alternatives the recognizer offers
 * (we pick the one closest to the target – fairer for learners).
 */
export function listen(onInterim?: (text: string) => void): Promise<string[]> {
  return new Promise((resolve, reject) => {
    if (!Ctor) return reject('unsupported' as ListenError)
    active?.abort()
    const r = new Ctor()
    active = r
    r.lang = 'nl-NL'
    r.interimResults = true
    r.maxAlternatives = 5
    r.continuous = false
    let finals: string[] = []
    let lastInterim = ''
    let failed = false
    r.onresult = (e: any) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const res = e.results[i]
        if (res.isFinal) {
          finals = Array.from({ length: res.length }, (_, k) => res[k].transcript as string)
        } else {
          lastInterim = res[0].transcript
          onInterim?.(lastInterim)
        }
      }
    }
    r.onerror = (e: any) => {
      failed = true
      const err: ListenError =
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? 'not-allowed'
          : e.error === 'network'
            ? 'network'
            : e.error === 'no-speech' || e.error === 'aborted'
              ? 'no-speech'
              : 'other'
      reject(err)
    }
    r.onend = () => {
      active = null
      if (failed) return
      const out = finals.length ? finals : lastInterim ? [lastInterim] : []
      if (out.length) resolve(out)
      else reject('no-speech' as ListenError)
    }
    try {
      r.start()
    } catch {
      reject('other' as ListenError)
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
