# Prata – plan

Två delar i samma app: **Prata** (samtal med AI i situationer) och **Glosor** (effektiv
glosträning över flera dagar). De delar språk, nivå, design och framsteg, och matar varandra:
fel du gör i samtal kan sparas som glosor, och glosor du övar dyker upp i samtalen.

## Appens struktur (ny navigation)
Flikrad längst ned:
- **Idag** – dagens pass: glosor att repetera + nya, dagar i rad, fortsätt senaste samtal
- **Prata** – välj situation → samtal med rättning (det som finns idag)
- **Glosor** – dina glosbanker, skapa ny bank, starta övning
- **Framsteg** – ord lärda, dagar i rad, vanligaste fel

Språk och nivå väljs en gång (i sidhuvudet) och gäller i hela appen.

## Fas 1 – Ny design + grundstruktur
- Ny visuell identitet (se förhandsvisningen), flikrad, delad språk/nivå-väljare
- Lagring på enheten (IndexedDB) för glosor, framsteg och samtal, så att allt finns kvar dag till dag
- Samtalsdelen flyttas in i nya designen oförändrad i funktion

## Fas 2 – Glosor (MVP)
**Skapa glosbank:** språk, nivå (A1–C1), område (t.ex. Mat & restaurang, Resor, Jobb & kontor,
Vård, Hem & vardag, Shopping, Natur & väder, Känslor, IT, Fritid – eller eget område i fritext),
antal glosor (20/40/60/100) och nya per dag (5/10/15/20).
- AI (Claude Sonnet 5.5) genererar listan en gång: ord, översättning, genus/artikel, ordklass,
  exempelmening + översättning. Strukturerad JSON, sparas på enheten. Kostnad: någon krona per bank.
- Rätt nivå: instruktion om frekventa ord för nivån, inga dubbletter mot dina befintliga glosor.

**Repetitionsschema (spaced repetition):** algoritmen FSRS (samma idé som Anki, modernare).
Varje glosa får ett nästa-datum utifrån hur lätt du hade den. Dagens pass = förfallna
repetitioner + dagens nya (enligt ditt val). Missar du en dag skjuts inget bort – passet blir bara
lite större, med ett tak så att det aldrig blir överväldigande.

**Övningstyper** (blandas automatiskt, svårare ju bättre du kan ordet):
1. Kort: se ordet → vänd → bedöm själv (Igen / Svårt / Bra / Lätt)
2. Flerval: välj rätt översättning av fyra
3. Skriv: skriv ordet på målspråket (förlåtande för accenter, men påpekar dem)
4. Lyssna: hör ordet och skriv det (kommer med röst i fas 4)

## Fas 3 – Koppla ihop delarna
- "Spara som glosa" på varje rättelse i samtalen → hamnar i banken "Från samtal"
- Samtal kan väljas "med mina glosor": AI:n använder ord du övar på, och de markeras i chatten
- Idag-fliken föreslår ett samtal som passar glosorna du just övat

## Fas 4 – Röst (tidigare steg 2)
- OpenAI gpt-4o-mini-tts för naturlig uppläsning (samtal + glosor), cachas per glosa
- Taligenkänning (OpenAI) och ett läge där du pratar i stället för att skriva
- Rösttjänsten hålls utbytbar (ElevenLabs senare om det behövs)

## Fas 5 – Uttal (tidigare steg 3)
- Azure Pronunciation Assessment: poäng per ord och ljud, lyssna på rätt uttal, försök igen
- Uttalsövning på glosor och på meningar från samtalen

## Fas 6 – Framsteg, konto och synk (tidigare steg 4)
- Statistik: ord lärda, tid, dagar i rad, vanligaste feltyper
- Inloggning + molnsynk (t.ex. Supabase) så att framsteg följer med mellan enheter
- PWA offline-läge för glosträning, påminnelse om dagens pass

## Tekniska val
| Område | Val |
|---|---|
| Ramverk | Next.js (som nu), PWA |
| Samtals-AI | Claude Sonnet 5.5 (byts via `ANTHROPIC_MODEL`) |
| Glosgenerering | Claude Sonnet 5.5, strukturerad output |
| Lagring | IndexedDB på enheten (fas 1–5), molnsynk i fas 6 |
| Repetition | FSRS |
| Röst | OpenAI TTS/STT |
| Uttal | Azure Speech |

## Ungefärlig löpande kostnad (10–15 min/dag)
Samtal ~7–10 USD/mån, röst ~3–6 USD/mån, glosor < 1 USD/mån.
