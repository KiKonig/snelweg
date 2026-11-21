// Answer checking and mistake classification (SPEC section 7, verbs part).
import type { Person, Verb } from './content'

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’`´]/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!?,;:]+$/, '')
    .trim()
}

export function isAccepted(answer: string, accepted: string[]): boolean {
  const a = normalize(answer)
  return accepted.some((x) => normalize(x) === a)
}

export const MISTAKE_LABEL: Record<string, string> = {
  inversion: 'Inversion: „werk jij?“ ohne -t',
  'missing-t': 'jij / u / hij: Stamm + t',
  'ik-stem': 'ik: nur der Stamm',
  plural: 'wij / jullie / zij: Infinitiv',
  irregular: 'Unregelmäßige Verben',
  'stem-spelling': 'Stamm-Schreibung',
  phrase: 'Sätze sprechen',
  listening: 'Hörverstehen',
  cloze: 'Verbform im Satz',
}

const PLURAL: Person[] = ['wij', 'jullie', 'zij_pl']

export function stemHint(v: Verb): string {
  const inf = v.infinitive
  const ik = v.present.ik
  if (/ven$/.test(inf) && ik.endsWith('f')) return `v wird am Wortende zu f: ${inf} → ik ${ik}.`
  if (/zen$/.test(inf) && ik.endsWith('s')) return `z wird am Wortende zu s: ${inf} → ik ${ik}.`
  if (/(aa|ee|oo|uu)[^aeiou]$/.test(ik) && !/(aa|ee|oo|uu)/.test(inf))
    return `Offene Silbe: ${inf} → ik ${ik} (Vokal wird verdoppelt, damit er lang bleibt).`
  if (/([^aeiou])\1en$/.test(inf)) return `Doppelkonsonant fällt am Wortende weg: ${inf} → ik ${ik}.`
  return `Stamm = Infinitiv ohne -en: ${inf} → ik ${ik}.`
}

/** Classify a wrong conjugation and return [type, German explanation]. */
export function classifyConj(v: Verb, person: Person, answer: string): [string, string] {
  const a = normalize(answer)
  const p = v.present
  if (person === 'q_jij' && a === p.jij && p.jij !== p.q_jij) {
    return ['inversion', `Steht jij/je hinter dem Verb, fällt das -t weg: jij ${p.jij} → ${p.q_jij} jij?`]
  }
  if (PLURAL.includes(person)) {
    return ['plural', `wij / jullie / zij (Plural) = Infinitiv: ${v.infinitive}.`]
  }
  if (person === 'ik' && (a === p.jij || a === v.infinitive) && !v.irregular) {
    return ['ik-stem', `ik = nur der Stamm, ohne Endung: ik ${p.ik}.`]
  }
  if (v.irregular) {
    return ['irregular', `${v.infinitive} ist unregelmäßig – diese Form auswendig lernen: ${p[person]}.`]
  }
  if (p[person].endsWith('t') && a === p[person].slice(0, -1)) {
    return ['missing-t', `jij / u / hij / zij / het: Stamm + t → ${p[person]}.`]
  }
  return ['stem-spelling', stemHint(v)]
}
