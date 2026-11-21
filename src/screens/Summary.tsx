import { Header, Placeholder } from '../components'
import type { SessionResult } from './Session'

export function Summary() {
  let r: SessionResult | null = null
  try {
    r = JSON.parse(sessionStorage.getItem('lastSession') ?? 'null')
  } catch {
    r = null
  }
  const pct = r && r.total ? Math.round(((r.known + r.almost * 0.5) / r.total) * 100) : 0

  return (
    <>
      <Header title="Zusammenfassung" />
      {r ? (
        <>
          <div class="stats">
            <div>
              <strong>{pct}%</strong>
              <span>Genauigkeit</span>
            </div>
            <div>
              <strong>{r.known}</strong>
              <span>gewusst</span>
            </div>
            <div>
              <strong>{r.missed}</strong>
              <span>nicht gewusst</span>
            </div>
          </div>
          <Placeholder milestone={5}>
            <p>Hier erscheinen neu gelernte Einträge und dein häufigster Fehlertyp – mit einem Knopf, um ihn sofort zu üben.</p>
          </Placeholder>
        </>
      ) : (
        <p class="muted">Noch keine Sitzung abgeschlossen.</p>
      )}
      <a href="#/home" class="btn primary big">
        Fertig
      </a>
    </>
  )
}
