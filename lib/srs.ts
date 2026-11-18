import { createEmptyCard, fsrs, generatorParameters, Rating, State, type Card, type Grade } from "ts-fsrs";
import { dayKey, type DB, type DayStats, type Deck, type WordCard } from "./db";

export { Rating, State };
export type { Grade };

export const scheduler = fsrs(generatorParameters({ enable_fuzz: true }));

export const newSrs = () => createEmptyCard(new Date());

export type Mode = "flip" | "choice" | "write";
export type QueueItem = { cardId: string; mode: Mode };

const MAX_REVIEWS_PER_DAY = 150;

export function decksFor(db: DB, language: string) {
  return db.decks.filter((d) => d.language === language);
}

function introducedToday(db: DB, deck: Deck) {
  const today = dayKey();
  return db.cards.filter((c) => c.deckId === deck.id && c.introducedOn === today).length;
}

/** Cards due for review now, and new cards still allowed today, for the given decks. */
export function dueCards(db: DB, language: string, deckId?: string) {
  const now = Date.now();
  const decks = decksFor(db, language).filter((d) => !deckId || d.id === deckId);
  const ids = new Set(decks.map((d) => d.id));
  const reviews = db.cards
    .filter((c) => ids.has(c.deckId) && c.srs.state !== State.New && new Date(c.srs.due).getTime() <= now)
    .sort((a, b) => new Date(a.srs.due).getTime() - new Date(b.srs.due).getTime())
    .slice(0, MAX_REVIEWS_PER_DAY);
  const fresh: WordCard[] = [];
  for (const deck of decks) {
    const left = Math.max(0, deck.perDay - introducedToday(db, deck));
    fresh.push(...db.cards.filter((c) => c.deckId === deck.id && c.srs.state === State.New).slice(0, left));
  }
  return { reviews, fresh };
}

export function modeFor(card: WordCard, poolSize: number): Mode {
  if (card.srs.state === State.New) return "flip";
  if (poolSize < 4) return card.srs.scheduled_days >= 4 ? "write" : "flip";
  if (card.srs.state === State.Learning || card.srs.state === State.Relearning) return "choice";
  return card.srs.scheduled_days < 4 ? "choice" : "write";
}

/** Builds today's session: reviews first, new cards spread through it. */
export function buildQueue(db: DB, language: string, deckId?: string): QueueItem[] {
  const { reviews, fresh } = dueCards(db, language, deckId);
  const pool = db.cards.filter((c) => decksFor(db, language).some((d) => d.id === c.deckId)).length;
  const items: QueueItem[] = [];
  const r = reviews.map((c) => ({ cardId: c.id, mode: modeFor(c, pool) }));
  const f = fresh.map((c) => ({ cardId: c.id, mode: "flip" as Mode }));
  // Interleave: one new card after every two reviews.
  while (r.length || f.length) {
    if (r.length) items.push(r.shift()!);
    if (r.length) items.push(r.shift()!);
    if (f.length) items.push(f.shift()!);
  }
  return items;
}

export function formatInterval(due: Date, now = new Date()) {
  const min = Math.round((due.getTime() - now.getTime()) / 60000);
  if (min < 1) return "<1 min";
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d < 31) return d === 1 ? "1 dag" : `${d} dagar`;
  const m = Math.round(d / 30);
  return m === 1 ? "1 mån" : `${m} mån`;
}

export function previewIntervals(card: Card) {
  const now = new Date();
  const p = scheduler.repeat(card, now);
  return {
    [Rating.Again]: formatInterval(p[Rating.Again].card.due, now),
    [Rating.Hard]: formatInterval(p[Rating.Hard].card.due, now),
    [Rating.Good]: formatInterval(p[Rating.Good].card.due, now),
    [Rating.Easy]: formatInterval(p[Rating.Easy].card.due, now),
  } as Record<Grade, string>;
}

export function grade(card: Card, rating: Grade) {
  return scheduler.next(card, new Date(), rating).card;
}

// ---------- Answer checking ----------

const ARTICLES = /^(el|la|los|las|un|una|unos|unas|le|les|l'|une|des|il|lo|gli|i|der|die|das|ein|eine|the|a|an|o|os|as|um|uma)\s+/;

function norm(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[¿?¡!.,;:]/g, "")
    .replace(/\s+/g, " ");
}
const noAccents = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");
const noArticle = (s: string) => s.replace(ARTICLES, "");

function levenshtein(a: string, b: string) {
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}

export type Verdict = "right" | "near" | "wrong";

/** Exact (ignoring article/punctuation) → right; only accents or one typo off → near. */
export function checkAnswer(input: string, target: string): Verdict {
  const a = norm(input);
  const b = norm(target);
  if (!a) return "wrong";
  if (a === b || noArticle(a) === noArticle(b)) return "right";
  const a2 = noArticle(noAccents(a));
  const b2 = noArticle(noAccents(b));
  if (a2 === b2) return "near";
  if (b2.length >= 5 && levenshtein(a2, b2) <= 1) return "near";
  return "wrong";
}

// ---------- Progress ----------

export function progress(cards: WordCard[]) {
  let fresh = 0;
  let learning = 0;
  let known = 0;
  for (const c of cards) {
    if (c.srs.state === State.New) fresh++;
    else if (c.srs.state === State.Review && c.srs.scheduled_days >= 7) known++;
    else learning++;
  }
  return { fresh, learning, known };
}

const active = (d?: DayStats) => !!d && (d.reviews > 0 || d.chatTurns > 0);

export function streak(days: Record<string, DayStats>) {
  const d = new Date();
  if (!active(days[dayKey(d)])) d.setDate(d.getDate() - 1);
  let n = 0;
  while (active(days[dayKey(d)])) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

/** Monday-first activity for the current week. */
export function thisWeek(days: Record<string, DayStats>) {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return ["M", "T", "O", "T", "F", "L", "S"].map((label, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    const key = dayKey(d);
    return { label, done: active(days[key]), isToday: key === dayKey(today), future: d > today };
  });
}
