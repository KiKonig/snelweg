import { Header, PlayButton } from '../components'
import { phrases, situations } from '../content'
import { href } from '../router'

export function Speak({ params }: { params: string[] }) {
  const open = params[0]
  return (
    <>
      <Header title="Sprechen" />
      <p class="muted">Tippe eine Situation an. „Üben“ startet eine kurze Runde nur mit diesen Sätzen.</p>
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
              <div class="phrase" key={p.id}>
                <div>
                  <p class="nl">{p.nl}</p>
                  <p class="de">{p.de}</p>
                </div>
                <PlayButton text={p.nl} />
              </div>
            ))}
          </details>
        )
      })}
    </>
  )
}
