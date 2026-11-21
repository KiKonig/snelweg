import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { PlayButton } from './components'
import {
  PERSON_DE,
  PERSON_LABEL,
  PERSON_ORDER,
  PERSON_PROMPT,
  acceptedForms,
  clozeAccepted,
  phraseById,
  phrases,
  plainExample,
  splitExample,
  verbById,
  type Verb,
} from './content'
import { classifyConj, isAccepted } from './check'
import type { Item } from './session'
import { speak } from './tts'
import { useSettings } from './settings'

export interface Answer {
  correct: boolean
  ms: number
  mistake?: string
  overridden?: boolean
}

// ---------- intro screens ----------

export function VerbTable({ v }: { v: Verb }) {
  const { settings } = useSettings()
  return (
    <table class="conj">
      <tbody>
        {PERSON_ORDER.map((p) => (
          <tr key={p}>
            <td class="pron">{PERSON_LABEL[p]}</td>
            <td class="form">{v.present[p]}</td>
            <td class="alt">{v.accepted[p]?.length ? `auch: ${v.accepted[p]!.join(', ')}` : PERSON_DE[p]}</td>
            <td>
              <button
                class="icon-btn small"
                aria-label={`Anhören: ${p} ${v.present[p]}`}
                onClick={() => speak(`${PERSON_LABEL[p].split(' ')[0]} ${v.present[p]}`, settings.audioRate)}
              >
                ▶
              </button>
            </td>
          </tr>
        ))}
        <tr class="q">
          <td class="pron">Frage</td>
          <td class="form">{v.present.q_jij} jij?</td>
          <td class="alt">ohne -t!</td>
          <td>
            <button class="icon-btn small" aria-label="Anhören" onClick={() => speak(`${v.present.q_jij} jij?`, settings.audioRate)}>
              ▶
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  )
}

export function IntroVerb({ verb, onDone }: { verb: string; onDone: () => void }) {
  const v = verbById.get(verb)!
  return (
    <div class="ex">
      <p class="tag">Neues Verb</p>
      <h2 class="big-word">
        {v.infinitive} <span class="de">= {v.german}</span>
      </h2>
      {v.irregular && <p class="note-inline">Unregelmäßig – die Formen genau anschauen.</p>}
      <VerbTable v={v} />
      {v.examples.map((e) => (
        <div class="phrase" key={e.nl}>
          <div>
            <p class="nl">{plainExample(e.nl)}</p>
            <p class="de">{e.de}</p>
          </div>
          <PlayButton text={plainExample(e.nl)} />
        </div>
      ))}
      <p class="muted">Lies die Tabelle einmal laut. Gleich wird abgefragt.</p>
      <button class="btn primary big" onClick={onDone}>
        Weiter
      </button>
    </div>
  )
}

export function IntroPhrase({ phrase, onDone }: { phrase: string; onDone: () => void }) {
  const p = phraseById.get(phrase)!
  return (
    <div class="ex">
      <p class="tag">Neuer Satz · {p.situation}</p>
      <p class="prompt">{p.nl}</p>
      <p class="de big-de">{p.de}</p>
      <div class="row-inline">
        <PlayButton text={p.nl} />
        <PlayButton text={p.nl} slow label="Langsam anhören" />
        <span class="muted">Anhören und zweimal laut nachsprechen.</span>
      </div>
      <button class="btn primary big" onClick={onDone}>
        Weiter
      </button>
    </div>
  )
}

// ---------- typed exercises (conjugation + cloze) ----------

interface TypedSpec {
  label: string
  prompt: preact.ComponentChildren
  hint?: string
  accepted: string[]
  audio: string // full Dutch to play after answering
  explain: (answer: string) => [string, string] // [mistakeType, explanation]
}

