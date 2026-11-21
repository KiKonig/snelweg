import { useEffect, useRef, useState } from 'preact/hooks'
import { addMinutes, db, recordSession } from '../db'
import { IntroPhrase, IntroVerb, Listen, SayIt, TypedExercise, type Answer } from '../exercises'
import { go } from '../router'
import { buildSession, modeFromParams, type Item } from '../session'
import { autoGrade, medianTime, Rating, recordMistake, recordTime, review } from '../srs'
import { useSettings } from '../settings'

export interface SessionResult {
  total: number
  correct: number
  newItems: number
  minutes: number
  mistakes: Record<string, number>
  mode: string
}

const isTest = (i: Item) => i.type !== 'introVerb' && i.type !== 'introPhrase'

export function Session({ params }: { params: string[] }) {
  const { settings } = useSettings()
  const [queue, setQueue] = useState<Item[] | null>(null)
  const [idx, setIdx] = useState(0)
  const stats = useRef({ total: 0, correct: 0, newItems: 0, mistakes: {} as Record<string, number> })
  const requeued = useRef(new Map<string, number>())
  const started = useRef(Date.now())
  const busy = useRef(false)

  useEffect(() => {
    const mode = modeFromParams(params)
    if (mode.kind === 'daily' && !mode.minutes) mode.minutes = settings.dailyMinutes
    buildSession(mode).then((q) => {
      setQueue(q)
      setIdx(0)
    })
    started.current = Date.now()
    stats.current = { total: 0, correct: 0, newItems: 0, mistakes: {} }
    requeued.current = new Map()
  }, [params.join('/')])

  const finish = async (q: Item[]) => {
    const minutes = Math.max(1, Math.round((Date.now() - started.current) / 60000))
    const s = stats.current
    const result: SessionResult = { ...s, minutes, mode: params.join('/') }
    sessionStorage.setItem('lastSession', JSON.stringify(result))
    if (q.filter(isTest).length) {
      await recordSession(s.total)
      await addMinutes(minutes)
    }
    go('zusammenfassung')
  }

  const advance = (q: Item[], i: number) => {
    busy.current = false
    if (i + 1 >= q.length) finish(q)
    else setIdx(i + 1)
  }

  const handleIntro = () => {
    stats.current.newItems += 1
    advance(queue!, idx)
  }

  const handleResult = async (item: Item, correct: boolean, grade: number, ms: number, mistake?: string) => {
    if (busy.current || !('card' in item)) return
    busy.current = true
    const s = stats.current
    s.total += 1
    if (correct) s.correct += 1
    await review(item.card, grade as any)
    await recordTime(item.type as any, ms)
    let q = queue!
    if (!correct) {
      const type = mistake ?? (item.type === 'say' ? 'phrase' : item.type)
      s.mistakes[type] = (s.mistakes[type] ?? 0) + 1
      await recordMistake(type, item.card)
      // Show it again a few items later (max 2 times per session).
      const n = requeued.current.get(item.card) ?? 0
      if (n < 2) {
        requeued.current.set(item.card, n + 1)
        q = [...q]
        q.splice(Math.min(q.length, idx + 4), 0, { ...item })
        setQueue(q)
      }
    }
    advance(q, idx)
  }

  const onTyped = async (item: Item, a: Answer) => {
    if (a.overridden) {
      const list = ((await db.kv.get('overrides'))?.value as unknown[]) ?? []
      await db.kv.put({ key: 'overrides', value: [...list, { card: 'card' in item ? item.card : '', at: Date.now() }] })
    }
    const median = await medianTime(item.type as any)
    handleResult(item, a.correct, autoGrade(a.correct, a.ms, median), a.ms, a.mistake)
  }

  const onSay = (item: Item, g: 'nicht' | 'fast' | 'gewusst') => {
    const grade = g === 'gewusst' ? Rating.Good : g === 'fast' ? Rating.Hard : Rating.Again
    handleResult(item, g !== 'nicht', grade, 0, 'phrase')
  }

  if (!queue) return <p class="muted center">Sitzung wird vorbereitet …</p>

  if (!queue.length) {
    return (
      <div class="ex">
        <p class="prompt">Alles erledigt!</p>
        <p class="muted">Gerade ist nichts fällig und alles Neue in diesem Bereich hast du schon gesehen.</p>
        <a class="btn primary big" href="#/home">
          Zurück
        </a>
      </div>
    )
  }

  const item = queue[idx]
  const testsLeft = queue.length

  return (
    <div class="session">
      <div class="session-top">
        <button class="icon-btn" aria-label="Sitzung beenden" onClick={() => finish(queue.slice(0, idx))}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={testsLeft} aria-valuenow={idx}>
          <div style={{ width: `${(idx / testsLeft) * 100}%` }} />
        </div>
        <span class="count">
          {idx + 1}/{testsLeft}
        </span>
      </div>

      {item.type === 'introVerb' && <IntroVerb verb={item.verb} onDone={handleIntro} />}
      {item.type === 'introPhrase' && <IntroPhrase phrase={item.phrase} onDone={handleIntro} />}
      {(item.type === 'conj' || item.type === 'cloze') && <TypedExercise item={item} onAnswer={(a) => onTyped(item, a)} />}
      {item.type === 'say' && <SayIt item={item} onGrade={(g) => onSay(item, g)} />}
      {item.type === 'listen' && <Listen item={item} onAnswer={(a) => onTyped(item, a)} />}
    </div>
  )
}
