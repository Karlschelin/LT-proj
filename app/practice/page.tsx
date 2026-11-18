"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { recordChatStart, recordChatTurn, saveChatWord, useDB } from "@/lib/db";
import { getLanguage, getScenario, LEVELS } from "@/lib/scenarios";
import type { ChatMessage, Turn } from "@/lib/schema";
import { useSpeechRecognition, useSpeak } from "@/lib/speech";
import { newSrs } from "@/lib/srs";

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <Practice />
    </Suspense>
  );
}

function Practice() {
  const db = useDB();
  if (!db) return <div className="loading-page">Laddar…</div>;
  return <Chat language={db.settings.language} level={db.settings.level} />;
}

function Chat({ language, level: levelId }: { language: string; level: string }) {
  const params = useSearchParams();
  const scenarioId = params.get("scenario") ?? "restaurant";
  const lang = getLanguage(language);
  const scenario = getScenario(scenarioId);
  const level = LEVELS.find((l) => l.id === levelId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [slow, setSlow] = useState(false);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const speak = useSpeak(language);
  const recognition = useSpeechRecognition(language, (text) => setInput(text));

  const send = useCallback(
    async (history: ChatMessage[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language,
            level: levelId,
            scenario: scenarioId,
            history: history.map((m) => ({ role: m.role, text: m.text })),
          }),
        });
        const data = (await res.json()) as { turn?: Turn; demo?: boolean; error?: string };
        if (!res.ok || !data.turn) throw new Error(data.error ?? "Något gick fel.");
        const turn = data.turn;
        setDemo(!!data.demo);
        if (history.length > 0) recordChatTurn(turn.feedback.errors.map((e) => e.type));
        setMessages(() => {
          const next = [...history];
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === "user" && turn.feedback.status !== "none") {
            next[lastIdx] = { ...next[lastIdx], feedback: turn.feedback } as ChatMessage;
          }
          next.push({ role: "partner", text: turn.reply, translation: turn.reply_translation, suggestions: turn.suggestions });
          return next;
        });
        speak(turn.reply, slow);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Något gick fel.");
      } finally {
        setLoading(false);
      }
    },
    [language, levelId, scenarioId, speak, slow],
  );

  useEffect(() => {
    if (started.current || !lang || !scenario) return;
    started.current = true;
    recordChatStart(scenario.id);
    void send([]);
  }, [lang, scenario, send]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  if (!lang || !scenario || !level) {
    return (
      <main className="home pad">
        <p>
          Okänd situation. <Link href="/prata">Tillbaka</Link>
        </p>
      </main>
    );
  }

  const submit = () => {
    const text = input.trim();
    if (!text || loading) return;
    recognition.stop();
    const history: ChatMessage[] = [...messages, { role: "user", text }];
    setMessages(history);
    setInput("");
    void send(history);
  };

  const save = (w: Turn["feedback"]["errors"][number]["word"]) => {
    saveChatWord(
      language,
      levelId,
      { word: w.word, translation: w.translation, tag: w.tag, example: "", exampleTranslation: "" },
      newSrs(),
    );
    setSaved((s) => new Set(s).add(w.word));
    setToast(`”${w.word}” sparad i Från samtal`);
  };

  const lastPartner = [...messages].reverse().find((m) => m.role === "partner");
  const suggestions = lastPartner && lastPartner.role === "partner" ? lastPartner.suggestions : [];

  return (
    <div className="shell fill">
      <section className="chat">
        <div className="chat-top pad">
          <Link href="/prata" className="icon-btn" aria-label="Tillbaka">
            ←
          </Link>
          <div className="chat-title">
            <strong>
              {scenario.emoji} {scenario.title}
            </strong>
            <span>
              {lang.flag} {lang.name} · {level.id}
            </span>
          </div>
          <button className="icon-btn" aria-pressed={slow} title="Långsamt tal" aria-label="Långsamt tal" onClick={() => setSlow((s) => !s)}>
            🐢
          </button>
        </div>
        <div className="pad">
          <div className="goal">
            <b>Mål:</b> {scenario.goal}
          </div>
          {demo && <div className="demo-banner">Demoläge – ingen API-nyckel är inlagd, så svaren är förinspelade exempel.</div>}
        </div>

        <div className="thread pad" ref={threadRef}>
          {messages.map((m, i) =>
            m.role === "partner" ? (
              <PartnerBubble key={i} text={m.text} translation={m.translation} onSpeak={() => speak(m.text, slow)} />
            ) : (
              <div key={i} className="msg user">
                <div className="bubble">{m.text}</div>
                {m.feedback && (
                  <Feedback feedback={m.feedback} saved={saved} onSave={save} onSpeak={(t) => speak(t, slow)} />
                )}
              </div>
            ),
          )}
          {loading && (
            <div className="msg partner">
              <div className="bubble typing" aria-label="Skriver">
                <i />
                <i />
                <i />
              </div>
            </div>
          )}
          {error && <p className="error-msg">{error}</p>}
        </div>

        <div className="composer pad">
          {suggestions.length > 0 && !loading && (
            <div className="suggestions">
              {suggestions.map((s, i) => (
                <button key={i} className="suggestion" onClick={() => setInput(s.text)}>
                  {s.text}
                  <span>{s.meaning}</span>
                </button>
              ))}
            </div>
          )}
          <div className="input-row">
            {recognition.supported && (
              <button
                className="round"
                style={recognition.listening ? { background: "var(--err)", color: "#fff" } : undefined}
                aria-label={recognition.listening ? "Sluta lyssna" : "Prata"}
                onClick={() => (recognition.listening ? recognition.stop() : recognition.start())}
              >
                🎤
              </button>
            )}
            <textarea
              id="chat-input"
              rows={1}
              value={input}
              placeholder={`Svara på ${lang.name.toLowerCase()}…`}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            <button className="round send" aria-label="Skicka" disabled={!input.trim() || loading} onClick={submit}>
              ➤
            </button>
          </div>
        </div>
      </section>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

function PartnerBubble(props: { text: string; translation: string; onSpeak: () => void }) {
  const [show, setShow] = useState(false);
  return (
    <div className="msg partner">
      <div className="bubble">
        {props.text}
        {show && <div className="translation">{props.translation}</div>}
      </div>
      <div className="actions">
        <button className="mini" onClick={props.onSpeak}>
          🔊 Lyssna
        </button>
        <button className="mini" onClick={() => setShow((s) => !s)}>
          {show ? "Dölj" : "Översätt"}
        </button>
      </div>
    </div>
  );
}

const STATUS = { perfect: "✓ Perfekt!", minor: "Nästan rätt", errors: "Rättelser", none: "" } as const;

function Feedback({
  feedback,
  saved,
  onSave,
  onSpeak,
}: {
  feedback: Turn["feedback"];
  saved: Set<string>;
  onSave: (w: Turn["feedback"]["errors"][number]["word"]) => void;
  onSpeak: (text: string) => void;
}) {
  const [open, setOpen] = useState(feedback.status !== "perfect");
  return (
    <div className={`fb ${feedback.status}`}>
      <button className="fb-head" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{STATUS[feedback.status]}</span>
        <span className="sp" />
        <span className="caret">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="fb-body">
          {feedback.status !== "perfect" && feedback.corrected && (
            <div>
              <div className="fb-label">Korrekt</div>
              <div className="fb-text">
                {feedback.corrected}{" "}
                <button className="mini" onClick={() => onSpeak(feedback.corrected)} aria-label="Lyssna">
                  🔊
                </button>
              </div>
            </div>
          )}
          {feedback.errors.map((e, i) => (
            <div key={i} className="err">
              <div className="err-line">
                <span className="err-old">{e.original}</span>
                <span>→</span>
                <span className="err-new">{e.correction}</span>
                <span className="tag">{e.type}</span>
              </div>
              <div>{e.explanation}</div>
              {e.word?.word && (
                <button className="save" disabled={saved.has(e.word.word)} onClick={() => onSave(e.word)}>
                  {saved.has(e.word.word) ? "✓ Sparad i glosor" : `+ Spara ”${e.word.word}” som glosa`}
                </button>
              )}
            </div>
          ))}
          {feedback.natural_alternative && (
            <div>
              <div className="fb-label">Mer naturligt</div>
              <div className="fb-text">
                {feedback.natural_alternative}{" "}
                <button className="mini" onClick={() => onSpeak(feedback.natural_alternative)} aria-label="Lyssna">
                  🔊
                </button>
              </div>
            </div>
          )}
          {feedback.tip && <div>{feedback.tip}</div>}
        </div>
      )}
    </div>
  );
}
