import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { apiErrorMessage, FALLBACK_PARAMS, hasKey, MODEL } from "@/lib/claude";
import { demoVocab } from "@/lib/demo";
import { buildVocabPrompt } from "@/lib/prompt";
import { getLanguage, LEVELS } from "@/lib/scenarios";
import { VocabSchema, type VocabRequest } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  const body = (await req.json()) as VocabRequest;
  const lang = getLanguage(body.language);
  const level = LEVELS.find((l) => l.id === body.level);
  const area = String(body.area ?? "").trim().slice(0, 80);
  const count = Math.min(100, Math.max(5, Math.round(Number(body.count) || 20)));
  const existing = (body.existing ?? []).slice(-300).map((w) => String(w).slice(0, 60));
  if (!lang || !level || !area) {
    return NextResponse.json({ error: "Välj språk, nivå och område." }, { status: 400 });
  }

  if (!hasKey()) {
    await new Promise((r) => setTimeout(r, 900));
    return NextResponse.json({ words: demoVocab(count, existing), demo: true });
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      ...FALLBACK_PARAMS,
      messages: [
        {
          role: "user",
          content: buildVocabPrompt(lang.nativeName, lang.code, level.id, area, count, existing),
        },
      ],
      output_config: { effort: "low", format: betaZodOutputFormat(VocabSchema) },
    });
    if (response.stop_reason === "refusal") {
      return NextResponse.json({ error: "Det gick inte att skapa glosor för det området. Prova ett annat." }, { status: 422 });
    }
    if (!response.parsed_output) {
      return NextResponse.json({ error: "Kunde inte tolka glosorna, försök igen." }, { status: 502 });
    }
    const seen = new Set(existing.map((w) => w.toLowerCase()));
    const words = response.parsed_output.words.filter((w) => {
      const k = w.word.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return NextResponse.json({ words });
  } catch (error) {
    const e = apiErrorMessage(error);
    if (e) return NextResponse.json({ error: e.message }, { status: e.status });
    throw error;
  }
}
