// Generates content/verbs.json from a compact, hand-checked source list.
// Run: node scripts/gen-verbs.mjs
// Present tense is derived from the ik-form (stem) with the regular rules;
// irregular forms are given explicitly in `o` (overrides) and `alt` (also accepted).
import { writeFileSync } from 'node:fs'

const P = ['ik', 'jij', 'u', 'hij', 'zij_sg', 'het', 'wij', 'jullie', 'zij_pl', 'q_jij']

// [infinitive, German, ik-form, past sg, past pl, participle, aux, extras]
// extras: { o: overrides, alt: alternatives, irr: true, ex: [[nl, de], ...] }
// In examples, the conjugated form is in [brackets] (used for gap exercises).
const V = [
  ['zijn', 'sein', 'ben', 'was', 'waren', 'geweest', 'zijn', { irr: true,
    o: { jij: 'bent', u: 'bent', hij: 'is', zij_sg: 'is', het: 'is', q_jij: 'ben' },
    ex: [['Ik [ben] moe.', 'Ich bin müde.'], ['Waar [zijn] jullie?', 'Wo seid ihr?']] }],
  ['hebben', 'haben', 'heb', 'had', 'hadden', 'gehad', 'hebben', { irr: true,
    o: { jij: 'hebt', u: 'hebt', hij: 'heeft', zij_sg: 'heeft', het: 'heeft', q_jij: 'heb' }, alt: { u: ['heeft'] },
    ex: [['Ik [heb] een vraag.', 'Ich habe eine Frage.'], ['[Heb] jij tijd?', 'Hast du Zeit?']] }],
  ['gaan', 'gehen, fahren', 'ga', 'ging', 'gingen', 'gegaan', 'zijn', { irr: true,
    ex: [['Wij [gaan] morgen naar Utrecht.', 'Wir fahren morgen nach Utrecht.'], ['Hoe [gaat] het?', 'Wie geht’s?']] }],
  ['komen', 'kommen', 'kom', 'kwam', 'kwamen', 'gekomen', 'zijn', { irr: true,
    ex: [['Waar [kom] je vandaan?', 'Woher kommst du?'], ['Hij [komt] om acht uur.', 'Er kommt um acht Uhr.']] }],
  ['heten', 'heißen', 'heet', 'heette', 'heetten', 'geheten', 'hebben', {
    ex: [['Ik [heet] Anna.', 'Ich heiße Anna.'], ['Hoe [heet] je?', 'Wie heißt du?']] }],
  ['wonen', 'wohnen', 'woon', 'woonde', 'woonden', 'gewoond', 'hebben', {
    ex: [['Ik [woon] in Amsterdam.', 'Ich wohne in Amsterdam.'], ['Waar [woon] je?', 'Wo wohnst du?']] }],
  ['werken', 'arbeiten', 'werk', 'werkte', 'werkten', 'gewerkt', 'hebben', {
    ex: [['Ik [werk] in een ziekenhuis.', 'Ich arbeite in einem Krankenhaus.'], ['Waar [werk] jij?', 'Wo arbeitest du?']] }],
  ['doen', 'tun, machen', 'doe', 'deed', 'deden', 'gedaan', 'hebben', { irr: true,
    ex: [['Wat [doe] je?', 'Was machst du?'], ['Wat [doet] u voor werk?', 'Was machen Sie beruflich?']] }],
  ['kunnen', 'können', 'kan', 'kon', 'konden', 'gekund', 'hebben', { irr: true,
    o: { jij: 'kunt', u: 'kunt', hij: 'kan', zij_sg: 'kan', het: 'kan', q_jij: 'kun' }, alt: { jij: ['kan'], u: ['kan'], q_jij: ['kan'] },
    ex: [['[Kunt] u dat herhalen?', 'Können Sie das wiederholen?'], ['Ik [kan] niet komen.', 'Ich kann nicht kommen.']] }],
  ['willen', 'wollen, möchten', 'wil', 'wilde', 'wilden', 'gewild', 'hebben', { irr: true,
    o: { jij: 'wilt', u: 'wilt', hij: 'wil', zij_sg: 'wil', het: 'wil', q_jij: 'wil' }, alt: { jij: ['wil'], u: ['wil'] },
    ex: [['Ik [wil] graag een koffie.', 'Ich möchte gern einen Kaffee.'], ['[Wil] je iets drinken?', 'Möchtest du etwas trinken?']] }],
  ['moeten', 'müssen', 'moet', 'moest', 'moesten', 'gemoeten', 'hebben', { irr: true,
    ex: [['Ik [moet] nu gaan.', 'Ich muss jetzt gehen.'], ['Je [moet] dit boek lezen.', 'Du musst dieses Buch lesen.']] }],
  ['mogen', 'dürfen', 'mag', 'mocht', 'mochten', 'gemogen', 'hebben', { irr: true,
    o: { jij: 'mag', u: 'mag', hij: 'mag', zij_sg: 'mag', het: 'mag', q_jij: 'mag' },
    ex: [['[Mag] ik hier zitten?', 'Darf ich hier sitzen?'], ['Je [mag] hier niet roken.', 'Du darfst hier nicht rauchen.']] }],
  ['zullen', 'werden (Zukunft), sollen (Vorschlag)', 'zal', 'zou', 'zouden', null, 'hebben', { irr: true,
    o: { jij: 'zult', u: 'zult', hij: 'zal', zij_sg: 'zal', het: 'zal', q_jij: 'zul' }, alt: { jij: ['zal'], u: ['zal'], q_jij: ['zal'] },
    ex: [['Ik [zal] het proberen.', 'Ich werde es versuchen.'], ['[Zullen] we gaan?', 'Sollen wir gehen?']] }],
  ['worden', 'werden', 'word', 'werd', 'werden', 'geworden', 'zijn', { irr: true,
    ex: [['Het [wordt] koud.', 'Es wird kalt.'], ['Ik [word] morgen dertig.', 'Ich werde morgen dreißig.']] }],
  ['weten', 'wissen', 'weet', 'wist', 'wisten', 'geweten', 'hebben', { irr: true,
    ex: [['Ik [weet] het niet.', 'Ich weiß es nicht.'], ['[Weet] jij waar het station is?', 'Weißt du, wo der Bahnhof ist?']] }],
  ['zeggen', 'sagen', 'zeg', 'zei', 'zeiden', 'gezegd', 'hebben', { irr: true,
    ex: [['Wat [zeg] je?', 'Was sagst du?'], ['Hoe [zeg] je dat in het Nederlands?', 'Wie sagt man das auf Niederländisch?']] }],
  ['zien', 'sehen', 'zie', 'zag', 'zagen', 'gezien', 'hebben', { irr: true,
    ex: [['Ik [zie] je morgen.', 'Wir sehen uns morgen.'], ['[Zie] jij het station?', 'Siehst du den Bahnhof?']] }],
  ['krijgen', 'bekommen', 'krijg', 'kreeg', 'kregen', 'gekregen', 'hebben', { irr: true,
    ex: [['Ik [krijg] een koffie, alstublieft.', 'Ich bekomme einen Kaffee, bitte.'], ['Wat [krijgt] u?', 'Was bekommen Sie?']] }],
  ['staan', 'stehen', 'sta', 'stond', 'stonden', 'gestaan', 'hebben', { irr: true,
    ex: [['De koffie [staat] op tafel.', 'Der Kaffee steht auf dem Tisch.'], ['Ik [sta] al tien minuten te wachten.', 'Ich warte schon seit zehn Minuten.']] }],
  ['slaan', 'schlagen', 'sla', 'sloeg', 'sloegen', 'geslagen', 'hebben', { irr: true,
    ex: [['Hij [slaat] de deur dicht.', 'Er schlägt die Tür zu.'], ['De klok [slaat] twaalf.', 'Die Uhr schlägt zwölf.']] }],
  ['spreken', 'sprechen', 'spreek', 'sprak', 'spraken', 'gesproken', 'hebben', {
    ex: [['[Spreekt] u Engels?', 'Sprechen Sie Englisch?'], ['Ik [spreek] een beetje Nederlands.', 'Ich spreche ein bisschen Niederländisch.']] }],
  ['leren', 'lernen', 'leer', 'leerde', 'leerden', 'geleerd', 'hebben', {
    ex: [['Ik [leer] Nederlands.', 'Ich lerne Niederländisch.'], ['Hij [leert] snel.', 'Er lernt schnell.']] }],
  ['begrijpen', 'verstehen', 'begrijp', 'begreep', 'begrepen', 'begrepen', 'hebben', {
    ex: [['Ik [begrijp] het niet.', 'Ich verstehe es nicht.'], ['[Begrijp] je me?', 'Verstehst du mich?']] }],
  ['maken', 'machen', 'maak', 'maakte', 'maakten', 'gemaakt', 'hebben', {
    ex: [['Ik [maak] een foto.', 'Ich mache ein Foto.'], ['Wat [maak] je vanavond?', 'Was kochst/machst du heute Abend?']] }],
  ['geven', 'geben', 'geef', 'gaf', 'gaven', 'gegeven', 'hebben', {
    ex: [['[Geef] je me het zout?', 'Gibst du mir das Salz?'], ['Zij [geeft] hem een cadeau.', 'Sie gibt ihm ein Geschenk.']] }],
  ['vinden', 'finden', 'vind', 'vond', 'vonden', 'gevonden', 'hebben', {
    ex: [['Ik [vind] het leuk.', 'Ich finde es schön.'], ['[Vind] je dat ook?', 'Findest du das auch?']] }],
  ['nemen', 'nehmen', 'neem', 'nam', 'namen', 'genomen', 'hebben', {
    ex: [['Ik [neem] de trein.', 'Ich nehme den Zug.'], ['Wat [neemt] u?', 'Was nehmen Sie?']] }],
  ['denken', 'denken, glauben', 'denk', 'dacht', 'dachten', 'gedacht', 'hebben', {
    ex: [['Ik [denk] het wel.', 'Ich glaube schon.'], ['Wat [denk] jij?', 'Was denkst du?']] }],
  ['houden', 'halten; houden van = lieben, mögen', 'houd', 'hield', 'hielden', 'gehouden', 'hebben', {
    alt: { ik: ['hou'], q_jij: ['hou'] },
    ex: [['Ik [hou] van koffie.', 'Ich liebe Kaffee.'], ['Zij [houdt] van muziek.', 'Sie liebt Musik.']] }],
  ['laten', 'lassen', 'laat', 'liet', 'lieten', 'gelaten', 'hebben', {
    ex: [['Ik [laat] het je zien.', 'Ich zeige es dir.'], ['Hij [laat] de hond uit.', 'Er führt den Hund aus.']] }],
  ['liggen', 'liegen', 'lig', 'lag', 'lagen', 'gelegen', 'hebben', {
    ex: [['Het boek [ligt] op tafel.', 'Das Buch liegt auf dem Tisch.'], ['Utrecht [ligt] in het midden van het land.', 'Utrecht liegt in der Mitte des Landes.']] }],
  ['zitten', 'sitzen', 'zit', 'zat', 'zaten', 'gezeten', 'hebben', {
    ex: [['Ik [zit] in de trein.', 'Ich sitze im Zug.'], ['Waar [zit] je?', 'Wo bist du gerade?']] }],
  ['lopen', 'gehen (zu Fuß), laufen', 'loop', 'liep', 'liepen', 'gelopen', 'hebben/zijn', {
    ex: [['Ik [loop] naar huis.', 'Ich gehe zu Fuß nach Hause.'], ['Hij [loopt] elke dag een uur.', 'Er geht jeden Tag eine Stunde spazieren.']] }],
  ['kijken', 'schauen', 'kijk', 'keek', 'keken', 'gekeken', 'hebben', {
    ex: [['Ik [kijk] tv.', 'Ich schaue fern.'], ['[Kijk] jij ook naar voetbal?', 'Schaust du auch Fußball?']] }],
  ['horen', 'hören', 'hoor', 'hoorde', 'hoorden', 'gehoord', 'hebben', {
    ex: [['Ik [hoor] je niet.', 'Ich höre dich nicht.'], ['[Hoor] je dat?', 'Hörst du das?']] }],
  ['eten', 'essen', 'eet', 'at', 'aten', 'gegeten', 'hebben', {
    ex: [['Wij [eten] om zes uur.', 'Wir essen um sechs Uhr.'], ['Wat [eet] jij graag?', 'Was isst du gern?']] }],
  ['drinken', 'trinken', 'drink', 'dronk', 'dronken', 'gedronken', 'hebben', {
    ex: [['Ik [drink] geen alcohol.', 'Ich trinke keinen Alkohol.'], ['Wat [drinkt] u?', 'Was trinken Sie?']] }],
  ['kopen', 'kaufen', 'koop', 'kocht', 'kochten', 'gekocht', 'hebben', {
    ex: [['Ik [koop] brood.', 'Ich kaufe Brot.'], ['Waar [koop] je dat?', 'Wo kaufst du das?']] }],
  ['betalen', 'bezahlen', 'betaal', 'betaalde', 'betaalden', 'betaald', 'hebben', {
    ex: [['Ik [betaal].', 'Ich zahle.'], ['[Betaalt] u contant of met pin?', 'Zahlen Sie bar oder mit Karte?']] }],
  ['praten', 'reden, sich unterhalten', 'praat', 'praatte', 'praatten', 'gepraat', 'hebben', {
    ex: [['Wij [praten] over het weer.', 'Wir reden über das Wetter.'], ['Hij [praat] veel.', 'Er redet viel.']] }],
  ['vragen', 'fragen', 'vraag', 'vroeg', 'vroegen', 'gevraagd', 'hebben', {
    ex: [['Ik [vraag] het even.', 'Ich frage mal kurz.'], ['Zij [vraagt] de weg.', 'Sie fragt nach dem Weg.']] }],
  ['beginnen', 'beginnen, anfangen', 'begin', 'begon', 'begonnen', 'begonnen', 'zijn', {
    ex: [['De les [begint] om negen uur.', 'Der Unterricht beginnt um neun Uhr.'], ['Wanneer [begin] je?', 'Wann fängst du an?']] }],
  ['blijven', 'bleiben', 'blijf', 'bleef', 'bleven', 'gebleven', 'zijn', {
    ex: [['Ik [blijf] thuis.', 'Ich bleibe zu Hause.'], ['Hoe lang [blijft] u?', 'Wie lange bleiben Sie?']] }],
  ['schrijven', 'schreiben', 'schrijf', 'schreef', 'schreven', 'geschreven', 'hebben', {
    ex: [['Ik [schrijf] een e-mail.', 'Ich schreibe eine E-Mail.'], ['Hoe [schrijf] je dat?', 'Wie schreibt man das?']] }],
  ['lezen', 'lesen', 'lees', 'las', 'lazen', 'gelezen', 'hebben', {
    ex: [['Ik [lees] de krant.', 'Ich lese die Zeitung.'], ['[Lees] jij graag?', 'Liest du gern?']] }],
  ['brengen', 'bringen', 'breng', 'bracht', 'brachten', 'gebracht', 'hebben', {
    ex: [['Ik [breng] de kinderen naar school.', 'Ich bringe die Kinder zur Schule.'], ['Wie [brengt] de wijn mee?', 'Wer bringt den Wein mit?']] }],
  ['leven', 'leben', 'leef', 'leefde', 'leefden', 'geleefd', 'hebben', {
    ex: [['Hij [leeft] nog.', 'Er lebt noch.'], ['Wij [leven] in een mooie tijd.', 'Wir leben in einer schönen Zeit.']] }],
  ['reizen', 'reisen', 'reis', 'reisde', 'reisden', 'gereisd', 'hebben/zijn', {
    ex: [['Wij [reizen] met de trein.', 'Wir reisen mit dem Zug.'], ['Ik [reis] graag.', 'Ich reise gern.']] }],
  ['slapen', 'schlafen', 'slaap', 'sliep', 'sliepen', 'geslapen', 'hebben', {
    ex: [['Ik [slaap] slecht.', 'Ich schlafe schlecht.'], ['[Slaap] je al?', 'Schläfst du schon?']] }],
  ['wachten', 'warten', 'wacht', 'wachtte', 'wachtten', 'gewacht', 'hebben', {
    ex: [['Ik [wacht] op de bus.', 'Ich warte auf den Bus.'], ['Hoe lang [wacht] u al?', 'Wie lange warten Sie schon?']] }],
  ['spelen', 'spielen', 'speel', 'speelde', 'speelden', 'gespeeld', 'hebben', {
    ex: [['De kinderen [spelen] buiten.', 'Die Kinder spielen draußen.'], ['[Speel] jij een instrument?', 'Spielst du ein Instrument?']] }],
  ['bellen', 'anrufen; klingeln (Falscher Freund!)', 'bel', 'belde', 'belden', 'gebeld', 'hebben', {
    ex: [['Ik [bel] je morgen.', 'Ich rufe dich morgen an.'], ['Wie [belt] er?', 'Wer ruft an?']] }],
  ['zoeken', 'suchen', 'zoek', 'zocht', 'zochten', 'gezocht', 'hebben', {
    ex: [['Ik [zoek] het station.', 'Ich suche den Bahnhof.'], ['Wat [zoekt] u?', 'Was suchen Sie?']] }],
  ['helpen', 'helfen', 'help', 'hielp', 'hielpen', 'geholpen', 'hebben', {
    ex: [['Ik [help] je.', 'Ich helfe dir.'], ['Wie [helpt] mij?', 'Wer hilft mir?']] }],
  ['rijden', 'fahren', 'rijd', 'reed', 'reden', 'gereden', 'hebben/zijn', {
    ex: [['Ik [rijd] naar Rotterdam.', 'Ich fahre nach Rotterdam.'], ['[Rijdt] deze bus naar het centrum?', 'Fährt dieser Bus ins Zentrum?']] }],
  ['koken', 'kochen', 'kook', 'kookte', 'kookten', 'gekookt', 'hebben', {
    ex: [['Vanavond [kook] ik.', 'Heute Abend koche ich.'], ['[Kook] jij graag?', 'Kochst du gern?']] }],
]

