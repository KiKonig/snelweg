import { useEffect, useState } from 'preact/hooks'
import { Header, PlayButton, VoiceHelp } from '../components'
import { currentStreak, getStats, type Stats } from '../db'
import { planState } from '../plan'
import { useSettings } from '../settings'
import { useDutchVoice } from '../tts'

export function Home() {
  const { settings } = useSettings()
  const voice = useDutchVoice()
  const [stats, setStats] = useState<Stats | null>(null)
  useEffect(() => {
    getStats().then(setStats)
  }, [])
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
        {plan.phase === 'before' && (
          <>
            <p class="eyebrow">Weihnachtsplan</p>
            <p>
              Woche 1 beginnt am Montag, 23. November
              {plan.daysUntilStart === 1 ? ' – morgen.' : ` – in ${plan.daysUntilStart} Tagen.`}
            </p>
          </>
        )}
        {plan.phase === 'christmas' && (
          <>
            <p class="eyebrow">
              Woche {plan.week} von 5 · noch {plan.daysLeft} {plan.daysLeft === 1 ? 'Tag' : 'Tage'} bis Weihnachten
            </p>
            <p>{plan.focus}</p>
          </>
        )}
        {plan.phase === 'longterm' && (
          <>
            <p class="eyebrow">Langzeitmodus</p>
            <p>Weiter Richtung fließend: neue Themen kommen, sobald du bereit bist.</p>
          </>
        )}
      </section>

      <a href="#/sitzung" class="btn primary big">
        Heutige Sitzung starten
        <small>ca. {settings.dailyMinutes} Minuten</small>
      </a>

      <div class="stats">
        <div>
          <strong>{stats ? currentStreak(stats) : '–'}</strong>
          <span>Tage in Folge</span>
        </div>
        <div>
          <strong>0</strong>
          <span>fällig</span>
        </div>
        <div>
          <strong>A0</strong>
          <span>Niveau</span>
        </div>
      </div>

      <div class="row">
        <button class="btn" disabled title="kommt in Meilenstein 10">
          Speed-Runde
        </button>
        <a href="#/sprechen" class="btn">
          Freies Üben
        </a>
      </div>

      <VoiceHelp status={voice.status} />

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

      {plan.phase !== 'before' && (plan.phase === 'longterm' || plan.week >= 3) && (
        <section class="card note">
          <p>
            Echte Gespräche zählen am meisten. Sprich mindestens einmal pro Woche mit einem Menschen Niederländisch –
            zum Beispiel in einem Sprachtandem.
          </p>
        </section>
      )}
    </>
  )
}
