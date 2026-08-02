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

interface Note {
  frequency: number;
  delay?: number;
  duration: number;
  gain: number;
  type?: OscillatorType;
  endFrequency?: number;
  pan?: number;
}

interface AudioEngine {
  context: AudioContext;
  dryInput: GainNode;
  wetInput: GainNode;
  output: GainNode;
}

const SoundContext = createContext<SoundContextValue | null>(null);
const STORAGE_KEY = "clarity-sound-enabled";

// A shared pentatonic palette gives every cue the same moonlit identity while
// differences in rhythm, register, and texture keep interactions recognizable.
const CUES: Record<SoundCue, Note[]> = {
  navigation: [
    {
      frequency: 392,
      endFrequency: 493.88,
      duration: 0.085,
      gain: 0.038,
      type: "sine",
      pan: -0.08,
    },
    { frequency: 659.25, delay: 0.035, duration: 0.1, gain: 0.015, pan: 0.1 },
  ],
  "shell-flip": [
    {
      frequency: 246.94,
      endFrequency: 349.23,
      duration: 0.09,
      gain: 0.045,
      type: "triangle",
      pan: -0.12,
    },
    { frequency: 523.25, delay: 0.035, duration: 0.12, gain: 0.022, pan: 0.12 },
  ],
  match: [
    { frequency: 587.33, duration: 0.24, gain: 0.043, pan: -0.15 },
    { frequency: 880, delay: 0.075, duration: 0.32, gain: 0.042, pan: 0.12 },
    { frequency: 1174.66, delay: 0.14, duration: 0.34, gain: 0.018, pan: 0.04 },
  ],
  constellation: [
    {
      frequency: 659.25,
      endFrequency: 783.99,
      duration: 0.24,
      gain: 0.04,
      pan: -0.18,
    },
    { frequency: 987.77, delay: 0.07, duration: 0.3, gain: 0.028, pan: 0.16 },
    { frequency: 1318.51, delay: 0.13, duration: 0.34, gain: 0.013, pan: 0 },
  ],
  completion: [
    { frequency: 523.25, duration: 0.38, gain: 0.034, pan: -0.2 },
    { frequency: 659.25, delay: 0.095, duration: 0.44, gain: 0.036, pan: -0.06 },
    { frequency: 783.99, delay: 0.19, duration: 0.5, gain: 0.038, pan: 0.09 },
    { frequency: 987.77, delay: 0.285, duration: 0.58, gain: 0.032, pan: 0.2 },
    { frequency: 1567.98, delay: 0.39, duration: 0.52, gain: 0.012, pan: 0.04 },
  ],
};

function makeImpulse(context: AudioContext) {
  const duration = 0.72;
  const length = Math.floor(context.sampleRate * duration);
  const impulse = context.createBuffer(2, length, context.sampleRate);

  for (let channel = 0; channel < impulse.numberOfChannels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let index = 0; index < length; index += 1) {
      const decay = (1 - index / length) ** 3.1;
      data[index] = (Math.random() * 2 - 1) * decay * 0.46;
    }
  }

  return impulse;
}

function createEngine(context: AudioContext): AudioEngine {
  const dryInput = context.createGain();
  const wetInput = context.createGain();
  const dry = context.createGain();
  const wet = context.createGain();
  const reverb = context.createConvolver();
  const compressor = context.createDynamicsCompressor();
  const output = context.createGain();

  dry.gain.value = 0.82;
  wet.gain.value = 0.13;
  output.gain.value = 0.72;
  reverb.buffer = makeImpulse(context);
  compressor.threshold.value = -24;
  compressor.knee.value = 18;
  compressor.ratio.value = 4;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.16;

  dryInput.connect(dry);
  wetInput.connect(reverb);
  reverb.connect(wet);
  dry.connect(compressor);
  wet.connect(compressor);
  compressor.connect(output);
  output.connect(context.destination);

  return { context, dryInput, wetInput, output };
}

function connectVoice(engine: AudioEngine, node: AudioNode, pan: number) {
  const panner = engine.context.createStereoPanner();
  panner.pan.value = Math.max(-0.35, Math.min(0.35, pan));
  node.connect(panner);
  panner.connect(engine.dryInput);
  panner.connect(engine.wetInput);
}

