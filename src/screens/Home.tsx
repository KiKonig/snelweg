import { useEffect, useState } from 'preact/hooks'
import { Header, PlayButton, VoiceHelp } from '../components'
import { currentStreak, getStats, type Stats } from '../db'
import { planState, WEEK_FOCUS } from '../plan'
import { href } from '../router'
import { allCards, isLearned } from '../srs'
import { useSettings } from '../settings'
import { useDutchVoice } from '../tts'

const LENGTHS = [10, 20, 30, 45, 60]

export function Home() {
  const { settings } = useSettings()
  const voice = useDutchVoice()
  const [stats, setStats] = useState<Stats | null>(null)
  const [due, setDue] = useState<number | null>(null)
  const [learned, setLearned] = useState(0)
  const [minutes, setMinutes] = useState<number | null>(null)
  useEffect(() => {
    getStats().then(setStats)
    allCards().then((cs) => {
      const now = Date.now()
      setDue(cs.filter((c) => c.due <= now).length)
      setLearned(cs.filter(isLearned).length)
    })
  }, [])
  const len = minutes ?? settings.dailyMinutes
  const plan = planState()

  return (
    <>
      <Header
        title="Snelweg"
        right={
          <a href="#/einstellungen" class="icon-btn" aria-label="Einstellungen">
            <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8" />
              <path
                d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />
            </svg>
          </a>
        }
      />

      <section class="card plan">
        {plan.phase === 'longterm' ? (
          <>
            <p class="eyebrow">Langzeitmodus</p>
            <p>Weiter Richtung fließend.</p>
          </>
        ) : (
          <>
            <p class="eyebrow">
              {plan.phase === 'christmas'
                ? `Woche ${plan.week} von 5 · noch ${plan.daysLeft} ${plan.daysLeft === 1 ? 'Tag' : 'Tage'} bis Weihnachten`
                : 'Vorstart · Fokus wie Woche 1'}
            </p>
            <p>{plan.phase === 'christmas' ? plan.focus : WEEK_FOCUS[0]}</p>
          </>
        )}
      </section>

      <a href={href('sitzung', 'daily', String(len))} class="btn primary big">
        Sitzung starten
        <small>ca. {len} Minuten</small>
      </a>
      <div class="chips" role="group" aria-label="Länge der Sitzung">
        {LENGTHS.map((m) => (
          <button class={`chip ${m === len ? 'active' : ''}`} onClick={() => setMinutes(m)} aria-pressed={m === len}>
            {m} Min.
          </button>
        ))}
      </div>

      <div class="stats">
        <div>
          <strong>{stats ? currentStreak(stats) : '–'}</strong>
          <span>Tage in Folge</span>
        </div>
        <div>
          <strong>{due ?? '–'}</strong>
          <span>fällig</span>
        </div>
        <div>
          <strong>{learned}</strong>
          <span>gelernt</span>
        </div>
      </div>

      <div class="row">
        <a href="#/sprechen" class="btn">
          Sätze üben
        </a>
        <a href={href('bibliothek', 'verben')} class="btn">
          Verben üben
        </a>
      </div>

      <VoiceHelp status={voice.status} />

      {plan.phase !== 'before' && (plan.phase === 'longterm' || plan.week >= 3) ? (
        <section class="card note">
          <p>
            Echte Gespräche zählen am meisten. Sprich mindestens einmal pro Woche mit einem Menschen Niederländisch – zum Beispiel in
            einem Sprachtandem.
          </p>
        </section>
      ) : (
        <section class="card">
          <h3>Hörprobe</h3>
          <div class="phrase">
            <div>
              <p class="nl">Goedemorgen! Hoe gaat het met je?</p>
              <p class="de">Guten Morgen! Wie geht es dir?</p>
            </div>
            <PlayButton text="Goedemorgen! Hoe gaat het met je?" />
          </div>
        </section>
      )}
    </>
  )
}
