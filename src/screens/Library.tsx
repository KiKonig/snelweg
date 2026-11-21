import { Header } from '../components'

const SECTIONS = [
  { title: 'Lautregeln', desc: 'Zeit → tijd, Apfel → appel, Haus → huis …', m: 6 },
  { title: 'Grammatik', desc: 'Nur was anders ist als im Deutschen', m: 7 },
  { title: 'Falsche Freunde', desc: 'bellen, doof, mogen, zee/meer …', m: 6 },
  { title: 'Aussprache', desc: 'g/ch, sch, ui, ij/ei, eu, uu …', m: 7 },
  { title: 'Verben', desc: 'Konjugation mit allen Personen', m: 2 },
  { title: 'Meine Wörter', desc: 'Suchen, filtern, Beherrschung sehen', m: 4 },
]

export function Library() {
  return (
    <>
      <Header title="Bibliothek" />
      <ul class="list">
        {SECTIONS.map((s) => (
          <li key={s.title}>
            <div>
              <p class="nl">{s.title}</p>
              <p class="de">{s.desc}</p>
            </div>
            <span class="tag small">M{s.m}</span>
          </li>
        ))}
      </ul>
      <p class="muted">Die Inhalte erscheinen nach und nach in den genannten Meilensteinen (M).</p>
    </>
  )
}
