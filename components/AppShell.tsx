"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { setSettings, useDB, type DB } from "@/lib/db";
import { getLanguage, LANGUAGES, LEVELS } from "@/lib/scenarios";
import { dueCards } from "@/lib/srs";

const ICONS: Record<string, React.ReactNode> = {
  idag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  prata: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" />
    </svg>
  ),
  glosor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="6" width="14" height="14" rx="2" />
      <path d="M7 3h12a2 2 0 0 1 2 2v12" />
    </svg>
  ),
  framsteg: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
};

const TABS = [
  { key: "idag", href: "/", label: "Idag" },
  { key: "prata", href: "/prata", label: "Prata" },
  { key: "glosor", href: "/glosor", label: "Glosor" },
  { key: "framsteg", href: "/framsteg", label: "Framsteg" },
];

export function useDue(db: DB | null) {
  if (!db) return { reviews: 0, fresh: 0, total: 0 };
  const { reviews, fresh } = dueCards(db, db.settings.language);
  return { reviews: reviews.length, fresh: fresh.length, total: reviews.length + fresh.length };
}

export function LangPill({ onClick }: { onClick: () => void }) {
  const db = useDB();
  if (!db) return null;
  const l = getLanguage(db.settings.language) ?? LANGUAGES[0];
  return (
    <button className="lang-pill" onClick={onClick} aria-label="Byt språk och nivå">
      {l.flag} <b>{l.name}</b> · {db.settings.level} <span className="caret">▼</span>
    </button>
  );
}

export function LangSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDB();
  if (!open || !db) return null;
  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-label="Språk och nivå">
        <div className="grab" />
        <h3 style={{ fontSize: 22 }}>Språk och nivå</h3>
        <div className="field">
          <div className="field-label">Jag lär mig</div>
          <div className="chips">
            {LANGUAGES.map((l) => (
              <button
                key={l.code}
                className="chip"
                aria-pressed={db.settings.language === l.code}
                onClick={() => setSettings({ language: l.code })}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <div className="field-label">Min nivå</div>
          <div className="chips">
            {LEVELS.map((l) => (
              <button
                key={l.id}
                className="chip"
                aria-pressed={db.settings.level === l.id}
                onClick={() => setSettings({ level: l.id })}
              >
                {l.id} <small>{l.label}</small>
              </button>
            ))}
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={onClose}>
          Klar
        </button>
      </div>
    </div>
  );
}

/** Main tab screens: header with language pill, scrolling content, tab bar. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const db = useDB();
  const path = usePathname();
  const [sheet, setSheet] = useState(false);
  const due = useDue(db);

  return (
    <>
      <div className="shell">
        <header className="header pad">
          <div className="wordmark">
            Prata<span>.</span>
          </div>
          <LangPill onClick={() => setSheet(true)} />
        </header>
        {db ? children : <div className="loading-page">Laddar…</div>}
      </div>
      <div className="tabbar">
        <nav>
          {TABS.map((t) => {
            const current = t.href === "/" ? path === "/" : path.startsWith(t.href);
            return (
              <Link key={t.key} href={t.href} className="tab" aria-current={current ? "page" : undefined}>
                <span className="tab-ico">
                  {ICONS[t.key]}
                  {t.key === "glosor" && due.total > 0 && <span className="badge">{due.total}</span>}
                </span>
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <LangSheet open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}
