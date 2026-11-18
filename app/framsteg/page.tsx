"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useDB } from "@/lib/db";
import { getLanguage } from "@/lib/scenarios";
import { decksFor, progress, streak } from "@/lib/srs";

export default function FramstegPage() {
  return (
    <AppShell>
      <Framsteg />
    </AppShell>
  );
}

function Framsteg() {
  const db = useDB()!;
  const lang = getLanguage(db.settings.language);
  const deckIds = new Set(decksFor(db, db.settings.language).map((d) => d.id));
  const p = progress(db.cards.filter((c) => deckIds.has(c.deckId)));
  const totals = Object.values(db.days).reduce(
    (a, d) => ({ reviews: a.reviews + d.reviews, correct: a.correct + d.correct, turns: a.turns + d.chatTurns }),
    { reviews: 0, correct: 0, turns: 0 },
  );
  const errSum = Object.values(db.errorTypes).reduce((a, b) => a + b, 0);
  const errs = Object.entries(db.errorTypes).sort((a, b) => b[1] - a[1]);
  const days = streak(db.days);

  return (
    <section className="view pad">
      <h1 className="title-xl">Framsteg</h1>
      <div className="stat-grid">
        <div className="stat">
          <b>{p.known}</b>
          <span>glosor du kan ({lang?.name.toLowerCase()})</span>
        </div>
        <div className="stat">
          <b>{p.learning}</b>
          <span>glosor du övar på</span>
        </div>
        <div className="stat">
          <b>{days}</b>
          <span>dagar i rad</span>
        </div>
        <div className="stat">
          <b>{totals.reviews ? Math.round((totals.correct / totals.reviews) * 100) : 0}%</b>
          <span>rätt i glosövningar</span>
        </div>
        <div className="stat">
          <b>{db.chats}</b>
          <span>samtal</span>
        </div>
        <div className="stat">
          <b>{totals.turns}</b>
          <span>repliker i samtal</span>
        </div>
      </div>

      <div className="panel">
        <h3 style={{ fontSize: 18, marginBottom: 12 }}>Dina vanligaste fel i samtal</h3>
        {errs.length === 0 ? (
          <p className="sub" style={{ margin: 0 }}>
            Inga fel registrerade än. <Link href="/prata" className="link-btn">Starta ett samtal</Link>
          </p>
        ) : (
          <div className="list">
            {errs.map(([type, n]) => {
              const pct = Math.round((n / errSum) * 100);
              return (
                <div key={type}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                    <span>{type}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {n} st · {pct}%
                    </span>
                  </div>
                  <div className="bar" style={{ marginTop: 6 }}>
                    <i className="learning" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
