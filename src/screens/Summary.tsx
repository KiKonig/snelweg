import { Header } from '../components'
import { MISTAKE_LABEL } from '../check'
import { href } from '../router'
import type { SessionResult } from './Session'

export function Summary() {
  let r: SessionResult | null = null
  try {
    r = JSON.parse(sessionStorage.getItem('lastSession') ?? 'null')
  } catch {
    r = null
  }
  const pct = r && r.total ? Math.round((r.correct / r.total) * 100) : 0
  const top = r ? Object.entries(r.mistakes ?? {}).sort((a, b) => b[1] - a[1])[0] : undefined

  return (
    <>
      <Header title="Gut gemacht!" />
      {r && r.total > 0 ? (
        <>
          <div class="stats">
            <div>
              <strong>{pct}%</strong>
              <span>richtig</span>
            </div>
            <div>
              <strong>{r.newItems}</strong>
              <span>neu gelernt</span>
            </div>
            <div>
              <strong>{r.minutes}</strong>
              <span>Minuten</span>
            </div>
          </div>
          {top && (
            <section class="card">
              <p class="eyebrow">Häufigster Fehler</p>
              <p>
                {MISTAKE_LABEL[top[0]] ?? top[0]} ({top[1]}×)
              </p>
              <a class="btn" href={href('sitzung', 'fehler')}>
                Fehler jetzt üben
              </a>
            </section>
          )}
        </>
      ) : (
        <p class="muted">Diese Runde war kurz – beim nächsten Mal geht’s weiter, wo du aufgehört hast.</p>
      )}
      <a href={href('sitzung', 'daily', '10')} class="btn big">
        Noch eine Runde (10 Min.)
      </a>
      <a href="#/home" class="btn primary big">
        Fertig
      </a>
    </>
  )
}
