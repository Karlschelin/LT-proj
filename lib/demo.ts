import type { Turn } from "./schema";

/**
 * Canned responses used when no ANTHROPIC_API_KEY is configured,
 * so the interface can be previewed without an API key.
 */
export function demoTurn(userText: string | null): Turn {
  if (userText === null) {
    return {
      reply: "¡Buenas tardes! Bienvenido. ¿Mesa para uno? Aquí tiene la carta. ¿Le traigo algo de beber mientras mira?",
      reply_translation:
        "God eftermiddag! Välkommen. Bord för en? Här är menyn. Får jag ta med något att dricka medan du tittar?",
      feedback: { status: "none", corrected: "", natural_alternative: "", errors: [], tip: "" },
      suggestions: [
        { text: "Sí, una mesa para uno, por favor.", meaning: "Ja, ett bord för en, tack." },
        { text: "¿Qué me recomienda?", meaning: "Vad rekommenderar du?" },
        { text: "Una copa de vino tinto, por favor.", meaning: "Ett glas rött vin, tack." },
      ],
    };
  }
  return {
    reply: "¡Perfecto! Hoy le recomiendo la paella de marisco, está buenísima. ¿Y para beber, qué le pongo?",
    reply_translation:
      "Perfekt! Idag rekommenderar jag skaldjurspaellan, den är jättegod. Och vad vill du ha att dricka?",
    feedback: {
      status: "errors",
      corrected: "Quiero una mesa para uno, por favor.",
      natural_alternative: "Una mesa para uno, por favor.",
      errors: [
        {
          original: "Yo quiero un mesa",
          correction: "Quiero una mesa",
          type: "grammatik",
          explanation:
            "\"Mesa\" är femininum på spanska, så det heter \"una mesa\". Man brukar också skippa \"yo\" eftersom verbformen \"quiero\" redan visar vem som pratar.",
          word: { word: "la mesa", translation: "bordet", tag: "fem." },
        },
      ],
      tip: "Bra jobbat! I restauranger låter det ännu mer naturligt att bara säga \"Una mesa para uno, por favor.\"",
    },
    suggestions: [
      { text: "Un agua con gas, por favor.", meaning: "Ett mineralvatten, tack." },
      { text: "¿La paella lleva gluten?", meaning: "Innehåller paellan gluten?" },
      { text: "Mejor una cerveza, gracias.", meaning: "Hellre en öl, tack." },
    ],
  };
}

const DEMO_WORDS: [string, string, string, string, string][] = [
  ["la cuenta", "notan", "fem.", "¿Nos trae la cuenta, por favor?", "Kan du ta notan, tack?"],
  ["el camarero", "servitören", "mask.", "El camarero nos recomendó el vino de la casa.", "Servitören rekommenderade husets vin."],
  ["la propina", "dricksen", "fem.", "Dejamos una propina del diez por ciento.", "Vi lämnade tio procent i dricks."],
  ["pedir", "att beställa", "verb", "¿Ya sabéis qué vais a pedir?", "Vet ni redan vad ni ska beställa?"],
  ["el postre", "efterrätten", "mask.", "De postre tenemos flan casero.", "Till efterrätt har vi hemgjord flan."],
  ["la carta", "menyn", "fem.", "¿Me deja ver la carta?", "Får jag titta på menyn?"],
  ["la reserva", "bokningen", "fem.", "Tengo una reserva a las nueve.", "Jag har en bokning klockan nio."],
  ["el plato", "rätten / tallriken", "mask.", "Este plato es típico de Valencia.", "Den här rätten är typisk för Valencia."],
  ["picante", "stark (kryddig)", "adj.", "¿La salsa es muy picante?", "Är såsen väldigt stark?"],
  ["recomendar", "att rekommendera", "verb", "¿Qué nos recomienda?", "Vad rekommenderar du?"],
  ["la bebida", "drycken", "fem.", "Las bebidas no están incluidas.", "Dryckerna ingår inte."],
  ["el vaso", "glaset", "mask.", "¿Me trae un vaso de agua?", "Kan du ta med ett glas vatten?"],
  ["sin gluten", "glutenfri", "fras", "¿Tienen pan sin gluten?", "Har ni glutenfritt bröd?"],
  ["el primer plato", "förrätten", "mask.", "De primer plato quiero la ensalada.", "Till förrätt vill jag ha salladen."],
  ["estar rico", "att vara gott", "fras", "¡Todo estaba muy rico!", "Allt var jättegott!"],
  ["la mesa", "bordet", "fem.", "¿Tienen una mesa para dos?", "Har ni ett bord för två?"],
  ["pagar con tarjeta", "att betala med kort", "fras", "¿Puedo pagar con tarjeta?", "Kan jag betala med kort?"],
  ["el aceite", "oljan", "mask.", "Pásame el aceite, por favor.", "Skicka oljan, tack."],
  ["la cocina", "köket", "fem.", "La cocina cierra a las once.", "Köket stänger klockan elva."],
  ["probar", "att smaka / prova", "verb", "Tienes que probar las croquetas.", "Du måste smaka kroketterna."],
];

export function demoVocab(count: number, existing: string[]) {
  const have = new Set(existing.map((w) => w.toLowerCase()));
  return DEMO_WORDS.filter(([w]) => !have.has(w.toLowerCase()))
    .slice(0, count)
    .map(([word, translation, tag, example, example_translation]) => ({ word, translation, tag, example, example_translation }));
}
