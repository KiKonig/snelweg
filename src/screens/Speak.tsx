import { useState } from 'preact/hooks'
import { Header, PlayButton } from '../components'
import { phrases, situations } from '../content'
import { href } from '../router'
import { SpeakCheck } from '../SpeakCheck'
import { recognitionSupported } from '../speech'
import { recordingSupported } from '../recorder'

const micAvailable = recognitionSupported || recordingSupported

export function Speak({ params }: { params: string[] }) {
  const open = params[0]
  const [mic, setMic] = useState<string | null>(null)
  return (
    <>
      <Header title="Sprechen" />
      <p class="muted">
        Tippe eine Situation an. „Diese Sätze üben“ startet eine kurze Runde.
        {micAvailable && ' Mit 🎤 prüfst du die Aussprache einzelner Sätze.'}
      </p>
      {situations.map((s) => {
        const ps = phrases.filter((p) => p.situation === s)
        return (
          <details class="card" key={s} open={open === s}>
            <summary>
              <strong>{s}</strong> <span class="muted">· {ps.length} Sätze</span>
            </summary>
            <a class="btn primary" href={href('sitzung', 'situation', s)}>
              Diese Sätze üben
            </a>
            {ps.map((p) => (
              <div key={p.id}>
                <div class="phrase">
                  <div>
                    <p class="nl">{p.nl}</p>
                    <p class="de">{p.de}</p>
                  </div>
                  <div class="row-inline nowrap">
                    {micAvailable && (
                      <button
                        class={`icon-btn play ${mic === p.id ? 'on' : ''}`}
                        aria-label={`Aussprache üben: ${p.nl}`}
                        aria-expanded={mic === p.id}
                        onClick={() => setMic(mic === p.id ? null : p.id)}
                      >
                        🎤
                      </button>
                    )}
                    <PlayButton text={p.nl} />
                  </div>
                </div>
                {mic === p.id && <SpeakCheck text={p.nl} />}
              </div>
            ))}
          </details>
        )
      })}
    </>
  )
}
