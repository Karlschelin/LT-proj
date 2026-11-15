"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { getLanguage, getScenario, LEVELS } from "@/lib/scenarios";
import type { ChatMessage, Turn } from "@/lib/schema";
import { useSpeechRecognition, useSpeak } from "@/lib/speech";

export default function PracticePage() {
  return (
    <Suspense fallback={null}>
      <Practice />
    </Suspense>
  );
}

function Practice() {
  const params = useSearchParams();
  const langCode = params.get("lang") ?? "es-ES";
  const levelId = params.get("level") ?? "A2";
  const scenarioId = params.get("scenario") ?? "restaurant";
  const lang = getLanguage(langCode);
  const scenario = getScenario(scenarioId);
  const level = LEVELS.find((l) => l.id === levelId);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [slow, setSlow] = useState(false);
  const [showAllTranslations, setShowAllTranslations] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const speak = useSpeak(langCode);
  const recognition = useSpeechRecognition(langCode, (text) => setInput(text));

  const send = useCallback(
    async (history: ChatMessage[]) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            language: langCode,
            level: levelId,
            scenario: scenarioId,
            history: history.map((m) => ({ role: m.role, text: m.text })),
          }),
        });
        const data = (await res.json()) as { turn?: Turn; demo?: boolean; error?: string };
        if (!res.ok || !data.turn) throw new Error(data.error ?? "Något gick fel.");
        const turn = data.turn;
        setDemo(!!data.demo);
        setMessages(() => {
          const next = [...history];
          // Attach feedback to the learner's last message.
          const lastIdx = next.length - 1;
          if (lastIdx >= 0 && next[lastIdx].role === "user" && turn.feedback.status !== "none") {
            next[lastIdx] = { ...next[lastIdx], feedback: turn.feedback } as ChatMessage;
          }
          next.push({
            role: "partner",
            text: turn.reply,
            translation: turn.reply_translation,
            suggestions: turn.suggestions,
          });
          return next;
        });
        speak(turn.reply, slow);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Något gick fel.");
      } finally {
        setLoading(false);
      }
    },
    [langCode, levelId, scenarioId, speak, slow],
  );

  useEffect(() => {
    if (started.current || !lang || !scenario) return;
    started.current = true;
    void send([]);
  }, [lang, scenario, send]);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (!lang || !scenario || !level) {
    return (
      <main className="home">
        <p>Okänt scenario. <Link href="/">Tillbaka</Link></p>
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

  const lastPartner = [...messages].reverse().find((m) => m.role === "partner");
  const suggestions = lastPartner && lastPartner.role === "partner" ? lastPartner.suggestions : [];

  return (
    <main className="practice">
      <header className="topbar">
        <Link href="/" className="icon-btn" aria-label="Tillbaka">←</Link>
        <div className="topbar-title">
          <strong>{scenario.emoji} {scenario.title}</strong>
          <span>{lang.flag} {lang.name} · {level.id} {level.label}</span>
        </div>
        <button
          className="icon-btn"
          aria-pressed={slow}
          aria-label="Långsamt tal"
          title="Långsamt tal"
          onClick={() => setSlow((s) => !s)}
        >
          🐢
        </button>
        <button
          className="icon-btn"
          aria-pressed={showAllTranslations}
          aria-label="Visa översättningar"
          title="Visa översättningar"
          onClick={() => setShowAllTranslations((s) => !s)}
        >
          🇸🇪
        </button>
      </header>

      <div className="goal">🎯 <span><strong>Mål:</strong> {scenario.goal}</span></div>
      {demo && (
        <div className="demo-banner">
          Demoläge – ingen API-nyckel är inlagd, så svaren är förinspelade exempel.
        </div>
      )}

      <div className="thread" ref={threadRef}>
        {messages.map((m, i) =>
          m.role === "partner" ? (
            <PartnerBubble
              key={i}
              text={m.text}
              translation={m.translation}
              forceTranslation={showAllTranslations}
              onSpeak={() => speak(m.text, slow)}
            />
          ) : (
            <div key={i} className="row user">
              <div className="bubble">{m.text}</div>
              {m.feedback && <Feedback feedback={m.feedback} onSpeak={(t) => speak(t, slow)} />}
            </div>
          ),
        )}
        {loading && (
          <div className="row partner">
            <div className="bubble typing" aria-label="Skriver"><i /><i /><i /></div>
          </div>
        )}
        {error && <p className="error-msg">{error}</p>}
      </div>

      <div className="composer">
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
              className={`round-btn ${recognition.listening ? "listening" : ""}`}
              aria-label={recognition.listening ? "Sluta lyssna" : "Prata"}
              onClick={() => (recognition.listening ? recognition.stop() : recognition.start())}
            >
              🎤
            </button>
          )}
          <textarea
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
          <button className="round-btn send" aria-label="Skicka" disabled={!input.trim() || loading} onClick={submit}>
            ➤
          </button>
        </div>
      </div>
    </main>
  );
}

function PartnerBubble(props: {
  text: string;
  translation: string;
  forceTranslation: boolean;
  onSpeak: () => void;
}) {
  const [show, setShow] = useState(false);
  const visible = show || props.forceTranslation;
  return (
    <div className="row partner">
      <div className="bubble">
        {props.text}
        {visible && <div className="translation">{props.translation}</div>}
      </div>
      <div className="bubble-actions">
        <button className="mini-btn" onClick={props.onSpeak}>🔊 Lyssna</button>
        <button className="mini-btn" onClick={() => setShow((s) => !s)}>
          {visible ? "Dölj översättning" : "Översätt"}
        </button>
      </div>
    </div>
  );
}

const STATUS = {
  perfect: { icon: "✅", label: "Perfekt!" },
  minor: { icon: "🟡", label: "Nästan rätt" },
  errors: { icon: "✏️", label: "Rättelser" },
  none: { icon: "", label: "" },
} as const;

function Feedback({ feedback, onSpeak }: { feedback: Turn["feedback"]; onSpeak: (text: string) => void }) {
  const [open, setOpen] = useState(feedback.status !== "perfect");
  const s = STATUS[feedback.status];
  return (
    <div className={`feedback ${feedback.status}`}>
      <button className="fb-head" style={{ all: "unset", display: "flex", width: "100%", gap: 6, cursor: "pointer" }} onClick={() => setOpen((o) => !o)}>
        <span>{s.icon}</span>
        <span style={{ fontWeight: 600 }}>{s.label}</span>
        <span className="spacer" style={{ flex: 1 }} />
        <span style={{ fontSize: 12, opacity: 0.7 }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="fb-body">
          {feedback.status !== "perfect" && feedback.corrected && (
            <div>
              <div className="fb-label">Korrekt</div>
              <div className="fb-corrected">
                {feedback.corrected}
                <button className="mini-btn" onClick={() => onSpeak(feedback.corrected)} aria-label="Lyssna">🔊</button>
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
              <div className="err-why">{e.explanation}</div>
            </div>
          ))}
          {feedback.natural_alternative && (
            <div>
              <div className="fb-label">Mer naturligt</div>
              <div className="fb-corrected">
                {feedback.natural_alternative}
                <button className="mini-btn" onClick={() => onSpeak(feedback.natural_alternative)} aria-label="Lyssna">🔊</button>
              </div>
            </div>
          )}
          {feedback.tip && <div className="tip">💡 {feedback.tip}</div>}
        </div>
      )}
    </div>
  );
}
