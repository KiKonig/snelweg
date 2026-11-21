import { useEffect } from 'preact/hooks'
import { useRoute, type Route } from './router'
import { SettingsProvider } from './settings'
import { requestPersistence } from './db'
import { Home } from './screens/Home'
import { Session } from './screens/Session'
import { Summary } from './screens/Summary'
import { Dictionary } from './screens/Dictionary'
import { Speak } from './screens/Speak'
import { Library } from './screens/Library'
import { Progress } from './screens/Progress'
import { SettingsScreen } from './screens/Settings'

const NAV: { route: Route; label: string; icon: string }[] = [
  { route: 'home', label: 'Home', icon: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { route: 'sprechen', label: 'Sprechen', icon: 'M12 3a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3' },
  { route: 'woerterbuch', label: 'Wörterbuch', icon: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5' },
  { route: 'bibliothek', label: 'Bibliothek', icon: 'M4 4h5v16H4zM10 4h5v16h-5zM16 5l4 1-3 14-4-1z' },
  { route: 'fortschritt', label: 'Fortschritt', icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
]

function Screen({ route }: { route: Route }) {
  switch (route) {
    case 'sitzung': return <Session />
    case 'zusammenfassung': return <Summary />
    case 'woerterbuch': return <Dictionary />
    case 'sprechen': return <Speak />
    case 'bibliothek': return <Library />
    case 'fortschritt': return <Progress />
    case 'einstellungen': return <SettingsScreen />
    default: return <Home />
  }
}

export function App() {
  const route = useRoute()
  useEffect(() => {
    requestPersistence()
  }, [])
  const inSession = route === 'sitzung'
  return (
    <SettingsProvider>
      <main class={inSession ? 'screen no-nav' : 'screen'}>
        <Screen route={route} />
      </main>
      {!inSession && (
        <nav class="bottom-nav" aria-label="Hauptnavigation">
          {NAV.map((n) => {
            const active = route === n.route || (n.route === 'home' && (route === 'einstellungen' || route === 'zusammenfassung'))
            return (
              <a href={`#/${n.route}`} class={active ? 'active' : ''} aria-current={active ? 'page' : undefined}>
                <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                  <path d={n.icon} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <span>{n.label}</span>
              </a>
            )
          })}
        </nav>
      )}
    </SettingsProvider>
  )
}
