// Christmas plan (SPEC section 13) and long-term mode (13.1).

export const PLAN_START = new Date(2026, 10, 23) // Monday 23 November 2026
export const CHRISTMAS = new Date(2026, 11, 24) // 24 December 2026

export const WEEK_FOCUS = [
  'Aussprache, Pronomen, zijn/hebben/gaan/komen, Präsens der 40 häufigsten Verben, Satzbau, Fragen, niet/geen, Begrüßen und Vorstellen',
  'Unregelmäßige Verben und Modalverben, Café/Laden/Reisen, de/het der 300 häufigsten Nomen, erste Dialoge, tägliches Shadowing',
  'Perfekt, Futur mit gaan, die 800 häufigsten Wörter, Wegbeschreibung/Telefon/Termine, Diktat',
  'Meinungen und Gründe (omdat, want, dat), Partikeln (toch, even, maar, wel), längere Dialoge nur mit Audio, Präteritum',
  'Gemischtes Gesprächstraining, flüssige persönliche Antworten, Schwachstellen, Wortschatz Weihnachten und Familie',
]

const DAY = 86_400_000

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

export type PlanState =
  | { phase: 'before'; daysUntilStart: number }
  | { phase: 'christmas'; week: number; focus: string; daysLeft: number }
  | { phase: 'longterm' }

export function planState(now = new Date()): PlanState {
  const today = startOfDay(now)
  if (today < PLAN_START) {
    return { phase: 'before', daysUntilStart: Math.round((+PLAN_START - +today) / DAY) }
  }
  if (today > CHRISTMAS) return { phase: 'longterm' }
  const week = Math.min(5, Math.floor((+today - +PLAN_START) / DAY / 7) + 1)
  return {
    phase: 'christmas',
    week,
    focus: WEEK_FOCUS[week - 1],
    daysLeft: Math.round((+CHRISTMAS - +today) / DAY),
  }
}
