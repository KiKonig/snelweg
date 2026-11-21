import { useMemo, useState } from 'preact/hooks'
import { Header, PlayButton, Placeholder } from '../components'
import sample from '../../content/sample.json'

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()
}

export function Dictionary() {
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const n = norm(q)
    if (!n) return sample.words
    return sample.words.filter((w) => norm(w.dutch).includes(n) || norm(w.german).includes(n))
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
      <ul class="list">
        {results.map((w) => (
          <li key={w.id}>
            <div>
              <p class="nl">
                <span class="article">{w.article}</span> {w.dutch}
              </p>
              <p class="de">{w.german}</p>
            </div>
            <PlayButton text={`${w.article} ${w.dutch}`} />
          </li>
        ))}
        {!results.length && <li class="muted">Kein Treffer.</li>}
      </ul>
      <Placeholder milestone={4}>
        <p>Das volle Wörterbuch (zuerst 3.000, später 8.000 Einträge) mit Konjugation, Beispielen und „Zum Lernen hinzufügen“.</p>
      </Placeholder>
    </>
  )
}
