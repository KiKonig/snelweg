// Session builder: ~70% due reviews + ~30% new material, speaking in every session.
import {
  CONJ_GROUPS,
  phrases,
  verbById,
  verbs,
  type Person,
} from './content'
import { allCards, recentWrong, type CardRow } from './srs'

export type Item =
  | { type: 'introVerb'; verb: string }
  | { type: 'introPhrase'; phrase: string }
  | { type: 'conj'; card: string; verb: string; person: Person }
  | { type: 'cloze'; card: string; verb: string; ex: number }
  | { type: 'say'; card: string; phrase: string }
  | { type: 'listen'; card: string; phrase: string }

export type Mode =
  | { kind: 'daily'; minutes: number }
  | { kind: 'verb'; verb: string }
  | { kind: 'situation'; situation: string }
  | { kind: 'mistakes' }

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

function shuffle<T>(a: T[]): T[] {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

/** Turn a card id into a concrete exercise. */
export function itemForCard(id: string): Item | null {
  const [kind, a, b] = id.split(':')
  if (kind === 'conj' && verbById.has(a) && CONJ_GROUPS[b]) {
    return { type: 'conj', card: id, verb: a, person: pick(CONJ_GROUPS[b]) }
  }
  if (kind === 'cloze' && verbById.has(a)) return { type: 'cloze', card: id, verb: a, ex: Number(b) }
  if (kind === 'say' && phrases.some((p) => p.id === a)) return { type: 'say', card: id, phrase: a }
  if (kind === 'listen' && phrases.some((p) => p.id === a)) return { type: 'listen', card: id, phrase: a }
  return null
}

function verbUnit(verbId: string, withIntro: boolean): { intro: Item[]; tests: Item[] } {
  const v = verbById.get(verbId)!
  const conj = Object.keys(CONJ_GROUPS).map((g) => itemForCard(`conj:${verbId}:${g}`)!)
  const cloze = v.examples.map((_, i) => itemForCard(`cloze:${verbId}:${i}`)!)
  return {
    intro: withIntro ? [{ type: 'introVerb', verb: verbId }] : [],
    tests: [...shuffle(conj), ...cloze],
  }
}

function phraseUnit(id: string, withIntro: boolean): { intro: Item[]; tests: Item[] } {
  return {
    intro: withIntro ? [{ type: 'introPhrase', phrase: id }] : [],
    tests: [itemForCard(`say:${id}`)!, itemForCard(`listen:${id}`)!],
  }
}

/** Interleave units so each unit's tests come a little after its intro. */
function weave(units: { intro: Item[]; tests: Item[] }[], reviews: Item[]): Item[] {
  const out: Item[] = []
  const rev = [...reviews]
  let pending: Item[] = []
  for (const u of units) {
    out.push(...u.intro)
    out.push(...rev.splice(0, 2))
    out.push(...pending)
    pending = u.tests
  }
  out.push(...rev.splice(0, 3))
  out.push(...pending)
  out.push(...rev)
  return out
}

export async function buildSession(mode: Mode): Promise<Item[]> {
  const cards = await allCards()
  const byId = new Map(cards.map((c) => [c.id, c]))
  const known = (id: string) => byId.has(id)

  if (mode.kind === 'verb') {
    const seen = known(`conj:${mode.verb}:ik`)
    return weave([verbUnit(mode.verb, !seen)], [])
  }

  if (mode.kind === 'situation') {
    const ps = phrases.filter((p) => p.situation === mode.situation)
    return weave(
      ps.map((p) => phraseUnit(p.id, !known(`say:${p.id}`))),
      [],
    )
  }

  if (mode.kind === 'mistakes') {
    const ids = await recentWrong()
    return shuffle(ids.map(itemForCard).filter((x): x is Item => !!x))
  }

  // ---- daily session ----
  const target = Math.max(12, Math.round(mode.minutes * 2))
  const now = Date.now()
  const due = cards.filter((c) => c.due <= now).sort((a, b) => a.due - b.due)
  const reviewCap = Math.ceil(target * 0.7)
  const reviews = shuffle(
    due
      .slice(0, reviewCap)
      .map((c: CardRow) => itemForCard(c.id))
      .filter((x): x is Item => !!x),
  )

  let budget = target - reviews.length
  // When there is little to review, use the freed time for new material.
  const newVerbs = verbs.filter((v) => !known(`conj:${v.id}:ik`))
  const newPhrases = phrases.filter((p) => !known(`say:${p.id}`))
  const units: { intro: Item[]; tests: Item[] }[] = []
  let vi = 0
  let pi = 0
  let turn = 0
  while (budget > 0 && (vi < newVerbs.length || pi < newPhrases.length)) {
    // Pattern: phrase, phrase, verb, … (speaking first, verbs as backbone)
    const wantVerb = turn % 3 === 2
    if ((wantVerb && vi < newVerbs.length) || pi >= newPhrases.length) {
      const u = verbUnit(newVerbs[vi++].id, true)
      units.push(u)
      budget -= u.tests.length + 1
    } else {
      const u = phraseUnit(newPhrases[pi++].id, true)
      units.push(u)
      budget -= 3
    }
    turn++
  }

  return weave(units, reviews)
}

export function modeFromParams(params: string[]): Mode {
  const [kind, arg] = params
  if (kind === 'verb' && arg) return { kind: 'verb', verb: arg }
  if (kind === 'situation' && arg) return { kind: 'situation', situation: arg }
  if (kind === 'fehler') return { kind: 'mistakes' }
  return { kind: 'daily', minutes: Number(arg) || 0 }
}
