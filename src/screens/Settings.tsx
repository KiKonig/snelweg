import { useRef, useState } from 'preact/hooks'
import { Header, PlayButton, VoiceHelp } from '../components'
import { exportProgress, importProgress, resetProgress } from '../db'
import { useSettings } from '../settings'
import { useDutchVoice } from '../tts'

async function saveFile(file: File) {
  // On iPhone the share sheet lets you "Sichern in Dateien".
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean }
  if (nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: file.name })
      return
    } catch (e) {
      if ((e as DOMException).name === 'AbortError') return
    }
  }
  const url = URL.createObjectURL(file)
  const a = document.createElement('a')
  a.href = url
  a.download = file.name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

export function SettingsScreen() {
  const { settings, update, reload } = useSettings()
  const voice = useDutchVoice()
  const fileInput = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const onExport = async () => {
    try {
      await saveFile(await exportProgress())
      setMsg({ ok: true, text: 'Sicherung erstellt.' })
    } catch {
      setMsg({ ok: false, text: 'Export fehlgeschlagen.' })
    }
  }

  const onImport = async (e: Event) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return
    if (!confirm('Der aktuelle Fortschritt wird durch die Sicherung ersetzt. Fortfahren?')) return
    try {
      await importProgress(file)
      await reload()
      setMsg({ ok: true, text: 'Fortschritt wiederhergestellt.' })
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message })
    }
  }

  const onReset = async () => {
    if (!confirm('Wirklich den gesamten Fortschritt löschen?')) return
    if (!confirm('Das kann nicht rückgängig gemacht werden. Endgültig löschen?')) return
    await resetProgress()
    await reload()
    setMsg({ ok: true, text: 'Fortschritt gelöscht.' })
  }

  return (
    <>
      <Header title="Einstellungen" />

      <section class="card">
        <h3>Lernzeit</h3>
        <label class="field">
          <span>
            Tägliche Zeit: <strong>{settings.dailyMinutes} Minuten</strong>
          </span>
          <input
            type="range"
            min={10}
            max={60}
            step={5}
            value={settings.dailyMinutes}
            onInput={(e) => update({ dailyMinutes: Number((e.target as HTMLInputElement).value) })}
          />
        </label>
      </section>

      <section class="card">
        <h3>Audio</h3>
        <label class="field toggle">
          <span>Audio an</span>
          <input
            type="checkbox"
            checked={settings.audioOn}
            onChange={(e) => update({ audioOn: (e.target as HTMLInputElement).checked })}
          />
        </label>
        <label class="field">
          <span>
            Geschwindigkeit: <strong>{settings.audioRate.toFixed(1)}×</strong>
          </span>
          <input
            type="range"
            min={0.6}
            max={1.2}
            step={0.1}
            value={settings.audioRate}
            onInput={(e) => update({ audioRate: Number((e.target as HTMLInputElement).value) })}
          />
        </label>
        <div class="phrase">
          <p class="muted">
            Stimme:{' '}
            {voice.status === 'checking' ? 'wird gesucht …' : voice.status === 'ok' ? voice.name : 'keine niederländische Stimme'}
          </p>
          <PlayButton text="Welkom bij Snelweg!" label="Teststimme" />
        </div>
        <p class="muted">Kein Ton? Auf dem iPhone bleibt die Sprachausgabe stumm, wenn das Gerät auf lautlos steht (Stumm-Schalter bzw. Aktionstaste).</p>
      </section>
      <VoiceHelp status={voice.status} />

      <section class="card">
        <h3>Fortschritt sichern</h3>
        <p class="muted">Dein Fortschritt liegt nur auf diesem Gerät. Exportiere regelmäßig eine Sicherung, z. B. in die Dateien-App.</p>
        <div class="row">
          <button class="btn" onClick={onExport}>
            Exportieren
          </button>
          <button class="btn" onClick={() => fileInput.current?.click()}>
            Importieren
          </button>
        </div>
        <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={onImport} />
        {msg && <p class={msg.ok ? 'ok' : 'error'}>{msg.text}</p>}
      </section>

      <section class="card">
        <h3>Sonstiges</h3>
        <button class="btn" disabled title="kommt in Meilenstein 8">
          Einstufungstest wiederholen
        </button>
        <button class="btn danger" onClick={onReset}>
          Fortschritt zurücksetzen
        </button>
      </section>

      <p class="muted center">Snelweg {__APP_VERSION__}</p>
    </>
  )
}
