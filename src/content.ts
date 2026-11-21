// Typed access to the learning content in /content (bundled, works offline).
import verbsRaw from '../content/verbs.json'
import phrasesRaw from '../content/phrases.json'
import grammarRaw from '../content/grammar.json'
import soundsRaw from '../content/sounds.json'
import rulesRaw from '../content/rules.json'
import ffRaw from '../content/false_friends.json'
import sample from '../content/sample.json'

export type Person = 'ik' | 'jij' | 'u' | 'hij' | 'zij_sg' | 'het' | 'wij' | 'jullie' | 'zij_pl' | 'q_jij'

export interface Verb {
  id: string
  rank: number
  infinitive: string
  german: string
  irregular: boolean
  present: Record<Person, string>
  accepted: Partial<Record<Person, string[]>>
  past: { sg: string; pl: string }
  participle: string | null
  aux: string
  separable: boolean
  examples: { nl: string; de: string }[]
}

export interface Phrase {
  id: string
  situation: string
  week: number
  nl: string
  de: string
}

export interface GrammarTopic {
  id: string
  title: string
  explanation: string
  examples: { nl: string; de: string }[]
}

export interface Sound {
  id: string
  spelling: string
  german: string
  examples: string[]
}

export interface Rule {
  id: string
  name: string
  explanation: string
  reliability: string
  pairs: [string, string][]
}

export interface FalseFriend {
  id: string
  dutch: string
  means: string
  looksLike: string
  thatIs: string
  example: { nl: string; de: string }
}

export const verbs = verbsRaw as Verb[]
export const phrases = phrasesRaw as Phrase[]
export const grammar = grammarRaw as GrammarTopic[]
export const sounds = soundsRaw as Sound[]
export const rules = rulesRaw as Rule[]
export const falseFriends = ffRaw as FalseFriend[]
export const words = sample.words

export const verbById = new Map(verbs.map((v) => [v.id, v]))
export const phraseById = new Map(phrases.map((p) => [p.id, p]))

export const situations = [...new Set(phrases.map((p) => p.situation))]

export const PERSON_ORDER: Person[] = ['ik', 'jij', 'u', 'hij', 'zij_sg', 'het', 'wij', 'jullie', 'zij_pl']

export const PERSON_LABEL: Record<Person, string> = {
  ik: 'ik',
  jij: 'jij / je',
  u: 'u',
  hij: 'hij',
  zij_sg: 'zij / ze',
  het: 'het',
  wij: 'wij / we',
  jullie: 'jullie',
  zij_pl: 'zij / ze',
  q_jij: '… jij?',
}

export const PERSON_DE: Record<Person, string> = {
  ik: 'ich',
  jij: 'du',
  u: 'Sie (höflich)',
  hij: 'er',
  zij_sg: 'sie (Singular)',
  het: 'es',
  wij: 'wir',
  jullie: 'ihr',
  zij_pl: 'sie (Plural)',
  q_jij: 'Frage mit du',
}

/** The pronoun to show in a drill prompt. */
export const PERSON_PROMPT: Record<Person, string> = {
  ik: 'ik',
  jij: 'jij',
  u: 'u',
  hij: 'hij',
  zij_sg: 'zij (sie, Sg.)',
  het: 'het',
  wij: 'wij',
  jullie: 'jullie',
  zij_pl: 'zij (sie, Pl.)',
  q_jij: 'Frage: ___ jij …?',
}

/** Drill groups: one SRS card per group, the shown pronoun varies within it. */
export const CONJ_GROUPS: Record<string, Person[]> = {
  ik: ['ik'],
  jij: ['jij'],
  u: ['u'],
  hij: ['hij', 'zij_sg', 'het'],
  wij: ['wij', 'jullie', 'zij_pl'],
  q: ['q_jij'],
}

export function acceptedForms(v: Verb, p: Person): string[] {
  return [v.present[p], ...(v.accepted[p] ?? [])]
}

/** Example sentence with the verb form hidden: "Wij [gaan] …" → parts. */
export function splitExample(nl: string): { before: string; answer: string; after: string } {
  const m = nl.match(/^(.*)\[([^\]]+)\](.*)$/)!
  return { before: m[1], answer: m[2], after: m[3] }
}

export const plainExample = (nl: string) => nl.replace(/[[\]]/g, '')

/** All forms that are correct for the bracketed word in an example. */
export function clozeAccepted(v: Verb, form: string): string[] {
  // Only widen via persons whose MAIN form is this word (so "ik kan" doesn't
  // accept "kunt"); fall back to alternatives (e.g. "hou" → also "houd").
  const f = form.toLowerCase()
  const out = new Set([f])
  const persons = [...PERSON_ORDER, 'q_jij' as Person]
  let matched = persons.filter((p) => v.present[p] === f)
  if (!matched.length) matched = persons.filter((p) => (v.accepted[p] ?? []).includes(f))
  for (const p of matched) acceptedForms(v, p).forEach((x) => out.add(x))
  return [...out]
}
