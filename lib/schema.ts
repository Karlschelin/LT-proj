import { z } from "zod";

export const TurnSchema = z.object({
  /** The partner's next line, in the target language. */
  reply: z.string(),
  /** Swedish translation of `reply`. */
  reply_translation: z.string(),
  /** Feedback on the learner's LAST message. */
  feedback: z.object({
    status: z.enum(["none", "perfect", "minor", "errors"]),
    /** The learner's message rewritten correctly and naturally. Empty if status is none. */
    corrected: z.string(),
    /** A more natural / native way to say it, if different from `corrected`. Else empty. */
    natural_alternative: z.string(),
    errors: z.array(
      z.object({
        original: z.string(),
        correction: z.string(),
        type: z.enum(["grammatik", "ordval", "stavning", "ordföljd", "artighet", "uttryck"]),
        explanation: z.string(),
        /** Dictionary form of the word/phrase worth saving as a flashcard from this error. Empty strings if none. */
        word: z.object({ word: z.string(), translation: z.string(), tag: z.string() }),
      }),
    ),
    /** Short encouraging note or tip in Swedish. */
    tip: z.string(),
  }),
  /** 3 things the learner could say next, with Swedish meaning. */
  suggestions: z.array(z.object({ text: z.string(), meaning: z.string() })),
});

export type Turn = z.infer<typeof TurnSchema>;

export type ChatMessage =
  | { role: "user"; text: string; feedback?: Turn["feedback"] }
  | { role: "partner"; text: string; translation: string; suggestions: Turn["suggestions"] };

export type ChatRequest = {
  language: string;
  level: string;
  scenario: string;
  history: { role: "user" | "partner"; text: string }[];
};

export const WORD_TAGS = ["mask.", "fem.", "neutr.", "verb", "adj.", "adv.", "fras", "annat"] as const;

export const VocabSchema = z.object({
  words: z.array(
    z.object({
      /** Target-language word with article where the language uses one, e.g. "la cuenta". */
      word: z.string(),
      /** Swedish translation. */
      translation: z.string(),
      tag: z.enum(WORD_TAGS),
      /** Short, natural example sentence in the target language using the word. */
      example: z.string(),
      example_translation: z.string(),
    }),
  ),
});
export type Vocab = z.infer<typeof VocabSchema>;

export type VocabRequest = {
  language: string;
  level: string;
  area: string;
  count: number;
  /** Words the learner already has in this language, to avoid duplicates. */
  existing: string[];
};