function present(inf, ik, o = {}) {
  // ga → gaat, sta → staat, sla → slaat (open syllable gets a double vowel)
  const base = /[^aeiou]a$/.test(ik) ? ik + 'a' : ik
  const t = base.endsWith('t') ? base : base + 't'
  const f = { ik, jij: t, u: t, hij: t, zij_sg: t, het: t, wij: inf, jullie: inf, zij_pl: inf, q_jij: ik }
  return { ...f, ...o }
}

const out = V.map(([inf, de, ik, ps, pp, part, aux, x = {}], i) => {
  const forms = present(inf, ik, x.o)
  for (const p of P) if (!forms[p]) throw new Error(`${inf}: missing ${p}`)
  for (const [nl] of x.ex ?? []) if (!/\[[^\]]+\]/.test(nl)) throw new Error(`${inf}: example without [form]: ${nl}`)
  return {
    id: inf,
    rank: i + 1,
    infinitive: inf,
    german: de,
    irregular: !!x.irr,
    present: forms,
    accepted: x.alt ?? {},
    past: { sg: ps, pl: pp },
    participle: part,
    aux,
    separable: false,
    examples: (x.ex ?? []).map(([nl, de]) => ({ nl, de })),
  }
})

writeFileSync(new URL('../content/verbs.json', import.meta.url), JSON.stringify(out, null, 1) + '\n')
console.log(`verbs.json: ${out.length} verbs`)
