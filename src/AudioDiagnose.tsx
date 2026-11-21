// Temporary diagnostic panel to find out why speech is silent on some iPhones.
import { useState } from 'preact/hooks'

type Mode = 'xander' | 'lang' | 'default'

let keep: SpeechSynthesisUtterance | null = null

export function AudioDiagnose() {
  const [log, setLog] = useState<string[]>([])
  const add = (s: string) => setLog((l) => [...l.slice(-14), `${new Date().toLocaleTimeString()} ${s}`])

  const test = (mode: Mode) => {
    const ss = window.speechSynthesis
    if (!ss) {
      add('speechSynthesis fehlt')
      return
    }
    const voices = ss.getVoices()
    add(`[${mode}] Stimmen gesamt: ${voices.length}, speaking=${ss.speaking}, pending=${ss.pending}, paused=${ss.paused}`)
    if (ss.speaking || ss.pending) ss.cancel()
    if (ss.paused) ss.resume()
    const text = mode === 'default' ? 'Hallo, das ist ein Test.' : 'Goedemorgen, dit is een test.'
    const u = new SpeechSynthesisUtterance(text)
    if (mode === 'xander') {
      const v = voices.find((x) => x.lang.replace('_', '-').toLowerCase().startsWith('nl'))
      add(`Stimme gewählt: ${v ? `${v.name} (${v.lang}) local=${v.localService}` : 'keine'}`)
      if (v) u.voice = v
      u.lang = v?.lang ?? 'nl-NL'
    } else if (mode === 'lang') {
      u.lang = 'nl-NL'
    }
    u.onstart = () => add('▶ start')
    u.onend = () => add('■ ende')
    u.onerror = (e) => add(`✖ Fehler: ${(e as SpeechSynthesisErrorEvent).error}`)
    keep = u
    ss.speak(u)
    setTimeout(() => add(`nach 1,5 s: speaking=${ss.speaking}, pending=${ss.pending}`), 1500)
  }

  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone

  return (
    <section class="card">
      <h3>Audio-Diagnose</h3>
      <p class="muted">Modus: {standalone ? 'Home-Bildschirm-App' : 'Browser-Tab'}</p>
      <div class="grade">
        <button class="btn" onClick={() => test('xander')}>
          1 · NL-Stimme
        </button>
        <button class="btn" onClick={() => test('lang')}>
          2 · nur nl-NL
        </button>
        <button class="btn" onClick={() => test('default')}>
          3 · Deutsch
        </button>
      </div>
      <pre class="diag">{log.join('\n') || 'Tippe nacheinander auf 1, 2 und 3.'}</pre>
      <button class="btn" onClick={() => setLog([])}>
        Protokoll leeren
      </button>
      {keep && null}
    </section>
  )
}
