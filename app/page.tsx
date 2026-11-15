"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LANGUAGES, LEVELS, SCENARIOS } from "@/lib/scenarios";

function load(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

export default function Home() {
  const [language, setLanguage] = useState(LANGUAGES[0].code);
  const [level, setLevel] = useState("A2");

  useEffect(() => {
    setLanguage(load("lang", LANGUAGES[0].code));
    setLevel(load("level", "A2"));
  }, []);

  const levelInfo = LEVELS.find((l) => l.id === level);

  return (
    <main className="home">
      <div className="brand">
        <div className="brand-logo">P</div>
        <h1>Prata</h1>
      </div>
      <p className="lead">Öva på riktiga situationer. Du får rättelser och förklaringar på svenska efter varje svar.</p>

      <div className="section-title">Språk</div>
      <div className="chips">
        {LANGUAGES.map((l) => (
          <button
            key={l.code}
            className="chip"
            aria-pressed={language === l.code}
            onClick={() => {
              setLanguage(l.code);
              save("lang", l.code);
            }}
          >
            <span>{l.flag}</span> {l.name}
          </button>
        ))}
      </div>

      <div className="section-title">Nivå</div>
      <div className="chips">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            className="chip"
            aria-pressed={level === l.id}
            onClick={() => {
              setLevel(l.id);
              save("level", l.id);
            }}
          >
            {l.id} <small>{l.label}</small>
          </button>
        ))}
      </div>
      {levelInfo && <p className="level-hint">{levelInfo.description}</p>}

      <div className="section-title">Välj situation</div>
      <div className="scenarios">
        {SCENARIOS.map((s) => (
          <Link
            key={s.id}
            className="scenario"
            href={`/practice?lang=${encodeURIComponent(language)}&level=${level}&scenario=${s.id}`}
          >
            <span className="scenario-emoji">{s.emoji}</span>
            <span className="scenario-title">{s.title}</span>
            <span className="scenario-sub">{s.subtitle}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
