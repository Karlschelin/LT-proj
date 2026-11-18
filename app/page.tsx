"use client";

import Link from "next/link";
import { AppShell, useDue } from "@/components/AppShell";
import { useDB } from "@/lib/db";
import { getScenario, SCENARIOS } from "@/lib/scenarios";
import { decksFor, streak, thisWeek } from "@/lib/srs";

export default function TodayPage() {
  return (
    <AppShell>
      <Today />
    </AppShell>
  );
}

function Today() {
  const db = useDB()!;
  const due = useDue(db);
  const hasDecks = decksFor(db, db.settings.language).length > 0;
  const days = streak(db.days);
  const week = thisWeek(db.days);
  const minutes = Math.max(1, Math.round(due.reviews * 0.15 + due.fresh * 0.4));
  const date = new Date().toLocaleDateString("sv-SE", { weekday: "long", day: "numeric", month: "long" });

  const last = db.settings.lastScenario ? getScenario(db.settings.lastScenario) : undefined;
  const suggestions = [last, ...SCENARIOS.filter((s) => s.id !== last?.id)].filter(Boolean).slice(0, 2);

  return (
    <section className="view pad">
      <div>
        <div className="eyebrow">{date}</div>
        <h1 className="title-xl">
          {due.total > 0 ? (
            <>
              Hej! Dags för
              <br />
              dagens pass.
            </>
          ) : hasDecks ? (
            <>
              Klart för idag.
              <br />
              Snyggt jobbat!
            </>
          ) : (
            <>
              Hej! Vad vill du
              <br />
              öva på idag?
            </>
          )}
        </h1>
      </div>

      {hasDecks ? (
        <div className="session">
          <div className="counts">
            <div className="count">
              <b>{due.reviews}</b>
              <span>att repetera</span>
            </div>
            <div className="count">
              <b>{due.fresh}</b>
              <span>nya glosor</span>
            </div>
            <div className="count">
              <b>~{due.total ? minutes : 0}</b>
              <span>minuter</span>
            </div>
          </div>
          {due.total > 0 ? (
            <Link href="/glosor/ova" className="btn btn-invert btn-block">
              Starta dagens glosor
            </Link>
          ) : (
            <Link href="/glosor/ny" className="btn btn-invert btn-block">
              Lägg till fler glosor
            </Link>
          )}
        </div>
      ) : (
        <div className="session">
          <h2>Skapa din första glosbank</h2>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Välj ett område och hur många ord per dag, så sköter appen repetitionerna åt dig.
          </p>
          <Link href="/glosor/ny" className="btn btn-invert btn-block">
            Skapa glosor
          </Link>
        </div>
      )}

      <div className="panel">
        <div className="streak-head">
          <b>{days === 1 ? "1 dag i rad" : `${days} dagar i rad`}</b>
          <span className="eyebrow">Denna vecka</span>
        </div>
        <div className="week">
          {week.map((d, i) => (
            <div key={i}>
              <div className={`day-dot ${d.done ? "done" : d.isToday ? "today" : ""}`}>{d.done ? "✓" : ""}</div>
              {d.label}
            </div>
          ))}
        </div>
      </div>

      <div className="section-head">
        <h3>{last ? "Fortsätt prata" : "Prata"}</h3>
        <Link href="/prata" className="link-btn">
          Alla situationer
        </Link>
      </div>
      <div className="list">
        {suggestions.map((s) => (
          <Link key={s!.id} href={`/practice?scenario=${s!.id}`} className="row-card">
            <span className="icon">{s!.emoji}</span>
            <span className="txt">
              <strong>{s!.title}</strong>
              <span>{s!.id === last?.id ? "Senaste situationen" : s!.subtitle}</span>
            </span>
            <span className="go">›</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
