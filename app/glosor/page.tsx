"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell, useDue } from "@/components/AppShell";
import { deleteDeck, useDB } from "@/lib/db";
import { getLanguage } from "@/lib/scenarios";
import { decksFor, dueCards, progress } from "@/lib/srs";

export default function GlosorPage() {
  return (
    <AppShell>
      <Glosor />
    </AppShell>
  );
}

function Glosor() {
  const db = useDB()!;
  const due = useDue(db);
  const decks = decksFor(db, db.settings.language);
  const lang = getLanguage(db.settings.language);
  const [confirm, setConfirm] = useState<string | null>(null);

  return (
    <section className="view pad">
      <div className="section-head">
        <h1 className="title-xl">Glosor</h1>
        <Link href="/glosor/ny" className="btn btn-primary">
          + Ny
        </Link>
      </div>

      {decks.length === 0 ? (
        <div className="panel empty">
          <h3>Inga glosor på {lang?.name.toLowerCase()} än</h3>
          <p>Skapa en glosbank för ett område du vill kunna, t.ex. mat, resor eller jobb.</p>
          <Link href="/glosor/ny" className="btn btn-primary">
            Skapa glosbank
          </Link>
        </div>
      ) : (
        <>
          {due.total > 0 && (
            <Link href="/glosor/ova" className="btn btn-ghost btn-block">
              Öva alla {due.total} som väntar
            </Link>
          )}
          <div className="list">
            {decks.map((d) => {
              const cards = db.cards.filter((c) => c.deckId === d.id);
              const p = progress(cards);
              const dd = dueCards(db, db.settings.language, d.id);
              const n = dd.reviews.length + dd.fresh.length;
              const total = cards.length || 1;
              return (
                <article key={d.id} className="deck">
                  <div className="deck-top">
                    <div>
                      <h3>{d.name}</h3>
                      <div className="meta">
                        {cards.length} glosor · {d.level}
                        {d.source === "chat" ? " · sparade från samtal" : ` · ${d.perDay} nya/dag`}
                      </div>
                    </div>
                    <span className={`due ${n ? "" : "none"}`}>{n ? `${n} idag` : "Klar för idag"}</span>
                  </div>
                  <div className="bar">
                    <i className="learned" style={{ width: `${(p.known / total) * 100}%` }} />
                    <i className="learning" style={{ width: `${(p.learning / total) * 100}%` }} />
                  </div>
                  <div className="legend">
                    <span style={{ ["--c" as string]: "var(--ok)" }}>{p.known} kan du</span>
                    <span style={{ ["--c" as string]: "var(--brand)" }}>{p.learning} övar</span>
                    <span style={{ ["--c" as string]: "var(--surface-2)" }}>{p.fresh} nya</span>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {n > 0 && (
                      <Link href={`/glosor/ova?deck=${d.id}`} className="btn btn-ghost" style={{ flex: 1 }}>
                        Öva
                      </Link>
                    )}
                    {confirm === d.id ? (
                      <>
                        <button className="btn btn-ghost danger" onClick={() => deleteDeck(d.id)}>
                          Ja, ta bort
                        </button>
                        <button className="btn btn-ghost" onClick={() => setConfirm(null)}>
                          Avbryt
                        </button>
                      </>
                    ) : (
                      <button className="mini" onClick={() => setConfirm(d.id)} aria-label={`Ta bort ${d.name}`}>
                        Ta bort
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
