import { Header, PlayButton, Placeholder } from '../components'
import sample from '../../content/sample.json'

export function Speak() {
  const groups = new Map<string, typeof sample.phrases>()
  for (const p of sample.phrases) {
    if (!groups.has(p.situation)) groups.set(p.situation, [])
    groups.get(p.situation)!.push(p)
  }

  return (
    <>
      <Header title="Sprechen" />
      <div class="chips">
        <span class="chip active">Sätze</span>
        <span class="chip">Dialoge</span>
        <span class="chip">Meine Antworten</span>
        <span class="chip">Shadowing</span>
      </div>
      {[...groups.entries()].map(([situation, phrases]) => (
        <section class="card">
          <h3>{situation}</h3>
          {phrases.map((p) => (
            <div class="phrase" key={p.id}>
              <div>
                <p class="nl">{p.nl}</p>
                <p class="de">{p.de}</p>
              </div>
              <PlayButton text={p.nl} />
            </div>
          ))}
        </section>
      ))}
      <Placeholder milestone={3}>
        <p>150 Sätze nach Situation, 20 Dialoge mit Rollenspiel, Shadowing mit Aufnahme und deine persönlichen Antworten.</p>
      </Placeholder>
    </>
  )
}
