# SPEC — Dutch for German speakers (fast-learner app)

> **For Claude Code:** This file is the source of truth for the project. Read it fully before planning.
> Build in the milestones listed in section 11, one at a time. After each milestone stop, tell me how to test it, and wait for my OK.
> If anything here is unclear or contradictory, ask me before you write code. Do not invent features that aren't in this spec.

---

## 0. Decisions I can change (edit these first)

| Setting | Current choice |
|---|---|
| App name | **Snelweg** |
| Interface language | **German only** (all buttons, explanations and feedback in German; no English option) |
| Dutch variant | **Netherlands Dutch** (nl-NL). Mention Flemish differences only where they matter. |
| Start level | Total beginner in Dutch, native-level German, fast learner |
| **Deadline** | **Hold simple everyday conversations by Christmas 2026 (~5 weeks).** Speaking comes first (see section 13). |
| Target level | Christmas: confident A2 speaking. Long term: **fluent** — the app keeps going after Christmas (see section 13.1) toward B2 and beyond in all skills |
| Daily time | 20–40 minutes |
| Phone | iPhone / Android (it must work on both). **My test phone is an iPhone.** |
| Hosting | **GitHub Pages** (public repository, free) |
| Christmas plan start | Week 1 starts **Monday 23 November 2026** |
| Navigation | Bottom bar: Home · Sprechen · Wörterbuch · Bibliothek · Fortschritt. Settings = gear icon on Home. Session and summary open from Home. |

---

## 1. Who this is for, and the core idea

I'm a native German speaker and a fast learner. I don't want a generic app that drip-feeds "der Apfel = de appel" one word at a time.

**Core idea: use my German as leverage.** A large share of Dutch is predictable from German through regular sound shifts. The app should:
1. **Teach the patterns, not the words.** Once I know `z → t` (Zeit → tijd, zehn → tien), I should *predict* new words, not memorise them.
2. **Spend my time on what German can't predict:** false friends, words with no German cognate, de/het, word order differences, idioms, pronunciation.
3. **Work at sentence level from day one.** Words appear inside real sentences, not in isolation.
4. **Be adaptive and fast.** If I get something right quickly and repeatedly, move on. Never make me grind things I already know.
5. **Speak out loud from day one.** Every session includes saying things aloud: hearing the model, saying it, recording myself and comparing. My goal is to *talk*, not just to recognise words.
6. **The four skills I need:** vocabulary + sentence structure, verbs with all persons (ik / jij / u / hij / zij / het / wij / jullie / zij), listening, and spelling. Each one gets its own exercises (section 5) and its own progress view.

---

## 2. Platform and technical constraints

- **Installable web app (PWA)**: it works in the phone browser, can be added to the home screen, opens full-screen with its own icon, and **works completely offline** after the first load.
- **Static site only**: no server and no login. It must be hostable for free on GitHub Pages or Netlify.
- **All learning content ships with the app** as JSON files in `/content`. No internet is needed while learning.
- **Progress is stored on the device** in IndexedDB. Include **export/import of progress** as a JSON file, so I can back up and move to a new phone.
- **Audio**: use the browser's built-in text-to-speech with an `nl-NL` voice. Show a clear message if no Dutch voice is installed, and explain how to install one on iPhone and Android.
- **Tech stack**: your choice, but keep it simple and well-documented (for example Vite + TypeScript + a PWA plugin). Explain your choice in one paragraph before starting.
- **Mobile first**: one-handed use, big tap targets (min 44px), works on a 360px-wide screen, respects iPhone safe areas (notch, home bar), dark mode follows the system setting.
- Use **git** from the start and commit after every working step with a clear message, so I can always go back.

---

## 3. Content model

All content lives in `/content/*.json`. Every item has a stable `id`.

### 3.1 Sound-shift rules (`rules.json`)
Each rule has: `id`, `name`, `german_pattern`, `dutch_pattern`, short explanation (in German), 6–15 example pairs, known exceptions, and `reliability` (how often the rule holds: high / medium / low).

Minimum rule set to start with (verify every example):