function specFor(item: Item): TypedSpec | null {
  if (item.type === 'conj') {
    const v = verbById.get(item.verb)!
    const p = item.person
    const form = v.present[p]
    const isQ = p === 'q_jij'
    return {
      label: isQ ? 'Frageform' : 'Konjugieren',
      prompt: isQ ? (
        <>
          <span class="pron-big">___ jij …?</span>
          <span class="verb-big">{v.infinitive}</span>
        </>
      ) : (
        <>
          <span class="pron-big">{PERSON_PROMPT[p]}</span>
          <span class="verb-big">{v.infinitive}</span>
        </>
      ),
      hint: `${v.infinitive} = ${v.german}`,
      accepted: acceptedForms(v, p),
      audio: isQ ? `${form} jij?` : `${PERSON_PROMPT[p].split(' ')[0]} ${form}`,
      explain: (a) => classifyConj(v, p, a),
    }
  }
  if (item.type === 'cloze') {
    const v = verbById.get(item.verb)!
    const ex = v.examples[item.ex]
    const s = splitExample(ex.nl)
    return {
      label: 'Lückensatz',
      prompt: (
        <span class="cloze">
          {s.before}
          <span class="gap">___</span>
          {s.after}
        </span>
      ),
      hint: `${ex.de}  ·  (${v.infinitive})`,
      accepted: clozeAccepted(v, s.answer),
      audio: plainExample(ex.nl),
      explain: () => ['cloze', `Richtig: ${plainExample(ex.nl)}`],
    }
  }
  return null
}

export function TypedExercise({ item, onAnswer }: { item: Item; onAnswer: (a: Answer) => void }) {
  const { settings } = useSettings()
  const spec = useMemo(() => specFor(item), [item])!
  const [value, setValue] = useState('')
  const [result, setResult] = useState<null | { ok: boolean; type?: string; text?: string }>(null)
  const start = useRef(Date.now())
  const input = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setValue('')
    setResult(null)
    start.current = Date.now()
    input.current?.focus()
    return () => clearTimeout(timer.current)
  }, [item])

  const ms = () => Date.now() - start.current

  const check = () => {
    if (result) return next()
    if (!value.trim()) return
    const ok = isAccepted(value, spec.accepted)
    if (ok) {
      setResult({ ok: true })
      if (settings.audioOn) speak(spec.audio, settings.audioRate)
      const t = ms()
      timer.current = window.setTimeout(() => onAnswer({ correct: true, ms: t }), 700)
    } else {
      const [type, text] = spec.explain(value)
      setResult({ ok: false, type, text })
    }
  }

  const next = () => {
    if (!result) return
    clearTimeout(timer.current)
    onAnswer({ correct: result.ok, ms: ms(), mistake: result.type })
  }

  const override = () => {
    onAnswer({ correct: true, ms: ms(), overridden: true })
  }

  return (
    <div class="ex">
      <p class="tag">{spec.label}</p>
      <div class="prompt-box">{spec.prompt}</div>
      {spec.hint && <p class="de">{spec.hint}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          check()
        }}
      >
        <input
          ref={input}
          class={`answer-input ${result ? (result.ok ? 'is-ok' : 'is-bad') : ''}`}
          value={value}
          onInput={(e) => !result && setValue((e.target as HTMLInputElement).value)}
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
          spellcheck={false}
          enterkeyhint={result ? 'next' : 'done'}
          placeholder="Antwort eingeben …"
          aria-label="Antwort"
        />
        {!result && (
          <button class="btn primary big" type="submit">
            Prüfen
          </button>
        )}
      </form>
      {result?.ok && <p class="feedback ok">✓ Richtig{spec.accepted[0] !== value.trim().toLowerCase() ? `: ${spec.accepted[0]}` : ''}</p>}
      {result && !result.ok && (
        <div class="feedback bad">
          <p>
            ✗ Richtig ist: <strong>{spec.accepted[0]}</strong>
            {spec.accepted.length > 1 && <span class="muted"> (auch: {spec.accepted.slice(1).join(', ')})</span>}
          </p>
          <p>{result.text}</p>
          <div class="row-inline">
            <PlayButton text={spec.audio} />
            <button class="btn link" type="button" onClick={override}>
              Meine Antwort war richtig
            </button>
          </div>
          <button class="btn primary big" type="button" onClick={next}>
            Weiter
          </button>
        </div>
      )}
    </div>
  )
}

// ---------- say it (speaking, self-graded) ----------

