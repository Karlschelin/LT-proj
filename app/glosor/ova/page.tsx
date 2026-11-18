"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { recordReview, useDB, type DB, type WordCard } from "@/lib/db";
import { useSpeak } from "@/lib/speech";
import {
  buildQueue,
  checkAnswer,
  decksFor,
  grade,
  previewIntervals,
  Rating,
  streak,
  State,
  type Grade,
  type QueueItem,
  type Verdict,
} from "@/lib/srs";
import { getLanguage } from "@/lib/scenarios";

export default function StudyPage() {
  return (
    <Suspense fallback={null}>
      <Study />
    </Suspense>
  );
}

const MODE_LABEL = { flip: "Kort", choice: "Flerval", write: "Skriv" } as const;

function shuffle<T>(a: T[]) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/** Highlights the learned word inside its example sentence. */
function Highlight({ text, word }: { text: string; word: string }) {
  const core = word.replace(/\s*\(.*\)$/, "").replace(/^(el|la|los|las|le|les|l'|il|lo|der|die|das|the|o|a)\s+/i, "");
  const idx = core ? text.toLowerCase().indexOf(core.toLowerCase()) : -1;
  if (idx < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className="mark">{text.slice(idx, idx + core.length)}</span>
      {text.slice(idx + core.length)}
    </>
  );
}

function Study() {
  const db = useDB();
  const params = useSearchParams();
  const deckId = params.get("deck") ?? undefined;
  const router = useRouter();

  const [queue, setQueue] = useState<QueueItem[] | null>(null);
  const [pos, setPos] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [firstTry, setFirstTry] = useState(0);
  const retries = useRef<Record<string, number>>({});

  useEffect(() => {
    if (db && queue === null) setQueue(buildQueue(db, db.settings.language, deckId));
  }, [db, queue, deckId]);

  if (!db || !queue) return <div className="loading-page">Laddar…</div>;

  if (queue.length === 0) {
    return (
      <div className="shell">
        <section className="study pad">
          <div className="done-hero">
            <h2 style={{ fontSize: 28 }}>Inget att öva just nu</h2>
            <p className="sub">Alla glosor är klara för idag. Kom tillbaka imorgon, eller skapa en ny glosbank.</p>
          </div>
          <Link href="/glosor/ny" className="btn btn-primary btn-block">
            Skapa glosbank
          </Link>
          <Link href="/" className="btn btn-ghost btn-block">
            Till Idag
          </Link>
        </section>
      </div>
    );
  }

  if (pos >= queue.length)
    return <Done db={db} done={correct} firstTry={firstTry} unique={new Set(queue.map((q) => q.cardId)).size} />;

  const item = queue[pos];
  const card = db.cards.find((c) => c.id === item.cardId);
  if (!card) {
    // The card was deleted mid-session.
    return (
      <div className="shell">
        <section className="study pad">
          <button className="btn btn-primary btn-block" onClick={() => setPos((p) => p + 1)}>
            Hoppa över
          </button>
        </section>
      </div>
    );
  }

  const onResult = (rating: Grade, ok: boolean) => {
    const isRetry = (retries.current[card.id] ?? 0) > 0;
    recordReview(card.id, grade(card.srs, rating), ok);
    if (ok) setCorrect((c) => c + 1);
    if (ok && !isRetry) setFirstTry((c) => c + 1);
    if (rating === Rating.Again && (retries.current[card.id] ?? 0) < 2) {
      retries.current[card.id] = (retries.current[card.id] ?? 0) + 1;
      setQueue((q) => [...q!, { cardId: card.id, mode: "flip" }]);
    }
    setPos((p) => p + 1);
  };

  const pct = Math.round((pos / queue.length) * 100);

  return (
    <div className="shell">
      <section className="study pad">
        <div className="study-top">
          <button className="icon-btn" onClick={() => router.push("/")} aria-label="Avsluta">
            ✕
          </button>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <i style={{ width: `${pct}%` }} />
          </div>
          <span className="study-count">
            {pos + 1}/{queue.length}
          </span>
        </div>
        <div className="mode">
          {card.srs.state === State.New ? "Nytt ord" : MODE_LABEL[item.mode]}
        </div>
        {item.mode === "flip" && <Flip key={pos} card={card} lang={db.settings.language} onResult={onResult} />}
        {item.mode === "choice" && <Choice key={pos} card={card} db={db} lang={db.settings.language} onResult={onResult} />}
        {item.mode === "write" && <Write key={pos} card={card} lang={db.settings.language} onResult={onResult} />}
      </section>
    </div>
  );
}

type ExProps = { card: WordCard; lang: string; onResult: (r: Grade, ok: boolean) => void };

function Details({ card, lang }: { card: WordCard; lang: string }) {
  const speak = useSpeak(lang);
  if (!card.example) return null;
  return (
    <>
      <div className="example">
        <Highlight text={card.example} word={card.word} />{" "}
        <button className="mini" onClick={() => speak(card.example)} aria-label="Lyssna på meningen">
          🔊
        </button>
      </div>
      <div className="example-tr">{card.exampleTranslation}</div>
    </>
  );
}

function Flip({ card, lang, onResult }: ExProps) {
  const [revealed, setRevealed] = useState(false);
  const speak = useSpeak(lang);
  const intervals = useMemo(() => previewIntervals(card.srs), [card.srs]);
  useEffect(() => {
    speak(card.word);
  }, [card.word, speak]);

  return (
    <>
      <div className="card">
        {card.tag && card.tag !== "annat" && <span className="gender">{card.tag}</span>}
        <div className="prompt">{card.word}</div>
        <button className="mini" onClick={() => speak(card.word)}>
          🔊 Lyssna
        </button>
        {revealed && (
          <>
            <hr />
            <div className="answer">{card.translation}</div>
            <Details card={card} lang={lang} />
          </>
        )}
      </div>
      {revealed ? (
        <div className="grades">
          <button className="grade again" onClick={() => onResult(Rating.Again, false)}>
            Igen<small>{intervals[Rating.Again]}</small>
          </button>
          <button className="grade hard" onClick={() => onResult(Rating.Hard, true)}>
            Svårt<small>{intervals[Rating.Hard]}</small>
          </button>
          <button className="grade good" onClick={() => onResult(Rating.Good, true)}>
            Bra<small>{intervals[Rating.Good]}</small>
          </button>
          <button className="grade easy" onClick={() => onResult(Rating.Easy, true)}>
            Lätt<small>{intervals[Rating.Easy]}</small>
          </button>
        </div>
      ) : (
        <button className="btn btn-primary btn-block" onClick={() => setRevealed(true)}>
          Visa svar
        </button>
      )}
    </>
  );
}

function Choice({ card, db, lang, onResult }: ExProps & { db: DB }) {
  const speak = useSpeak(lang);
  const options = useMemo(() => {
    const ids = new Set(decksFor(db, lang).map((d) => d.id));
    const pool = Array.from(
      new Set(db.cards.filter((c) => ids.has(c.deckId) && c.word !== card.word).map((c) => c.word)),
    );
    return shuffle([card.word, ...shuffle(pool).slice(0, 3)]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card.id]);
  const [picked, setPicked] = useState<string | null>(null);
  const ok = picked === card.word;

  return (
    <>
      <div className="card">
        <div className="answer" style={{ color: "var(--muted)", fontSize: 15 }}>
          Vad heter
        </div>
        <div className="prompt">{card.translation}</div>
        {picked && <Details card={card} lang={lang} />}
      </div>
      <div className="options">
        {options.map((o) => (
          <button
            key={o}
            className={`option ${picked ? (o === card.word ? "right" : o === picked ? "wrong" : "") : ""}`}
            disabled={!!picked}
            onClick={() => {
              setPicked(o);
              speak(card.word);
            }}
          >
            {o}
          </button>
        ))}
      </div>
      {picked && (
        <button className="btn btn-primary btn-block" onClick={() => onResult(ok ? Rating.Good : Rating.Again, ok)}>
          Fortsätt
        </button>
      )}
    </>
  );
}

function Write({ card, lang, onResult }: ExProps) {
  const speak = useSpeak(lang);
  const language = getLanguage(lang);
  const [text, setText] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const check = () => {
    if (!text.trim() || verdict) return;
    setVerdict(checkAnswer(text, card.word));
    speak(card.word);
  };
  const next = () => {
    if (verdict === "right") onResult(card.srs.scheduled_days >= 21 ? Rating.Easy : Rating.Good, true);
    else if (verdict === "near") onResult(Rating.Hard, true);
    else onResult(Rating.Again, false);
  };

  return (
    <>
      <div className="card">
        <div className="answer" style={{ color: "var(--muted)", fontSize: 15 }}>
          Skriv på {language?.name.toLowerCase()}
        </div>
        <div className="prompt">{card.translation}</div>
        {card.tag && card.tag !== "annat" && <span className="gender">{card.tag}</span>}
        {verdict && <Details card={card} lang={lang} />}
      </div>
      <input
        id="write-answer"
        className="text-input"
        placeholder="Skriv här…"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={text}
        disabled={!!verdict}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") (verdict ? next : check)();
        }}
        autoFocus
      />
      {verdict ? (
        <>
          <div className={`verdict ${verdict}`}>
            {verdict === "right" ? "Rätt! " : verdict === "near" ? "Nästan – kolla stavning och accenter: " : "Rätt svar: "}
            <b>{card.word}</b>
          </div>
          <button className="btn btn-primary btn-block" onClick={next}>
            Fortsätt
          </button>
        </>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setVerdict("wrong")}>
            Vet inte
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={check} disabled={!text.trim()}>
            Kontrollera
          </button>
        </div>
      )}
    </>
  );
}

