import { useEffect, useState } from 'preact/hooks'
import { Header, PlayButton } from '../components'
import { falseFriends, grammar, plainExample, rules, sounds, verbById, verbs } from '../content'
import { VerbTable } from '../exercises'
import { href } from '../router'
import { allCards, isMastered, type CardRow } from '../srs'

const SECTIONS = [
  { key: 'verben', title: 'Verben', desc: `${verbs.length} Verben mit allen Personen` },
  { key: 'grammatik', title: 'Grammatik', desc: 'Nur was anders ist als im Deutschen' },
  { key: 'aussprache', title: 'Aussprache', desc: 'g/ch, sch, ui, ij/ei, eu, uu …' },
  { key: 'regeln', title: 'Lautregeln', desc: 'Zeit → tijd, Apfel → appel, Haus → huis …' },
  { key: 'freunde', title: 'Falsche Freunde', desc: 'bellen, doof, mogen, zee/meer …' },
]

function Back({ to = href('bibliothek') }: { to?: string }) {
  return (
    <a class="back" href={to}>
      ‹ Zurück
    </a>
  )
}

function useCards() {
  const [cards, setCards] = useState<CardRow[]>([])
  useEffect(() => {
    allCards().then(setCards)
  }, [])
  return cards
}

function VerbList() {
  const cards = useCards()
  const mastery = (id: string) => {
    const cs = cards.filter((c) => c.id.startsWith(`conj:${id}:`))
    if (!cs.length) return null
    return Math.round((cs.filter(isMastered).length / 6) * 100)
  }
  return (
    <>
      <Back />
      <Header title="Verben" />
      <p class="muted">Tippe ein Verb an für die Tabelle. Neue Verben kommen auch automatisch in deine Sitzung.</p>
      <ul class="list">
        {verbs.map((v) => {
          const m = mastery(v.id)
          return (
            <li key={v.id}>
              <a class="row-link" href={href('bibliothek', 'verb', v.id)}>
                <div>
                  <p class="nl">
                    {v.infinitive} {v.irregular && <span class="tag small">unregelmäßig</span>}
                  </p>
                  <p class="de">{v.german}</p>
                </div>
                <span class="muted">{m === null ? 'neu' : `${m}%`}</span>
              </a>
            </li>
          )
        })}
      </ul>
    </>
  )
}

function VerbDetail({ id }: { id: string }) {
  const v = verbById.get(id)
  if (!v) return <VerbList />
  return (
    <>
      <Back to={href('bibliothek', 'verben')} />
      <Header title={v.infinitive} />
      <p class="de big-de">{v.german}</p>
      <a class="btn primary big" href={href('sitzung', 'verb', v.id)}>
        Dieses Verb üben
      </a>
      <section class="card">
        <h3>Präsens</h3>
        <VerbTable v={v} />
      </section>
      <section class="card">
        <h3>Vergangenheit</h3>
        <p>
          Präteritum: <strong>{v.past.sg}</strong> (Plural: {v.past.pl})
        </p>
        {v.participle && (
          <p>
            Perfekt: <strong>{v.aux === 'zijn' ? 'ik ben' : v.aux === 'hebben' ? 'ik heb' : 'ik heb/ben'} {v.participle}</strong>
          </p>
        )}
      </section>
      <section class="card">
        <h3>Beispiele</h3>
        {v.examples.map((e) => (
          <div class="phrase" key={e.nl}>
            <div>
              <p class="nl">{plainExample(e.nl)}</p>
              <p class="de">{e.de}</p>
            </div>
            <PlayButton text={plainExample(e.nl)} />
          </div>
        ))}
      </section>
    </>
  )
}

function GrammarList({ open }: { open?: string }) {
  return (
    <>
      <Back />
      <Header title="Grammatik" />
      {grammar.map((g) => (
        <details class="card" key={g.id} open={open === g.id}>
          <summary>
            <strong>{g.title}</strong>
          </summary>
          <p class="explain">{g.explanation}</p>
          {g.examples.map((e) => (
            <div class="phrase" key={e.nl}>
              <div>
                <p class="nl">{e.nl}</p>
                <p class="de">{e.de}</p>
              </div>
              <PlayButton text={e.nl} />
            </div>
          ))}
        </details>
      ))}
    </>
  )
}

function SoundList() {
  return (
    <>
      <Back />
      <Header title="Aussprache" />
      {sounds.map((s) => (
        <section class="card" key={s.id}>
          <h3>{s.spelling}</h3>
          <p class="explain">{s.german}</p>
          <div class="word-chips">
            {s.examples.map((w) => (
              <span class="word-chip" key={w}>
                {w} <PlayButton text={w} />
              </span>
            ))}
          </div>
        </section>
      ))}
    </>
  )
}

function RuleList() {
  return (
    <>
      <Back />
      <Header title="Lautregeln" />
      <p class="muted">Mit diesen Mustern kannst du viele niederländische Wörter aus dem Deutschen ableiten.</p>
      {rules.map((r) => (
        <section class="card" key={r.id}>
          <h3>{r.name}</h3>
          <p class="explain">{r.explanation}</p>
          {r.pairs.map(([de, nl]) => (
            <div class="phrase" key={nl}>
              <p>
                <span class="de">{de}</span> → <span class="nl">{nl}</span>
              </p>
              <PlayButton text={nl} />
            </div>
          ))}
        </section>
      ))}
    </>
  )
}

function FriendList() {
  return (
    <>
      <Back />
      <Header title="Falsche Freunde" />
      {falseFriends.map((f) => (
        <section class="card" key={f.id}>
          <h3>{f.dutch}</h3>
          <p>
            = <strong>{f.means}</strong>
          </p>
          <p class="muted">
            Nicht verwechseln mit „{f.looksLike}“ → auf Niederländisch: {f.thatIs}
          </p>
          <div class="phrase">
            <div>
              <p class="nl">{f.example.nl}</p>
              <p class="de">{f.example.de}</p>
            </div>
            <PlayButton text={f.example.nl} />
          </div>
        </section>
      ))}
    </>
  )
}

export function Library({ params }: { params: string[] }) {
  const [section, arg] = params
  if (section === 'verben') return <VerbList />
  if (section === 'verb' && arg) return <VerbDetail id={arg} />
  if (section === 'grammatik') return <GrammarList open={arg} />
  if (section === 'aussprache') return <SoundList />
  if (section === 'regeln') return <RuleList />
  if (section === 'freunde') return <FriendList />
  return (
    <>
      <Header title="Bibliothek" />
      <ul class="list">
        {SECTIONS.map((s) => (
          <li key={s.key}>
            <a class="row-link" href={href('bibliothek', s.key)}>
              <div>
                <p class="nl">{s.title}</p>
                <p class="de">{s.desc}</p>
              </div>
              <span class="chev">›</span>
            </a>
          </li>
        ))}
      </ul>
    </>
  )
}
