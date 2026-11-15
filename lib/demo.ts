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
