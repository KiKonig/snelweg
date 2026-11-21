// Tiny hash router: works on GitHub Pages without server config.
// URLs look like #/bibliothek/verb/gaan → route "bibliothek", params ["verb", "gaan"].
import { useEffect, useState } from 'preact/hooks'

export type Route =
  | 'home'
  | 'sitzung'
  | 'zusammenfassung'
  | 'woerterbuch'
  | 'sprechen'
  | 'bibliothek'
  | 'fortschritt'
  | 'einstellungen'

const ROUTES: Route[] = [
  'home',
  'sitzung',
  'zusammenfassung',
  'woerterbuch',
  'sprechen',
  'bibliothek',
  'fortschritt',
  'einstellungen',
]

export interface Loc {
  route: Route
  params: string[]
}

function parse(): Loc {
  const parts = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent)
  const r = parts[0] as Route
  return ROUTES.includes(r) ? { route: r, params: parts.slice(1).filter(Boolean) } : { route: 'home', params: [] }
}

export function href(route: Route, ...params: string[]): string {
  return '#/' + [route, ...params].map(encodeURIComponent).join('/')
}

export function go(route: Route, ...params: string[]) {
  location.hash = href(route, ...params).slice(1)
}

export function useLoc(): Loc {
  const [loc, setLoc] = useState<Loc>(parse())
  useEffect(() => {
    const on = () => {
      setLoc(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return loc
}
