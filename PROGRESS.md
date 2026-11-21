# Snelweg – progress

## Done
**Milestone 1 – Skeleton + audio** (21 Nov 2026)
- Vite + TypeScript + Preact + vite-plugin-pwa; Dexie for IndexedDB storage
- Installable PWA, all files precached for offline use (20 files, ~150 KB)
- 8 screens with German placeholder content: Home, Sitzung, Zusammenfassung, Wörterbuch, Sprechen, Bibliothek, Fortschritt, Einstellungen
- Bottom navigation (Home · Sprechen · Wörterbuch · Bibliothek · Fortschritt), settings via gear icon
- Christmas plan week display (week 1 = 23 Nov 2026), long-term mode after 24 Dec
- Placeholder "Sag es" session (5 phrases) that records streak and counters
- Export / import / reset of progress (iPhone: share sheet → "In Dateien sichern")
- Dutch TTS: picks an nl-NL voice, normal + slow playback, German help if no Dutch voice is installed
- Mobile first: safe areas, ≥44px tap targets, dark mode, 16px+ inputs (no iPhone zoom)
- GitHub Actions workflow that publishes to GitHub Pages on every push to `main`

## Next
- Publish to GitHub Pages (needs the user's GitHub login), test on iPhone
- Milestone 2: spaced repetition (FSRS), session builder, verbs.json, conjugation drill, grammar topic 0

## Known issues
- The offline service worker can't be tested in the Claude in-app browser (it blocks service workers). Test offline on the iPhone.
- 4 "moderate" npm audit warnings in build-only tools; they don't ship to the phone.

## How to run on the computer
```
npm install
npm run dev       # development, http://localhost:5173/snelweg/
npm run build     # production build into dist/
npm run preview   # serve the build, http://localhost:4173/snelweg/
```
