import type { ComponentChildren } from 'preact'
import { speak, type VoiceStatus } from './tts'
import { useSettings } from './settings'

export function PlayButton({ text, label = 'Anhören', slow = false }: { text: string; label?: string; slow?: boolean }) {
  const { settings } = useSettings()
  const rate = slow ? Math.max(0.5, settings.audioRate - 0.3) : settings.audioRate
  return (
    <button
      class="icon-btn play"
      aria-label={`${label}: ${text}`}
      disabled={!settings.audioOn}
      onClick={() => speak(text, rate)}
    >
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
        <path d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" />
      </svg>
    </button>
  )
}

export function Placeholder({ milestone, children }: { milestone: number; children?: ComponentChildren }) {
  return (
    <div class="placeholder">
      <span class="tag">Platzhalter · kommt in Meilenstein {milestone}</span>
      {children}
    </div>
  )
}

export function VoiceHelp({ status }: { status: VoiceStatus }) {
  if (status === 'ok' || status === 'checking') return null
  return (
    <div class="card warn" role="status">
      <h3>{status === 'unsupported' ? 'Sprachausgabe nicht verfügbar' : 'Keine niederländische Stimme gefunden'}</h3>
      {status === 'unsupported' ? (
        <p>Dieser Browser unterstützt keine Sprachausgabe. Bitte Safari (iPhone) oder Chrome (Android) verwenden.</p>
      ) : (
        <>
          <p>Damit du Niederländisch hörst, installiere einmalig eine Stimme. Sie funktioniert danach auch offline.</p>
          <p>
            <strong>iPhone:</strong> Einstellungen → Bedienungshilfen → Gesprochene Inhalte → Stimmen → Niederländisch →
            eine Stimme laden (z.&nbsp;B. „Xander“ oder „Claire“). Danach Snelweg ganz schließen und neu öffnen.
          </p>
          <p>
            <strong>Android:</strong> Einstellungen → System → Sprachen &amp; Eingabe → Sprachausgabe → Google-Sprachausgabe →
            Sprachdaten installieren → Niederländisch (Niederlande). Die Menünamen können je nach Gerät leicht abweichen.
          </p>
        </>
      )}
    </div>
  )
}

export function Header({ title, right }: { title: string; right?: ComponentChildren }) {
  return (
    <header class="top">
      <h1>{title}</h1>
      {right}
    </header>
  )
}
