import { useEffect, useState } from 'preact/hooks'
import { Header, Placeholder } from '../components'
import { currentStreak, getStats, type Stats } from '../db'
import { planState } from '../plan'

const SKILLS = ['Wortschatz', 'Verben', 'Satzbau', 'Hören', 'Rechtschreibung', 'Sprechen']

export function Progress() {
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => {
    getStats().then(setStats)
  }, [])
  const plan = planState()

  return (
    <>
      <Header title="Fortschritt" />
      <section class="card plan">
        {plan.phase === 'christmas' ? (
          <>
            <p class="eyebrow">Weihnachtsziel</p>
            <p>
              Noch <strong>{plan.daysLeft}</strong> {plan.daysLeft === 1 ? 'Tag' : 'Tage'} · Woche {plan.week} von 5
            </p>
          </>
        ) : plan.phase === 'before' ? (
          <>
            <p class="eyebrow">Weihnachtsziel</p>
            <p>Der Plan startet am Montag, 23. November.</p>
          </>
        ) : (
          <>
            <p class="eyebrow">Langzeitmodus</p>
            <p>Fortschritt Richtung nächstes Niveau pro Fertigkeit.</p>
          </>
        )}
      </section>

      <div class="stats">
        <div>
          <strong>{stats?.sessionsDone ?? 0}</strong>
          <span>Sitzungen</span>
        </div>
        <div>
          <strong>{stats ? currentStreak(stats) : 0}</strong>
          <span>Tage in Folge</span>
        </div>
        <div>
          <strong>{stats?.itemsSeen ?? 0}</strong>
          <span>Übungen</span>
        </div>
      </div>

      <section class="card">
        <h3>Fertigkeiten</h3>
        {SKILLS.map((s) => (
          <div class="skill" key={s}>
            <span>{s}</span>
            <div class="bar">
              <div style={{ width: '0%' }} />
            </div>
            <span class="muted">0%</span>
          </div>
        ))}
      </section>

      <Placeholder milestone={10}>
        <p>Diagramme: Genauigkeit der letzten 30 Tage, Fehlertypen, Minuten pro Tag, „im Plan“-Anzeige.</p>
      </Placeholder>
    </>
  )
}
