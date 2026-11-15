import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "@/lib/prompt";
import { demoTurn } from "@/lib/demo";
import { LEVELS, getLanguage, getScenario } from "@/lib/scenarios";
import { TurnSchema, type ChatRequest } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.ANTHROPIC_MODEL || "claude-fable-5-2";

export async function POST(req: Request) {
  const body = (await req.json()) as ChatRequest;
  const lang = getLanguage(body.language);
  const level = LEVELS.find((l) => l.id === body.level);
  const scenario = getScenario(body.scenario);
  if (!lang || !level || !scenario) {
    return NextResponse.json({ error: "Okänt språk, nivå eller scenario." }, { status: 400 });
  }

  const lastUser = [...body.history].reverse().find((m) => m.role === "user");

  if (!process.env.ANTHROPIC_API_KEY) {
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json({ turn: demoTurn(lastUser?.text ?? null), demo: true });
  }

  // The conversation always opens with a "(start)" cue from the learner.
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: "(start)" }];
  for (const m of body.history) {
    messages.push({ role: m.role === "user" ? "user" : "assistant", content: m.text });
  }

  const client = new Anthropic();
  try {
    const response = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: buildSystemPrompt(lang, level, scenario),
      messages,
      output_config: { effort: "low", format: betaZodOutputFormat(TurnSchema) },
    });

    if (response.stop_reason === "refusal") {
      return NextResponse.json(
        { error: "Modellen ville inte svara på det här. Försök formulera om dig." },
        { status: 422 },
      );
    }
    if (!response.parsed_output) {
      return NextResponse.json({ error: "Kunde inte tolka svaret, försök igen." }, { status: 502 });
    }
    return NextResponse.json({ turn: response.parsed_output });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) {
      return NextResponse.json({ error: "Ogiltig API-nyckel." }, { status: 500 });
    } else if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "För många förfrågningar, vänta en stund." }, { status: 429 });
    } else if (error instanceof Anthropic.APIError) {
      console.error("Anthropic API error", error.status, error.message);
      return NextResponse.json({ error: `API-fel (${error.status}).` }, { status: 502 });
    }
    throw error;
  }
}
