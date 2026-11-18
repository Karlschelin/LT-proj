"use client";

import { get, set } from "idb-keyval";
import { useSyncExternalStore } from "react";
import type { Card } from "ts-fsrs";

/** Everything the app remembers lives on the device, in IndexedDB. */

export type Settings = { language: string; level: string; lastScenario?: string };

export type Deck = {
  id: string;
  name: string;
  language: string;
  level: string;
  perDay: number;
  createdAt: string;
  source: "ai" | "chat";
};

export type WordCard = {
  id: string;
  deckId: string;
  word: string;
  translation: string;
  /** e.g. "mask.", "fem.", "verb" */
  tag: string;
  example: string;
  exampleTranslation: string;
  srs: Card;
  /** Local date (YYYY-MM-DD) when the card was first studied. */
  introducedOn?: string;
};

export type DayStats = { reviews: number; newCards: number; correct: number; chatTurns: number };

export type DB = {
  version: 1;
  settings: Settings;
  decks: Deck[];
  cards: WordCard[];
  days: Record<string, DayStats>;
  errorTypes: Record<string, number>;
  chats: number;
};

const KEY = "prata-db";

const empty = (): DB => ({
  version: 1,
  settings: { language: "es-ES", level: "A2" },
  decks: [],
  cards: [],
  days: {},
  errorTypes: {},
  chats: 0,
});

let state: DB | null = null;
let loading: Promise<void> | null = null;
const listeners = new Set<() => void>();
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function emit() {
  for (const l of listeners) l();
}

function load() {
  if (loading) return loading;
  loading = (async () => {
    try {
      const stored = (await get(KEY)) as DB | undefined;
      state = stored ? { ...empty(), ...stored } : empty();
    } catch {
      state = empty();
    }
    try {
      // Ask the browser not to evict our data under storage pressure.
      await navigator.storage?.persist?.();
    } catch {}
    emit();
  })();
  return loading;
}

function flush() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = null;
  if (state) set(KEY, state).catch(() => {});
}

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(flush, 150);
}

if (typeof window !== "undefined") {
  // Never lose the last change when the app is closed or backgrounded.
  window.addEventListener("pagehide", () => saveTimer && flush());
  document.addEventListener("visibilitychange", () => document.visibilityState === "hidden" && saveTimer && flush());
}

/** Apply a change to the database (immutably) and persist it. */
export function update(fn: (db: DB) => DB) {
  if (!state) return;
  state = fn(state);
  scheduleSave();
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  void load();
  return () => listeners.delete(l);
}

/** Returns the database, or null while it is loading. */
export function useDB(): DB | null {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => null,
  );
}

export function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function dayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function bumpDay(db: DB, patch: Partial<DayStats>): DB {
  const key = dayKey();
  const cur = db.days[key] ?? { reviews: 0, newCards: 0, correct: 0, chatTurns: 0 };
  const next: DayStats = {
    reviews: cur.reviews + (patch.reviews ?? 0),
    newCards: cur.newCards + (patch.newCards ?? 0),
    correct: cur.correct + (patch.correct ?? 0),
    chatTurns: cur.chatTurns + (patch.chatTurns ?? 0),
  };
  return { ...db, days: { ...db.days, [key]: next } };
}

// ---------- Mutations ----------

export function setSettings(patch: Partial<Settings>) {
  update((db) => ({ ...db, settings: { ...db.settings, ...patch } }));
}

export function addDeck(deck: Deck, cards: WordCard[]) {
  update((db) => ({ ...db, decks: [deck, ...db.decks], cards: [...db.cards, ...cards] }));
}

export function deleteDeck(deckId: string) {
  update((db) => ({
    ...db,
    decks: db.decks.filter((d) => d.id !== deckId),
    cards: db.cards.filter((c) => c.deckId !== deckId),
  }));
}

export function recordReview(cardId: string, srs: Card, correct: boolean) {
  update((db) => {
    let wasNew = false;
    const cards = db.cards.map((c) => {
      if (c.id !== cardId) return c;
      wasNew = !c.introducedOn;
      return { ...c, srs, introducedOn: c.introducedOn ?? dayKey() };
    });
    return bumpDay({ ...db, cards }, { reviews: 1, newCards: wasNew ? 1 : 0, correct: correct ? 1 : 0 });
  });
}

export function recordChatStart(scenario: string) {
  update((db) => ({ ...db, chats: db.chats + 1, settings: { ...db.settings, lastScenario: scenario } }));
}

export function recordChatTurn(errorTypes: string[]) {
  update((db) => {
    const counts = { ...db.errorTypes };
    for (const t of errorTypes) counts[t] = (counts[t] ?? 0) + 1;
    return bumpDay({ ...db, errorTypes: counts }, { chatTurns: 1 });
  });
}

/** Adds a word to the per-language "Från samtal" deck, creating it if needed. */
export function saveChatWord(
  language: string,
  level: string,
  word: Omit<WordCard, "id" | "deckId" | "srs" | "introducedOn">,
  srs: Card,
) {
  update((db) => {
    let deck = db.decks.find((d) => d.source === "chat" && d.language === language);
    let decks = db.decks;
    if (!deck) {
      deck = {
        id: uid(),
        name: "Från samtal",
        language,
        level,
        perDay: 10,
        createdAt: new Date().toISOString(),
        source: "chat",
      };
      decks = [...decks, deck];
    }
    const exists = db.cards.some(
      (c) => c.deckId === deck!.id && c.word.toLowerCase() === word.word.toLowerCase(),
    );
    if (exists) return { ...db, decks };
    return { ...db, decks, cards: [...db.cards, { ...word, id: uid(), deckId: deck.id, srs }] };
  });
}
