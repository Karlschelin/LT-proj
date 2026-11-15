"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Step 1: uses the browser's built-in voices (free, but robotic on some phones).
 * Step 2 will replace this with a natural TTS service (ElevenLabs / OpenAI).
 */
export function useSpeak(langCode: string) {
  return useCallback(
    (text: string, slow = false) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = langCode;
      u.rate = slow ? 0.7 : 0.95;
      const prefix = langCode.split("-")[0];
      const voices = synth.getVoices().filter((v) => v.lang.replace("_", "-").startsWith(prefix));
      // Prefer higher-quality voices when the device has them.
      const best =
        voices.find((v) => /premium|enhanced|natural|neural|google/i.test(v.name) && v.lang.startsWith(langCode)) ??
        voices.find((v) => v.lang.replace("_", "-") === langCode) ??
        voices[0];
      if (best) u.voice = best;
      synth.speak(u);
    },
    [langCode],
  );
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

export function useSpeechRecognition(langCode: string, onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = langCode;
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let text = "";
      for (let i = 0; i < e.results.length; i++) text += e.results[i][0].transcript;
      onTextRef.current(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setSupported(true);
    return () => rec.stop();
  }, [langCode]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    window.speechSynthesis?.cancel();
    try {
      recRef.current.start();
      setListening(true);
    } catch {}
  }, []);
  const stop = useCallback(() => {
    recRef.current?.stop();
    setListening(false);
  }, []);

  return { supported, listening, start, stop };
}