export function SayIt({ item, onGrade }: { item: Item & { type: 'say' }; onGrade: (g: 'nicht' | 'fast' | 'gewusst') => void }) {
  const p = phraseById.get(item.phrase)!
  const [revealed, setRevealed] = useState(false)
  const { settings } = useSettings()
  useEffect(() => setRevealed(false), [item])
  const reveal = () => {
    setRevealed(true)
    if (settings.audioOn) speak(p.nl, settings.audioRate)
  }
  return (
    <div class="ex">
      <p class="tag">Sag es laut · {p.situation}</p>
      <p class="prompt-label">Sag das laut auf Niederländisch:</p>
      <p class="prompt">{p.de}</p>
      {revealed ? (
        <>
          <div class="answer">
            <p class="nl">{p.nl}</p>
            <PlayButton text={p.nl} />
            <PlayButton text={p.nl} slow label="Langsam anhören" />
          </div>
          <div class="grade">
            <button class="btn bad" onClick={() => onGrade('nicht')}>
              Nicht gewusst
            </button>
            <button class="btn mid" onClick={() => onGrade('fast')}>
              Fast
            </button>
            <button class="btn good" onClick={() => onGrade('gewusst')}>
              Gewusst
            </button>
          </div>
        </>
      ) : (
        <button class="btn primary big" onClick={reveal}>
          Aufdecken und anhören
        </button>
      )}
    </div>
  )
}

// ---------- listening (pick the meaning) ----------

export function Listen({ item, onAnswer }: { item: Item & { type: 'listen' }; onAnswer: (a: Answer) => void }) {
  const p = phraseById.get(item.phrase)!
  const { settings } = useSettings()
  const [chosen, setChosen] = useState<string | null>(null)
  const [played, setPlayed] = useState(false)
  const start = useRef(Date.now())
  const options = useMemo(() => {
    const same = phrases.filter((x) => x.id !== p.id && x.situation === p.situation)
    const other = phrases.filter((x) => x.id !== p.id && x.situation !== p.situation)
    const pool = [...same.sort(() => Math.random() - 0.5), ...other.sort(() => Math.random() - 0.5)]
    const ds: string[] = []
    for (const x of pool) if (!ds.includes(x.de) && x.de !== p.de && ds.length < 3) ds.push(x.de)
    return [...ds, p.de].sort(() => Math.random() - 0.5)
  }, [item])
  useEffect(() => {
    setChosen(null)
    setPlayed(false)
  }, [item])

  const play = (slow = false) => {
    speak(p.nl, slow ? Math.max(0.5, settings.audioRate - 0.3) : settings.audioRate)
    if (!played) {
      setPlayed(true)
      start.current = Date.now()
    }
  }
  const choose = (de: string) => {
    if (chosen) return
    setChosen(de)
    const ok = de === p.de
    const ms = Date.now() - start.current
    if (ok) setTimeout(() => onAnswer({ correct: true, ms }), 700)
  }

  return (
    <div class="ex">
      <p class="tag">Hören</p>
      <p class="prompt-label">Was bedeutet der Satz?</p>
      <div class="row-inline">
        <button class="btn primary" onClick={() => play()}>
          ▶ Anhören
        </button>
        <button class="btn" onClick={() => play(true)}>
          Langsam
        </button>
      </div>
      <div class="options">
        {options.map((o) => (
          <button
            key={o}
            class={`btn option ${chosen ? (o === p.de ? 'is-ok' : o === chosen ? 'is-bad' : '') : ''}`}
            disabled={!played || !!chosen}
            onClick={() => choose(o)}
          >
            {o}
          </button>
        ))}
      </div>
      {!played && <p class="muted">Erst anhören, dann wählen.</p>}
      {chosen && chosen !== p.de && (
        <div class="feedback bad">
          <p>
            Gesagt wurde: <strong>{p.nl}</strong>
          </p>
          <button class="btn primary big" onClick={() => onAnswer({ correct: false, ms: Date.now() - start.current, mistake: 'listening' })}>
            Weiter
          </button>
        </div>
      )}
    </div>
  )
}
