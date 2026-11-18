import Anthropic from "@anthropic-ai/sdk";

/** The in-app model. Cheaper than the model used to develop the app; override with ANTHROPIC_MODEL. */
export const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
/** Server-side refusal fallbacks are not available on Haiku models. */
export const FALLBACK_PARAMS = MODEL.includes("haiku")
  ? {}
  : { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const };

export const hasKey = () => !!process.env.ANTHROPIC_API_KEY;

export function apiErrorMessage(error: unknown): { message: string; status: number } | null {
  if (error instanceof Anthropic.AuthenticationError) return { message: "Ogiltig API-nyckel.", status: 500 };
  if (error instanceof Anthropic.RateLimitError) return { message: "För många förfrågningar, vänta en stund.", status: 429 };
  if (error instanceof Anthropic.APIError) {
    console.error("Anthropic API error", error.status, error.message);
    return { message: `API-fel (${error.status}). Försök igen.`, status: 502 };
  }
  return null;
}
