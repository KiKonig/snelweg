// Spaced repetition with FSRS (ts-fsrs). Every learnable thing is a card
// stored on the device. Answers are graded automatically by correctness and speed.
import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from 'ts-fsrs'
import { db } from './db'

export type CardKind = 'conj' | 'cloze' | 'say' | 'listen'

export interface CardRow {
  id: string // e.g. "conj:gaan:jij", "say:gr-hallo"
  kind: CardKind
  due: number // ms timestamp (indexed)
  fsrs: Card
  streak: number // correct answers in a row
  seen: number
  correct: number
  lastSeen: number
}

const scheduler = fsrs(generatorParameters({ enable_fuzz: true, enable_short_term: true }))

export { Rating }

function revive(c: Card): Card {
  // After a JSON import dates are strings again.
  return {
    ...c,
    due: new Date(c.due),
    last_review: c.last_review ? new Date(c.last_review) : undefined,
  }
}

export async function allCards(): Promise<CardRow[]> {
  return (await db.cards.toArray()).map((r) => ({ ...r, fsrs: revive(r.fsrs) }))
}

export async function getCard(id: string): Promise<CardRow | undefined> {
  const r = await db.cards.get(id)
  return r ? { ...r, fsrs: revive(r.fsrs) } : undefined
}

export function kindOf(id: string): CardKind {
  return id.split(':')[0] as CardKind
}

/** Record an answer. Returns the updated row. */
export async function review(id: string, grade: Grade): Promise<CardRow> {
  const now = new Date()
  const row: CardRow = (await getCard(id)) ?? {
    id,
    kind: kindOf(id),
    due: now.getTime(),
    fsrs: createEmptyCard(now),
    streak: 0,
    seen: 0,
    correct: 0,
    lastSeen: 0,
  }
  const ok = grade !== Rating.Again
  row.streak = ok ? row.streak + 1 : 0
  // No grinding: 3 correct in a row → treat as easy.
  const g = ok && row.streak >= 3 ? Rating.Easy : grade
  const next = scheduler.next(row.fsrs, now, g as Grade).card
  row.fsrs = next
  row.due = next.due.getTime()
  row.seen += 1
  if (ok) row.correct += 1
  row.lastSeen = now.getTime()
  await db.cards.put(row)
  return row
}

export function isMastered(r: CardRow): boolean {
  return r.fsrs.state === State.Review && r.fsrs.scheduled_days >= 7
}

export function isLearned(r: CardRow): boolean {
  return r.fsrs.state === State.Review
}

// ---------- speed tracking: "fast" = under the median for that exercise type ----------

const DEFAULT_MS: Record<CardKind, number> = { conj: 5000, cloze: 7000, say: 8000, listen: 8000 }

export async function recordTime(kind: CardKind, ms: number): Promise<void> {
  const key = `times:${kind}`
  const row = await db.kv.get(key)
  const arr = ((row?.value as number[]) ?? []).concat(ms).slice(-40)
  await db.kv.put({ key, value: arr })
}

export async function medianTime(kind: CardKind): Promise<number> {
  const row = await db.kv.get(`times:${kind}`)
  const arr = [...((row?.value as number[]) ?? [])].sort((a, b) => a - b)
  if (arr.length < 5) return DEFAULT_MS[kind]
  return arr[Math.floor(arr.length / 2)]
}

/** correct + fast = Easy, correct = Good, almost = Hard, wrong = Again */
export function autoGrade(correct: boolean, ms: number, median: number, almost = false): Grade {
  if (!correct) return almost ? Rating.Hard : Rating.Again
  return ms < median ? Rating.Easy : Rating.Good
}

// ---------- mistake memory ----------

export async function recordMistake(type: string, cardId: string): Promise<void> {
  const counts = ((await db.kv.get('mistakes'))?.value as Record<string, number>) ?? {}
  counts[type] = (counts[type] ?? 0) + 1
  await db.kv.put({ key: 'mistakes', value: counts })
  const recent = ((await db.kv.get('recentWrong'))?.value as string[]) ?? []
  const next = [cardId, ...recent.filter((x) => x !== cardId)].slice(0, 30)
  await db.kv.put({ key: 'recentWrong', value: next })
}

export async function recentWrong(): Promise<string[]> {
  return ((await db.kv.get('recentWrong'))?.value as string[]) ?? []
}