function Done({ db, done, firstTry, unique }: { db: DB; done: number; firstTry: number; unique: number }) {
  const tomorrowEnd = new Date();
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
  tomorrowEnd.setHours(23, 59, 59);
  const ids = new Set(decksFor(db, db.settings.language).map((d) => d.id));
  const tomorrow = db.cards.filter(
    (c) => ids.has(c.deckId) && c.srs.state !== State.New && new Date(c.srs.due) <= tomorrowEnd,
  ).length;
  const days = streak(db.days);

  return (
    <div className="shell">
      <section className="study pad">
        <div className="done-hero">
          <div className="big">{done}</div>
          <h2 style={{ fontSize: 28 }}>rätta svar idag</h2>
          <p className="sub">
            Snyggt jobbat! {tomorrow > 0 ? `Imorgon väntar ungefär ${tomorrow} repetitioner.` : "Inga repetitioner väntar imorgon."}
          </p>
        </div>
        <div className="stat-grid">
          <div className="stat">
            <b>
              {firstTry}/{unique}
            </b>
            <span>rätt på första försöket</span>
          </div>
          <div className="stat">
            <b>{days}</b>
            <span>{days === 1 ? "dag i rad" : "dagar i rad"}</span>
          </div>
        </div>
        <Link href="/prata" className="row-card">
          <span className="icon">💬</span>
          <span className="txt">
            <strong>Använd orden i ett samtal</strong>
            <span>Välj en situation och prata</span>
          </span>
          <span className="go">›</span>
        </Link>
        <Link href="/" className="btn btn-ghost btn-block">
          Till Idag
        </Link>
      </section>
    </div>
  );
}