function scheduleNote(engine: AudioEngine, note: Note, start: number, pitchRatio: number) {
  const context = engine.context;
  const end = start + note.duration;
  const envelope = context.createGain();
  const fundamental = context.createOscillator();
  const shimmer = context.createOscillator();
  const shimmerGain = context.createGain();
  const frequency = note.frequency * pitchRatio;

  fundamental.type = note.type ?? "sine";
  fundamental.frequency.setValueAtTime(frequency, start);
  shimmer.type = "sine";
  shimmer.frequency.setValueAtTime(frequency * 2.01, start);
  shimmerGain.gain.value = note.type === "triangle" ? 0.08 : 0.13;

  if (note.endFrequency) {
    fundamental.frequency.exponentialRampToValueAtTime(note.endFrequency * pitchRatio, end);
    shimmer.frequency.exponentialRampToValueAtTime(note.endFrequency * pitchRatio * 2.01, end);
  }

  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(note.gain, start + 0.014);
  envelope.gain.exponentialRampToValueAtTime(note.gain * 0.42, start + note.duration * 0.42);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);

  fundamental.connect(envelope);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(envelope);
  connectVoice(engine, envelope, note.pan ?? 0);
  fundamental.start(start);
  shimmer.start(start);
  fundamental.stop(end + 0.025);
  shimmer.stop(end + 0.025);
}

function scheduleShellTexture(engine: AudioEngine, start: number, variation: number) {
  const context = engine.context;
  const duration = 0.075;
  const buffer = context.createBuffer(1, Math.floor(context.sampleRate * duration), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let index = 0; index < samples.length; index += 1) {
    const fade = 1 - index / samples.length;
    samples[index] = (Math.random() * 2 - 1) * fade;
  }

  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  source.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.value = 1550 + variation * 35;
  filter.Q.value = 1.2;
  gain.gain.setValueAtTime(0.018, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(filter);
  filter.connect(gain);
  connectVoice(engine, gain, variation % 2 === 0 ? -0.16 : 0.16);
  source.start(start);
}

function scheduleCue(engine: AudioEngine, cue: SoundCue, variation: number) {
  const now = engine.context.currentTime + 0.008;
  const cents = [-8, 0, 6, -3][variation % 4];
  const pitchRatio = 2 ** (cents / 1200);

  for (const note of CUES[cue]) {
    scheduleNote(engine, note, now + (note.delay ?? 0), pitchRatio);
  }
  if (cue === "shell-flip") scheduleShellTexture(engine, now, variation);
}

function isSoundCue(value: string | undefined): value is SoundCue {
  return Boolean(value && value in CUES);
}

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const engineRef = useRef<AudioEngine | null>(null);
  const enabledRef = useRef(false);
  const variationRef = useRef(0);
  const suspendTimerRef = useRef<number | null>(null);

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

  useEffect(
    () => () => {
      if (suspendTimerRef.current !== null) window.clearTimeout(suspendTimerRef.current);
      const context = engineRef.current?.context;
      if (context && context.state !== "closed") void context.close();
    },
    []
  );

  const runCue = useCallback(async (cue: SoundCue, force = false) => {
    if ((!enabledRef.current && !force) || document.hidden) return;

    try {
      const engine = engineRef.current ?? createEngine(new AudioContext());
      engineRef.current = engine;
      if (engine.context.state === "suspended") await engine.context.resume();
      scheduleCue(engine, cue, variationRef.current);
      variationRef.current += 1;
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
    if (suspendTimerRef.current !== null) {
      window.clearTimeout(suspendTimerRef.current);
      suspendTimerRef.current = null;
    }
    const next = !enabledRef.current;
    enabledRef.current = next;
    setEnabled(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));

    if (next) {
      void runCue("constellation", true);
    } else {
      const context = engineRef.current?.context;
      if (context?.state === "running") {
        suspendTimerRef.current = window.setTimeout(() => {
          suspendTimerRef.current = null;
          void context.suspend();
        }, 180);
      }
    }
  }, [runCue]);

  useEffect(() => {
    function handleInteraction(event: MouseEvent) {
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

      const element = event.target instanceof Element ? event.target : null;
      const soundTarget = element?.closest<HTMLElement>("[data-sound]");
      const cue = soundTarget?.dataset.sound;
      if (isSoundCue(cue)) {
        if (!(soundTarget instanceof HTMLButtonElement) || !soundTarget.disabled) play(cue);
        return;
      }

      const target = element?.closest("a[href]");
      if (!(target instanceof HTMLAnchorElement)) return;

      const url = new URL(target.href, window.location.href);
      if (
        url.origin === window.location.origin &&
        (url.pathname !== window.location.pathname || url.hash !== window.location.hash)
      ) {
        play("navigation");
      }
    }

    document.addEventListener("click", handleInteraction);
    return () => document.removeEventListener("click", handleInteraction);
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
