"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

export type SoundCue =
  | "navigation"
  | "shell-flip"
  | "match"
  | "constellation"
  | "completion";

interface SoundContextValue {
  enabled: boolean;
  ready: boolean;
  toggle: () => void;
  play: (cue: SoundCue) => void;
}

const SoundContext = createContext<SoundContextValue | null>(null);
const STORAGE_KEY = "clarity-sound-enabled";

interface Note {
  frequency: number;
  delay?: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  endFrequency?: number;
}

const CUES: Record<SoundCue, Note[]> = {
  navigation: [
    {
      frequency: 440,
      endFrequency: 560,
      duration: 0.07,
      gain: 0.055,
      type: "sine",
    },
  ],
  "shell-flip": [
    { frequency: 310, duration: 0.055, gain: 0.05, type: "triangle" },
    { frequency: 430, delay: 0.035, duration: 0.065, gain: 0.038, type: "sine" },
  ],
  match: [
    { frequency: 587.33, duration: 0.16, gain: 0.05, type: "sine" },
    { frequency: 880, delay: 0.07, duration: 0.22, gain: 0.045, type: "sine" },
  ],
  constellation: [
    {
      frequency: 659.25,
      endFrequency: 783.99,
      duration: 0.18,
      gain: 0.044,
      type: "sine",
    },
    { frequency: 987.77, delay: 0.075, duration: 0.2, gain: 0.026, type: "sine" },
  ],
  completion: [
    { frequency: 523.25, duration: 0.24, gain: 0.04, type: "sine" },
    { frequency: 659.25, delay: 0.085, duration: 0.28, gain: 0.04, type: "sine" },
    { frequency: 783.99, delay: 0.17, duration: 0.36, gain: 0.045, type: "sine" },
  ],
};

function scheduleCue(context: AudioContext, cue: SoundCue) {
  const now = context.currentTime + 0.008;
  const master = context.createGain();
  master.gain.setValueAtTime(0.9, now);
  master.connect(context.destination);

  for (const note of CUES[cue]) {
    const start = now + (note.delay ?? 0);
    const end = start + note.duration;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();

    oscillator.type = note.type ?? "sine";
    oscillator.frequency.setValueAtTime(note.frequency, start);
    if (note.endFrequency) {
      oscillator.frequency.exponentialRampToValueAtTime(note.endFrequency, end);
    }

    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(note.gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(end + 0.02);
  }
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const enabledRef = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const frame = window.requestAnimationFrame(() => {
      const next = saved === "true";
      enabledRef.current = next;
      setEnabled(next);
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const runCue = useCallback(async (cue: SoundCue, force = false) => {
    if ((!enabledRef.current && !force) || document.hidden) return;

    try {
      const context = contextRef.current ?? new AudioContext();
      contextRef.current = context;
      if (context.state === "suspended") await context.resume();
      scheduleCue(context, cue);
    } catch {
      // Sound is enhancement-only. Unsupported or blocked audio must never
      // interrupt navigation or an interaction.
    }
  }, []);

  const play = useCallback(
    (cue: SoundCue) => {
      void runCue(cue);
    },
    [runCue]
  );

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));
    if (next) void runCue("navigation", true);
  }, [runCue]);

  useEffect(() => {
    function handleNavigation(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;

      const url = new URL(target.href, window.location.href);
      if (
        url.origin === window.location.origin &&
        (url.pathname !== window.location.pathname || url.hash !== window.location.hash)
      ) {
        play("navigation");
      }
    }

    document.addEventListener("click", handleNavigation);
    return () => document.removeEventListener("click", handleNavigation);
  }, [play]);

  const value = useMemo(
    () => ({
      enabled,
      ready,
      toggle,
      play,
    }),
    [enabled, play, ready, toggle]
  );

  return <SoundContext.Provider value={value}>{children}</SoundContext.Provider>;
}

export function useSound() {
  const value = useContext(SoundContext);
  if (!value) throw new Error("useSound must be used inside SoundProvider");
  return value;
}
