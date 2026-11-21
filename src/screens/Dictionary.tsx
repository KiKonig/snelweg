import { useMemo, useState } from 'preact/hooks'
import { Header, PlayButton } from '../components'
import { falseFriends, phrases, plainExample, verbs, words } from '../content'
import { href } from '../router'

interface Entry {
  key: string
  nl: string
  de: string
  tag?: string
  link?: string
}

const ENTRIES: Entry[] = [
  ...verbs.map((v) => ({ key: `v-${v.id}`, nl: v.infinitive, de: v.german, tag: 'Verb', link: href('bibliothek', 'verb', v.id) })),
  ...words.map((w) => ({ key: `w-${w.id}`, nl: `${w.article} ${w.dutch}`, de: w.german })),
  ...falseFriends.map((f) => ({ key: `f-${f.id}`, nl: f.dutch, de: f.means, tag: 'Falscher Freund', link: href('bibliothek', 'freunde') })),
  ...phrases.map((p) => ({ key: `p-${p.id}`, nl: p.nl, de: p.de, tag: 'Satz' })),
  ...verbs.flatMap((v) => v.examples.map((e, i) => ({ key: `e-${v.id}-${i}`, nl: plainExample(e.nl), de: e.de, tag: 'Beispiel' }))),
]

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function Dictionary() {
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const n = norm(q)
    if (!n) return []
    const starts: Entry[] = []
    const contains: Entry[] = []
    for (const e of ENTRIES) {
      const a = norm(e.nl)
      const b = norm(e.de)
      if (a.startsWith(n) || b.startsWith(n)) starts.push(e)
      else if (a.includes(n) || b.includes(n)) contains.push(e)
    }
    return [...starts, ...contains].slice(0, 60)
  }, [q])

  return (
    <>
      <Header title="Wörterbuch" />
      <input
        class="search"
        type="search"
        inputMode="search"
        autocomplete="off"
        autocapitalize="off"
        spellcheck={false}
        placeholder="Niederländisch oder Deutsch suchen …"
        value={q}
        onInput={(e) => setQ((e.target as HTMLInputElement).value)}
        aria-label="Wörterbuch durchsuchen"
      />
      {!q && <p class="muted">Durchsucht Verben, Sätze, Beispiele und falsche Freunde – in beide Richtungen, offline.</p>}
      {q && (
        <ul class="list">
          {results.map((e) => (
            <li key={e.key}>
              <a class="row-link" href={e.link ?? undefined}>
                <div>
                  <p class="nl">
                    {e.nl} {e.tag && <span class="tag small">{e.tag}</span>}
                  </p>
                  <p class="de">{e.de}</p>
                </div>
              </a>
              <PlayButton text={e.nl} />
            </li>
          ))}
          {!results.length && <li class="muted">Kein Treffer.</li>}
        </ul>
      )}
    </>
  )
}
