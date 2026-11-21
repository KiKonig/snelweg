import { useState } from 'preact/hooks'
import { PlayButton } from '../components'
import { recordSession } from '../db'
import { go } from '../router'
import sample from '../../content/sample.json'

// Placeholder session for milestone 1: a few "Say it" style cards.
// The real session builder arrives in milestone 2.

type Grade = 'gewusst' | 'fast' | 'nicht'

export interface SessionResult {
  total: number
  known: number
  almost: number
  missed: number
}

export function Session() {
  const items = sample.phrases.slice(0, 5)
  const [i, setI] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [grades, setGrades] = useState<Grade[]>([])
  const item = items[i]

  const grade = async (g: Grade) => {
    const next = [...grades, g]
    setGrades(next)
    setRevealed(false)
    if (i + 1 < items.length) {
      setI(i + 1)
    } else {
      const result: SessionResult = {
        total: next.length,
        known: next.filter((x) => x === 'gewusst').length,
        almost: next.filter((x) => x === 'fast').length,
        missed: next.filter((x) => x === 'nicht').length,
      }
      sessionStorage.setItem('lastSession', JSON.stringify(result))
      await recordSession(next.length)
      go('zusammenfassung')
    }
  }

  return (
    <div class="session">
      <div class="session-top">
        <button class="icon-btn" aria-label="Sitzung beenden" onClick={() => go('home')}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </button>
        <div class="progress" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={i}>
          <div style={{ width: `${(i / items.length) * 100}%` }} />
        </div>
        <span class="count">
          {i + 1}/{items.length}
        </span>
      </div>

      <p class="tag">Platzhalter-Übung · „Sag es“</p>
      <p class="prompt-label">Sag es laut auf Niederländisch:</p>
      <p class="prompt">{item.de}</p>

      {revealed ? (
        <>
          <div class="answer">
            <p class="nl">{item.nl}</p>
            <PlayButton text={item.nl} />
            <PlayButton text={item.nl} slow label="Langsam anhören" />
          </div>
          <div class="grade">
            <button class="btn bad" onClick={() => grade('nicht')}>
              Nicht gewusst
            </button>
            <button class="btn mid" onClick={() => grade('fast')}>
              Fast
            </button>
            <button class="btn good" onClick={() => grade('gewusst')}>
              Gewusst
            </button>
          </div>
        </>
      ) : (
        <button class="btn primary big" onClick={() => setRevealed(true)}>
          Aufdecken
        </button>
      )}
    </div>
  )
}
