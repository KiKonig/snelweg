// Mic tools for speaking practice: pronunciation check (speech recognition)
// and record-yourself-and-compare. Both optional; self-grading always works.
import { useEffect, useRef, useState } from 'preact/hooks'
import { PlayButton } from './components'
import {
  bestScore,
  listen,
  LISTEN_ERROR_TEXT,
  recognitionSupported,
  stopListening,
  verdict,
  type ListenError,
  type SpeechScore,
} from './speech'
import { playBlob, recordingSupported, saveRecording, startRecording, type ActiveRecording } from './recorder'
import { useSettings } from './settings'

export function SpeechResult({ r }: { r: SpeechScore }) {
  const v = verdict(r.score)
  return (
    <div class={`speech-result ${v.level}`} role="status">
      <div class="score-row">
        <span class="score">{r.score}%</span>
        <span>{v.text}</span>
      </div>
      <p class="marks">
        {r.marks.map((m, i) => (
          <span key={i} class={`mark ${m.status}`}>
            {m.word}{' '}
          </span>
        ))}
      </p>
      <p class="muted small">Verstanden: „{r.heard}“</p>
    </div>
  )
}

export function SpeakCheck({ text, onScore, compact = false }: { text: string; onScore?: (s: SpeechScore) => void; compact?: boolean }) {
  const { settings } = useSettings()
  const canCheck = recognitionSupported && settings.speechCheck
  const [state, setState] = useState<'idle' | 'listening' | 'recording'>('idle')
  const [interim, setInterim] = useState('')
  const [result, setResult] = useState<SpeechScore | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [mine, setMine] = useState<Blob | null>(null)
  const rec = useRef<ActiveRecording | null>(null)

  useEffect(() => {
    setResult(null)
    setError(null)
    setMine(null)
    setInterim('')
    return () => {
      stopListening()
      rec.current?.stop()
    }
  }, [text])

  const check = async () => {
    if (state === 'listening') return stopListening()
    setError(null)
    setResult(null)
    setInterim('')
    setState('listening')
    try {
      const alts = await listen(setInterim)
      const r = bestScore(text, alts)
      setResult(r)
      onScore?.(r)
    } catch (e) {
      setError(LISTEN_ERROR_TEXT[(e as ListenError) in LISTEN_ERROR_TEXT ? (e as ListenError) : 'other'])
    } finally {
      setState('idle')
    }
  }

  const record = async () => {
    if (state === 'recording') {
      const blob = await rec.current!.stop()
      rec.current = null
      setState('idle')
      setMine(blob)
      saveRecording(text, blob)
      return
    }
    setError(null)
    try {
      rec.current = await startRecording()
      setState('recording')
    } catch {
      setError('Kein Zugriff aufs Mikrofon. Bitte beim Dialog „Erlauben“ wählen (iPhone: Einstellungen → Safari → Mikrofon).')
    }
  }

  if (!canCheck && !recordingSupported) return null

  return (
    <div class={`speak-check ${compact ? 'compact' : ''}`}>
      <div class="row-inline">
        {canCheck && (
          <button class={`btn mic ${state === 'listening' ? 'live' : ''}`} onClick={check} disabled={state === 'recording'}>
            {state === 'listening' ? '● Ich höre zu …' : '🎤 Aussprache prüfen'}
          </button>
        )}
        {recordingSupported && (
          <button class={`btn ${state === 'recording' ? 'live' : ''}`} onClick={record} disabled={state === 'listening'}>
            {state === 'recording' ? '■ Stopp' : '⏺ Aufnehmen'}
          </button>
        )}
      </div>
      {state === 'listening' && <p class="muted small">{interim ? `„${interim}“` : 'Sprich jetzt den Satz auf Niederländisch.'}</p>}
      {state === 'recording' && <p class="muted small">Sprich den Satz, dann „Stopp“ tippen.</p>}
      {error && <p class="error small">{error}</p>}
      {result && <SpeechResult r={result} />}
      {mine && (
        <div class="row-inline compare">
          <button class="btn" onClick={() => playBlob(mine)}>
            ▶ Ich
          </button>
          <span class="muted small">Vorbild:</span>
          <PlayButton text={text} label="Vorbild anhören" />
          <PlayButton text={text} slow label="Vorbild langsam" />
        </div>
      )}
    </div>
  )
}
