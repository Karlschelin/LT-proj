# Prata – språkträning med AI

Öva språk i verkliga situationer (restaurang, vardagssnack, hobby, turistattraktion m.m.).
Samtalspartnern pratar naturligt och stannar i sin roll, och efter varje svar får du rättelser
och förklaringar på svenska.

## Funktioner
- **Idag:** dagens pass (repetitioner + nya glosor), dagar i rad, genvägar till samtal
- **Prata:** 8 situationer, partnern pratar naturligt och stannar i rollen; rättelser och
  förklaringar på svenska, mer naturliga alternativ, svarsförslag, översättning, uppläsning.
  Fel kan sparas som glosor ("Från samtal").
- **Glosor:** AI:n skapar glosbanker per språk, nivå och område (eller eget område), 20–100 ord,
  5–20 nya per dag. Repetition med FSRS (spaced repetition). Övningstyper: kort med
  självbedömning, flerval och skriv (förlåtande för accenter, men påpekar dem).
- **Framsteg:** glosor du kan/övar på, dagar i rad, träffsäkerhet, vanligaste feltyper.
- Allt sparas i mobilen (IndexedDB). Lägg appen på hemskärmen så att iPhone inte rensar datan.
- Demoläge utan API-nyckel.

## Kör på Vercel (från mobilen)
1. Logga in på vercel.com med GitHub → "Add New Project" → välj detta repo.
2. Lägg till miljövariabeln `ANTHROPIC_API_KEY` (från console.anthropic.com).
3. Deploy. Öppna länken i mobilen → "Lägg till på hemskärmen".

Samtalspartnern använder `claude-sonnet-5-5` som standard (ändra med `ANTHROPIC_MODEL`,
t.ex. `claude-haiku-5-5` för lägsta kostnad).

## Lokalt
```
npm install
cp .env.example .env.local   # fyll i nyckeln
npm run dev
```

## Nästa steg
- Steg 2: naturlig röst (OpenAI TTS, ev. ElevenLabs senare) + bättre taligenkänning
- Steg 3: uttalsbedömning per ord/ljud (Azure Pronunciation Assessment)
- Steg 4: framsteg, vanligaste fel, repetition