| Rule | Examples |
|---|---|
| z → t | Zeit → tijd, zehn → tien, Zunge → tong, zwei → twee, Herz → hart |
| pf → p | Pfeffer → peper, Apfel → appel, Pfund → pond, Pfeife → pijp |
| f / ff (after vowel) → p | schlafen → slapen, offen → open, Schiff → schip, helfen → helpen |
| ch → k | machen → maken, ich → ik, Woche → week, brechen → breken |
| ss / ß / s (from t) → t | Wasser → water, essen → eten, besser → beter, das → dat, was → wat, groß → groot |
| t → d (initial) | Tag → dag, Tochter → dochter, tun → doen, Tür → deur, trinken → drinken |
| f → v (initial) | Feuer → vuur, finden → vinden, fallen → vallen, Fisch → vis |
| s → z (initial) | Sonne → zon, sehen → zien, sagen → zeggen, sieben → zeven |
| ei → ij | Zeit → tijd, mein → mijn, Eis → ijs, schreiben → schrijven, bleiben → blijven |
| ei → ee | Stein → steen, ein → een, Bein → been, allein → alleen, Fleisch → vlees |
| au → ui | Haus → huis, braun → bruin, Maus → muis, Bauch → buik |
| au → oo | Baum → boom, auch → ook, Auge → oog, laufen → lopen |
| u → oe | Buch → boek, gut → goed, Fuß → voet, Blut → bloed |
| schl / schr / schw → sl / schr / zw | schlafen → slapen, schlecht → slecht, schwarz → zwart |
| -ung → -ing | Übung → oefening, Wohnung → woning, Meinung → mening |

Rules combine, and the app must handle chains: Pfeife → pijp (pf→p **and** ei→ij); Fleisch → vlees (f→v **and** ei→ee).

### 3.2 Vocabulary (`words.json`)
Use the ~2,500 most frequent Dutch words, with these fields: `dutch`, `german`, `article` (de/het, for nouns), `plural`, `pos` (part of speech), `frequency_rank`, `example_nl`, `example_de`, and `category`:
- `transparent`: German speakers guess it instantly (e.g. de hand, het huis).
- `rule`: predictable through one or more rules (store which `rule_ids`).
- `false_friend`: looks like German but means something else (see 3.3).
- `new`: no useful German link; must be learned.

The category decides how a word is practised (see section 5). **Transparent words are not drilled as flashcards.** They only appear inside sentences.

