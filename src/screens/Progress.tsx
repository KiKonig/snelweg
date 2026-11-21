import { useEffect, useState } from 'preact/hooks'
import { Header } from '../components'
import { MISTAKE_LABEL } from '../check'
import { currentStreak, db, getStats, minutesByDay, type Stats } from '../db'
import { phrases, verbs } from '../content'
import { planState } from '../plan'
import { allCards, isLearned, isMastered, type CardRow } from '../srs'

function Bar({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div class="skill">
      <span>{label}</span>
      <div class="bar">
        <div style={{ width: `${Math.min(100, value)}%` }} />
      </div>
      <span class="muted">{detail}</span>
    </div>
  )
}

export function Progress() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [cards, setCards] = useState<CardRow[]>([])
  const [mins, setMins] = useState<Record<string, number>>({})
  const [mistakes, setMistakes] = useState<Record<string, number>>({})
  useEffect(() => {
    getStats().then(setStats)
    allCards().then(setCards)
    minutesByDay().then(setMins)
    db.kv.get('mistakes').then((r) => setMistakes((r?.value as Record<string, number>) ?? {}))
  }, [])
  const plan = planState()

  const of = (kind: string) => cards.filter((c) => c.kind === kind)
  const conj = of('conj')
  const say = of('say')
  const listen = of('listen')
  const cloze = of('cloze')
  const verbsTotal = verbs.length * 6
  const pct = (cs: CardRow[], total: number) => (total ? (cs.filter(isLearned).length / total) * 100 : 0)

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86_400_000)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    return { day: d.toLocaleDateString('de-DE', { weekday: 'short' }), min: mins[key] ?? 0 }
  })
  const maxMin = Math.max(10, ...last7.map((d) => d.min))
  const topMistakes = Object.entries(mistakes).sort((a, b) => b[1] - a[1]).slice(0, 4)

  return (
    <>
      <Header title="Fortschritt" />
      <section class="card plan">
        {plan.phase === 'longterm' ? (
          <>
            <p class="eyebrow">Langzeitmodus</p>
            <p>Weiter Richtung fließend.</p>
          </>
        ) : (
          <>
            <p class="eyebrow">Weihnachtsziel</p>
            <p>
              {plan.phase === 'christmas'
                ? `Noch ${plan.daysLeft} Tage · Woche ${plan.week} von 5`
                : 'Plan startet Montag, 23. November – du lernst schon vorher.'}
            </p>
          </>
        )}
      </section>

      <div class="stats">
        <div>
          <strong>{stats ? currentStreak(stats) : 0}</strong>
          <span>Tage in Folge</span>
        </div>
        <div>
          <strong>{cards.filter(isLearned).length}</strong>
          <span>gelernt</span>
        </div>
        <div>
          <strong>{cards.filter(isMastered).length}</strong>
          <span>sicher (7+ Tage)</span>
        </div>
      </div>

      <section class="card">
        <h3>Fertigkeiten</h3>
        <Bar label="Verben" value={pct(conj, verbsTotal)} detail={`${conj.filter(isLearned).length}/${verbsTotal}`} />
        <Bar label="Satzbau" value={pct(cloze, verbs.length * 2)} detail={`${cloze.filter(isLearned).length}/${verbs.length * 2}`} />
        <Bar label="Sprechen" value={pct(say, phrases.length)} detail={`${say.filter(isLearned).length}/${phrases.length}`} />
        <Bar label="Hören" value={pct(listen, phrases.length)} detail={`${listen.filter(isLearned).length}/${phrases.length}`} />
      </section>

      <section class="card">
        <h3>Minuten pro Tag</h3>
        <div class="minutes">
          {last7.map((d) => (
            <div class="mcol" key={d.day}>
              <div class="mbar" style={{ height: `${(d.min / maxMin) * 100}%` }} title={`${d.min} Min.`} />
              <span>{d.day}</span>
            </div>
          ))}
        </div>
      </section>

      {topMistakes.length > 0 && (
        <section class="card">
          <h3>Häufigste Fehler</h3>
          {topMistakes.map(([k, n]) => (
            <p key={k}>
              {MISTAKE_LABEL[k] ?? k}: <strong>{n}×</strong>
            </p>
          ))}
        </section>
      )}
    </>
  )
}
