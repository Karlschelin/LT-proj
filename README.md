# Prata – språkträning med AI

Öva språk i verkliga situationer (restaurang, vardagssnack, hobby, turistattraktion m.m.).
Samtalspartnern pratar naturligt och stannar i sin roll, och efter varje svar får du rättelser
och förklaringar på svenska.

## Steg 1 (klart)
- Välj språk, nivå (A1–C1) och situation
- Chatt där partnern pratar som en riktig person
- Rättelser på svenska: korrekt mening, varje fel med förklaring, "mer naturligt"-alternativ, tips
- Förslag på vad du kan säga härnäst
- Översättning per meddelande, uppläsning (webbläsarens röst), långsamt tal, mikrofon (där webbläsaren stöder det)
- Demoläge utan API-nyckel

## Kör på Vercel (från mobilen)
1. Logga in på vercel.com med GitHub → "Add New Project" → välj detta repo.
2. Lägg till miljövariabeln `ANTHROPIC_API_KEY` (från console.anthropic.com).
3. Deploy. Öppna länken i mobilen → "Lägg till på hemskärmen".

Modell: `claude-fable-5-2` som standard (ändra med `ANTHROPIC_MODEL`).

## Lokalt
```
npm install
cp .env.example .env.local   # fyll i nyckeln
npm run dev
```

## Nästa steg
- Steg 2: naturlig röst (ElevenLabs/OpenAI TTS) + bättre taligenkänning
- Steg 3: uttalsbedömning per ord/ljud (Azure Pronunciation Assessment)
- Steg 4: framsteg, vanligaste fel, repetition
