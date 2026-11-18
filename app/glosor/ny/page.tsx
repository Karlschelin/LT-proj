"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LangPill, LangSheet } from "@/components/AppShell";
import { addDeck, uid, useDB, type WordCard } from "@/lib/db";
import { decksFor, newSrs } from "@/lib/srs";
import type { Vocab } from "@/lib/schema";

const AREAS = [
  "Mat & restaurang",
  "Resor & transport",
  "Jobb & kontor",
  "Vård & hälsa",
  "Hem & vardag",
  "Shopping",
  "Natur & väder",
  "Känslor & relationer",
  "IT & teknik",
  "Fritid & sport",
];

export default function NewDeckPage() {
  const db = useDB();
  const router = useRouter();
  const [area, setArea] = useState(AREAS[0]);
  const [custom, setCustom] = useState("");
  const [total, setTotal] = useState(40);
  const [perDay, setPerDay] = useState(10);
  const [sheet, setSheet] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!db) return <div className="loading-page">Laddar…</div>;

  const name = custom.trim() || area;
  const days = Math.ceil(total / perDay);

  async function create() {
    if (!db || busy) return;
    setBusy(true);
    setError(null);
    const language = db.settings.language;
    const ids = new Set(decksFor(db, language).map((d) => d.id));
    const existing = db.cards.filter((c) => ids.has(c.deckId)).map((c) => c.word);
    try {
      const res = await fetch("/api/vocab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, level: db.settings.level, area: name, count: total, existing }),
      });
      const data = (await res.json()) as { words?: Vocab["words"]; error?: string };
      if (!res.ok || !data.words?.length) throw new Error(data.error ?? "Inga glosor kom tillbaka. Försök igen.");
      const deckId = uid();
      const cards: WordCard[] = data.words.map((w) => ({
        id: uid(),
        deckId,
        word: w.word,
        translation: w.translation,
        tag: w.tag,
        example: w.example,
        exampleTranslation: w.example_translation,
        srs: newSrs(),
      }));
      addDeck(
        {
          id: deckId,
          name,
          language,
          level: db.settings.level,
          perDay,
          createdAt: new Date().toISOString(),
          source: "ai",
        },
        cards,
      );
      router.push("/glosor");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Något gick fel.");
      setBusy(false);
    }
  }

  return (
    <div className="shell">
      <section className="view pad" style={{ paddingBottom: 40 }}>
        <div className="study-top" style={{ paddingTop: 12 }}>
          <button className="icon-btn" onClick={() => router.back()} aria-label="Tillbaka">
            ←
          </button>
          <h2 style={{ fontSize: 22 }}>Ny glosbank</h2>
        </div>

        <div className="field">
          <div className="field-label">Språk och nivå</div>
          <div>
            <LangPill onClick={() => setSheet(true)} />
          </div>
        </div>

        <div className="field">
          <div className="field-label">Område</div>
          <div className="chips">
            {AREAS.map((a) => (
              <button key={a} className="chip" aria-pressed={area === a && !custom.trim()} onClick={() => { setArea(a); setCustom(""); }}>
                {a}
              </button>
            ))}
          </div>
          <input
            id="custom-area"
            className="text-input"
            placeholder="Eller skriv eget, t.ex. ”fotboll” eller ”byggbranschen”"
            value={custom}
            maxLength={80}
            onChange={(e) => setCustom(e.target.value)}
          />
        </div>

        <div className="field">
          <div className="field-label">Antal glosor</div>
          <div className="seg">
            {[20, 40, 60, 100].map((n) => (
              <button key={n} aria-pressed={total === n} onClick={() => setTotal(n)}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">Nya per dag</div>
          <div className="seg">
            {[5, 10, 15, 20].map((n) => (
              <button key={n} aria-pressed={perDay === n} onClick={() => setPerDay(n)}>
                {n}
              </button>
            ))}
          </div>
          <div className="field-hint">Repetitioner kommer utöver de nya, med allt längre mellanrum när du kan orden.</div>
        </div>

        <div className="estimate">
          Du har gått igenom alla nya ord efter <b>{days} {days === 1 ? "dag" : "dagar"}</b>, med ungefär{" "}
          <b>{Math.round(perDay * 0.6 + 4)} min</b> per dag. Sedan repeteras de allt glesare tills de sitter.
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button className="btn btn-primary btn-block" onClick={create} disabled={busy}>
          {busy ? (
            <>
              <span className="spinner" /> AI:n skapar dina glosor…
            </>
          ) : (
            `Skapa ${total} glosor om ${name.toLowerCase()}`
          )}
        </button>
        {busy && <p className="field-hint" style={{ textAlign: "center" }}>Det tar oftast 10–40 sekunder.</p>}
      </section>
      <LangSheet open={sheet} onClose={() => setSheet(false)} />
    </div>
  );
}