### 3.3 False friends (`false_friends.json`)
Each entry: `dutch`, what it really means in German, the German word it looks like and what *that* means in Dutch, plus 2 example sentences each way. Start with at least 60. Examples:
- bellen = anrufen / klingeln (bellen in German = blaffen)
- doof = taub (doof in German = dom)
- durven = sich trauen (dürfen = mogen)
- mogen = dürfen (mögen = graag hebben / houden van)
- eng = unheimlich (eng in German = smal / nauw)
- zee = Meer, meer = See (they're swapped!)
- winkel = Laden / Geschäft (Winkel in German = hoek)
- slim = schlau (schlimm = erg)
- raar = seltsam (rar = zeldzaam)
- gift = Spende (Gift in German = gif)
- brutaal = frech (brutal = wreed / gewelddadig)
- aardig = nett (artig = braaf)

### 3.4 Sentences (`sentences.json`)
At least 1,500 natural, everyday Dutch sentences, ordered from simple to complex. Each one has: `nl`, `de` (natural translation, not word-for-word), `level` (A1–B2), `word_ids` used, `grammar_ids` used, and `accepted_answers`: **all** correct Dutch translations, including common word-order and synonym variants.

### 3.5 Grammar topics (`grammar.json`)
Only where Dutch **differs** from German. Skip anything that works the same. Each topic has: a short explanation in German (max ~150 words, contrastive: "Im Deutschen …, im Niederländischen …"), 3–5 examples, and linked practice sentences. Topics:
0. **Basic sentence structure**: statement (V2), yes/no questions, W-questions (wie, wat, waar, wanneer, waarom, hoe, hoeveel), negation with niet vs. geen, subordinate clauses with omdat/dat/als (verb at the end). Mostly like German, so teach fast and show the differences.
1. No case system: no der/den/dem, one form for articles (exceptions only in fixed expressions)
2. **de vs. het**: tips and patterns (diminutives -je are always het, etc.), drilled heavily
3. Adjective endings: -e, except with an indefinite het-word (een groot huis / een grote man)
4. Plurals: -en vs. -s
5. Spelling: open/closed syllables and vowel doubling (man → mannen, maan → manen)
6. The word **er** (4 uses)
7. Verb clusters in subordinate clauses (dat ik het heb gezien / gezien heb)
8. Progressive: aan het + infinitive (ik ben aan het koken)
9. Future with gaan / zullen
10. om … te + infinitive
11. Diminutives (-je, -tje, -pje, -etje, -kje)
12. Pronouns, including je/jij/u and the forms ze/zij, het/'t, me/mij
13. Perfect tense with hebben/zijn: only the cases that differ from German
14. Separable verbs and word order: brief, since it's mostly like German
15. Common particles: toch, even, maar, wel, nou, hoor, gewoon

### 3.6 Pronunciation (`sounds.json`)
Each sound: spelling, German comparison, example words with TTS buttons. Must include: g/ch (hard throat sound), sch (s + ch, not like German sch), ui, ij/ei (same sound), oe (= German u), u (≈ ü), eu (≈ ö), uu, ie, w, final -en (often spoken as -e), v vs. f, z vs. s.

### 3.7 Verbs and conjugation (`verbs.json`)
The **150 most frequent Dutch verbs**, each with: infinitive, German meaning, full present tense for **ik, jij/je, u, hij, zij (she), het, wij/we, jullie, zij/ze (they)**, the question form with jij (inversion), past tense singular/plural, past participle, perfect auxiliary (hebben/zijn), separable yes/no, 2 example sentences, and audio for every form via TTS.

The rules to teach and drill explicitly, contrastive to German:
- Regular present: stem (ik werk), stem + t (jij werkt, hij werkt), infinitive (wij/jullie/zij werken).
- **Inversion drops the -t with jij/je:** jij werkt → *werk jij?*, but hij werkt → *werkt hij?* (a classic mistake for Germans).
- Stem spelling: lopen → ik loop (open/closed syllables), leven → ik leef (v → f), reizen → ik reis (z → s).
- **Core irregulars first**, with full tables: zijn, hebben, gaan, komen, doen, zien, staan, slaan, kunnen, willen, moeten, mogen, zullen, weten, zeggen, krijgen, worden.
- Modal verb + infinitive at the end (ik wil morgen gaan), the same as German.
- Past tense with the 't kofschip rule (werkte vs. woonde), plus the most common strong verbs.
- Perfect: hebben vs. zijn, past participle forms (ge- + stem + t/d).

**Order:** present tense of the top 40 verbs + the irregulars must be done in the first two weeks. It's the backbone for speaking.

### 3.8 Speaking content (`phrases.json`, `dialogues.json`)
- **Core phrases (~300)**, grouped by situation: greeting and small talk, introducing myself (name, where I'm from, work, family), asking and understanding directions, shop, café/restaurant, train/travel, phone calls, appointments, doctor/pharmacy, "I didn't understand, can you repeat that more slowly?", opinions (ik vind…, volgens mij…), agreeing/disagreeing, polite filler words (nou, even, hoor, gewoon, toch).
- **Dialogues (~60)**: short, realistic two-person conversations (6–12 lines) per situation, ordered from easy to harder. Each line has Dutch, German and audio. I can take either role.
- **Personal answers**: a screen where I write answers to the questions I'll certainly get asked (Wie heet je? Waar kom je vandaan? Wat doe je? Waarom leer je Nederlands? …). The app helps me get them correct (checks against patterns and shows examples), then I drill them aloud until I'm fluent.

### 3.9 Dictionary data (`dictionary.json`)
- At least **8,000 entries**, searchable in **both directions** (Dutch → German and German → Dutch), **fully offline**.
- Each entry: word, article + plural (nouns), conjugation table (verbs, linked to verbs.json), adjective forms, German translation(s), 1–2 example sentences, audio button, and links to false friends / sound rules where relevant.
- Prefer open dictionary data (e.g. Wiktionary-based data) where the license allows it. Record the source and license in CREDITS.md. Generated entries follow the quality rules in 3.10.

### 3.10 Content quality rules (important)
- Every Dutch sentence must be **natural, current Netherlands Dutch**, the way a native speaker would say it today.
- After generating content, **review it in a separate pass** for errors: de/het, spelling, word order, and correctness of the German translation.
- Mark anything you're not fully sure about with `"needs_review": true` and list those items in `CONTENT_REVIEW.md` so I can check them.
- Don't copy copyrighted texts. If you use open word-frequency lists or dictionaries, note the source and license in `CREDITS.md`.

---

## 4. Placement test (first launch)

- About 5 minutes and adaptive: get harder after correct answers, easier after wrong ones.
- It tests: reading comprehension (multiple choice), guessing Dutch words from German, recognising false friends, and translating short sentences German → Dutch.
- The result sets my starting point and **skips** anything I already know (I may have passive Dutch from German alone).
- I can retake it anytime from Settings.

---

## 5. Exercise types (exact behaviour)

Each session mixes types automatically (see section 6). All exercises show feedback immediately.

1. **Rule discovery** (to introduce a new rule): show 4–6 German→Dutch pairs and ask "Welches Muster siehst du?" with multiple choice. Then a short explanation, then straight to exercise 2.
2. **Predict the Dutch**: show a German word and I type the Dutch. If I'm wrong, show *which* rule applies, step by step (Pfeife → pf→p → Peife → ei→ij → pijp). Exceptions are explicitly flagged as "Ausnahme".
3. **False friend trap**: show a sentence with a false friend. Ask what it means (4 options, one of which is the "German" meaning). Every wrong answer here is scheduled again soon.
4. **de or het**: show a noun and I tap de / het. This must be fast: auto-advance after 0.6s if correct. Run in bursts of 10–20.
5. **Translate the sentence (German → Dutch)**: I type the full sentence. Check it against `accepted_answers` (see section 7). Show word-level differences highlighted (wrong word / missing word / word order).
6. **Word bank (German → Dutch)**: like 5, but I build the sentence by tapping word tiles, including 2–3 distractor tiles. Used for new grammar before free typing.
7. **Cloze**: a Dutch sentence with a gap (article, adjective ending, er, verb form, particle), and I type the missing part.
8. **Listening**: TTS reads a Dutch sentence (with a replay button and a slow button), and I type what I hear or pick the meaning.
9. **Quick read**: a short Dutch text (80–200 words, from level A2 up), then 3 comprehension questions in German. Tap any word to see its translation, and that word goes into my review queue.
10. **Speed round** (optional, from the home screen): 60 seconds of mixed quick items (de/het, predict-the-word, false friends). Show my score and personal best.
11. **Conjugation drill**: show a person + verb (e.g. "jij · hebben" or "Frage: jij · werken") and I type the form. Variants: fill in a sentence (Morgen ___ wij naar Utrecht. → gaan), or a full table where I fill in all persons. Wrong answers show the rule (e.g. "Inversion: -t fällt weg"). Use auto-advance for speed.
12. **Say it** (speaking): show German, say the Dutch out loud, then tap to reveal and hear the model, and grade myself (Gewusst / Fast / Nicht gewusst). From sentence level up. Used for phrases, verb forms and translation sentences.
13. **Shadowing**: TTS plays a Dutch sentence (normal and slow speed). I repeat it while recording with the phone microphone, then play my recording and the model back to back to compare. Recordings are stored on the device only (for the last 20 items) and can be deleted.
14. **Dictation / spelling**: TTS reads a word or sentence and I type exactly what I hear. Spelling mistakes are highlighted letter by letter and linked to the spelling rule (ij/ei, single/double vowel, -d/-t endings, g/ch, sch). Separate "spell the word" mode for single words, focusing on my most common spelling mistake types.
15. **Dialogue role-play**: go through a dialogue line by line. The app says the other person's lines (audio), and I say mine out loud (prompt in German, or a hidden Dutch line I can reveal), then hear the model. Later levels: the other person's line is audio only (no text), so I have to understand by listening.
16. **Speech recognition check (optional bonus)**: if the browser supports speech recognition for nl-NL and I'm online, the app can transcribe what I said in exercises 12 and 15 and compare it with the target sentence. It must be clearly marked as optional and never required, because it doesn't work offline on most phones. Self-grading always remains available.

---

## 6. Learning engine

- **Spaced repetition** for everything I need to remember (rules, non-transparent words, false friends, de/het, grammar points), using FSRS or SM-2. Explain which one you picked.
- Each answer is graded automatically: correct + fast = easy, correct + slow or with a hint = good, almost right = hard, wrong = again. "Fast" means under the median time for that exercise type.
- **No grinding**: an item answered correctly and fast 3 times in a row gets a long interval right away.
- **Session builder**: a daily session is about 70% reviews due + 30% new material. New material is picked in this priority order: next rule → most frequent unknown non-transparent words → next grammar topic. Respect the daily time setting.
- **Mistake memory**: track *what kind* of error I make (wrong article, word order, adjective ending, false friend, spelling: doubled vowel, ei/ij, etc.). If a type of error repeats, add targeted practice for it to the next session.
- **Level-up**: new grammar and sentence complexity unlock when I'm ready (e.g. ≥85% correct on the current level over the last 50 items), not after a fixed number of days.

---

## 7. Answer checking (very important)

- Ignore upper/lower case, extra spaces, and punctuation at the end.
- Accept **all** variants in `accepted_answers`.
- **Typos**: if the answer is 1 letter off on a longer word *and* it's not a meaningful mistake, count it as correct but show the correct spelling. Meaningful mistakes are **never** forgiven as typos: wrong article (de/het), ij vs. ei, a single vs. double vowel when it changes the word, adjective -e, wrong verb form.
- If an answer seems correct but isn't in the list, show a button **"Meine Antwort war richtig"**. It counts the answer as correct and logs it to a list I can export, so the content can be fixed later.
- On wrong answers, show a **short explanation of why**, in German, linked to the rule or grammar topic.

---

## 8. Screens

1. **Home**: big "Start today's session" button with estimated minutes, streak, items due, and current level. Smaller buttons: Speed round, Free practice.
2. **Session**: one exercise per screen, progress bar at top, quit button (progress is saved).
3. **Session summary**: accuracy, new items learned, top mistake type, with a button to practise that mistake now.
4. **Dictionary**: one search box at the top that searches Dutch and German at once, as I type, offline. Results show article, translation and an audio button. Tapping a result opens the full entry (section 3.9) with a **"Zum Lernen hinzufügen"** button that puts the word into my spaced-repetition queue. Reachable from every screen in at most 1 tap (bottom navigation), and from any Dutch word in the app by long-press.
5. **Speak**: phrases by situation, dialogues, my personal answers, shadowing. Every item has a play button.
6. **Library**: browse rules, grammar topics, false friends, pronunciation, and my words (search and filter). Each item shows my mastery level. Any item can be practised directly.
7. **Progress**: separate scores for **vocabulary, verbs, sentence structure, listening, spelling, speaking**; days left until Christmas and whether I'm on track (section 13); words known (estimated, including transparent ones), mastery per rule and grammar topic, accuracy over the last 30 days, mistake types over time, minutes per day.
8. **Settings**: daily time, audio on/off and speed, retake placement test, export/import progress, reset.

---

## 9. Feel and design

- Calm, clean, fast. No cartoon mascots, no childish rewards, no ads.
- Instant transitions. Every tap responds in under 100ms.
- Keyboard-friendly when typing: Enter = check / next. The keyboard must not hide the input on phones.
- Audio is never forced. Sound plays only after I tap something (phones block autoplay anyway).

---

## 10. Out of scope (for now)

- Accounts, cloud sync, social features, leaderboards
- Automatic pronunciation *scoring* (speaking practice itself is in scope: exercises 12, 13, 15 and the optional check in 16)
- An AI chat tutor. A possible later phase: it would need internet and an API key with its own cost, so it's not part of the offline core.
- App Store / Play Store publishing

---

## 11. Milestones (build one at a time, stop after each)

Each milestone ends with: a working app I can open, a short list of what to test, and a git commit.

**Milestones 1–5 are the "Christmas track".** They must be usable on my phone as fast as possible, ideally within the first week, so I can start learning while the rest is built. Build them with smaller content sets first, then grow.

1. **Skeleton + audio**: project setup, PWA (installable + offline), the 8 screens with placeholder content, IndexedDB storage, export/import of progress, TTS working with an nl-NL voice check. Deploy to GitHub Pages or Netlify right away, so I can install it on my phone from day one. *Test:* install on phone, turn on airplane mode, app still opens, a Dutch word plays.
2. **Spaced repetition + session builder + verbs**: SRS, auto-grading by speed, daily session, summary screen, verbs.json (top 40 verbs + all core irregulars), conjugation drill (exercise 11), sentence structure topic 0. *Test:* conjugate jij/hij/wij forms and inversion correctly.
3. **Speaking core**: phrases.json (first 150 phrases), the first 20 dialogues, exercises 12, 13 and 15, personal answers screen. *Test:* record myself and compare with the model; do a dialogue role-play.
4. **Dictionary + words**: dictionary.json (first 3,000 entries, growing to 8,000 in milestone 9), dictionary screen with offline search in both directions, words.json (first 800 words), de/het drill (exercise 4), add-to-review from the dictionary.
5. **Sentences, listening + spelling**: sentences.json (first 500), exercises 5, 6, 7, 8 and 14, the full answer checking from section 7, mistake-type tracking.
6. **Rules engine + false friends**: rules.json with the full rule set, exercises 1, 2 and 3, false_friends.json.
7. **Grammar topics**: all topics from 3.5 with linked practice and level-up logic, plus pronunciation library (3.6).
8. **Placement test + reading**: section 4 and exercise 9 with tap-to-translate.
9. **Full content**: reach all content numbers (verbs 150, phrases 300, dialogues 60, dictionary 8,000, words 2,500, sentences 1,500), review pass, CONTENT_REVIEW.md.
10. **Polish**: speed round, optional speech recognition check (exercise 16), progress charts incl. Christmas tracker, final mobile testing, install instructions for iPhone and Android.

---

## 12. How to work with me

- I'm not a programmer. Explain what I need to *do* (commands to run, what to click) in simple steps. Explain code only if I ask.
- Before each milestone, give me a short plan (5–10 lines) and wait for my OK.
- After each milestone, tell me exactly how to test it on my computer **and** on my phone.
- When something breaks, fix it yourself first: run it, read the error, and try again before asking me.
- Keep a `PROGRESS.md` with what's done, what's next, and known issues, so we can continue in a new session anytime.

---

## 13. Christmas plan (built into the session builder)

Goal: by **24 December 2026** I can introduce myself, make small talk, order, shop, ask for directions, talk about my day/work/plans in present tense, understand simple replies, and say "repeat that, please".

The session builder follows this weekly focus. It shows the current week on the Home screen and on Progress shows whether I'm on track.

| Week | Focus |
|---|---|
| 1 | Pronunciation basics, pronouns, zijn/hebben/gaan/komen, present tense of the top 40 verbs, sentence structure + questions + niet/geen, greeting and introducing myself, my personal answers |
| 2 | Core irregulars + modal verbs (kunnen, willen, moeten, mogen), café/shop/travel phrases, de/het for the top 300 nouns, first dialogues, daily shadowing |
| 3 | Perfect tense (what I did yesterday/at the weekend), future with gaan, top 800 words, directions/phone/appointments, dictation practice |
| 4 | Opinions and reasons (omdat, want, dat), particles (toch, even, maar, wel), longer dialogues with audio-only for the other speaker, past tense of the most common verbs |
| 5 | Mixed conversation practice: dialogue role-play at full speed, personal-answer fluency, weak spots from mistake memory, Christmas and family vocabulary |

Daily minimum: **10 minutes speaking** (exercises 12, 13 or 15) in every session, whatever else is due.

The app should also remind me (a text card on the Home screen, no push notifications) that real conversations matter most. Suggest practising with a real person or a language exchange at least once a week from week 3.

### 13.1 After Christmas (long-term mode)

The app does not stop after week 5. From 25 December 2026 the session builder switches to long-term mode:
- No weekly focus. New material follows the normal priority order and level-up rules from section 6, toward fluency.
- The daily minimum of 10 minutes speaking stays.
- Home and Progress replace the Christmas tracker with progress toward the next level (A2 → B1 → B2 → beyond) per skill.
