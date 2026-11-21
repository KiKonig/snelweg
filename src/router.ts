// Tiny hash router: works on GitHub Pages without server config.
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

function parse(): Route {
  const r = location.hash.replace(/^#\/?/, '').split('?')[0] as Route
  return ROUTES.includes(r) ? r : 'home'
}

export function go(r: Route) {
  location.hash = '/' + r
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(parse())
  useEffect(() => {
    const on = () => {
      setRoute(parse())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}
