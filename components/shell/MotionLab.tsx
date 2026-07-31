"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { motionPurpose, motionEasing } from "@/lib/motion";

const purposeOrder: { key: keyof typeof motionPurpose; label: string; explain: string }[] = [
  { key: "feedback", label: "Feedback", explain: "Buttons, fields, tabs, filters — immediate, so the interface never feels laggy." },
  { key: "orientation", label: "Orientation", explain: "Modals, page transitions, filtering — long enough to preserve spatial relationships." },
  { key: "explanation", label: "Explanation", explain: "Diagrams, timelines, persistent identity — slower, because it's teaching something." },
  { key: "atmosphere", label: "Atmosphere", explain: "Stars, water, gentle drift — slow and low-contrast so it never competes with reading." },
];

function LabSection({ title, explain, children }: { title: string; explain: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line py-6 first:border-t-0 first:pt-0">
      <h3 className="font-sans text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-ink-soft">{explain}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function DurationDemo() {
  const [run, setRun] = useState<{
    key: (typeof purposeOrder)[number]["key"] | null;
    version: number;
  }>({ key: null, version: 0 });

  return (
    <div className="flex flex-wrap gap-2">
      {purposeOrder.map(({ key, label }) => {
        const token = motionPurpose[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => setRun((value) => ({ key, version: value.version + 1 }))}
            className="motion-press flex flex-col items-start gap-2 rounded-lg border border-line px-3 py-2 text-left hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
              {label} · {Math.round(token.duration * 1000)}ms
            </span>
            <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-bg-inset">
              <motion.span
                key={run.key === key ? `${key}-${run.version}` : key}
                className="absolute inset-y-0 left-0 w-4 rounded-full bg-accent"
                initial={{ x: 0 }}
                animate={run.key === key ? { x: [0, 72, 0] } : { x: 0 }}
                transition={{ duration: token.duration, ease: token.ease as never }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}

function EasingDemo() {
  const [run, setRun] = useState(0);
  const [x1, y1, x2, y2] = motionEasing;

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg width="72" height="72" viewBox="0 0 100 100" className="shrink-0 rounded-lg border border-line bg-bg-inset">
        <path d="M10,90 L10,90" fill="none" />
        <path
          d={`M10,90 C${10 + x1 * 80},${90 - y1 * 80} ${10 + x2 * 80},${90 - y2 * 80} 90,10`}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <line x1="10" y1="10" x2="10" y2="90" stroke="var(--line)" strokeWidth="1" />
        <line x1="10" y1="90" x2="90" y2="90" stroke="var(--line)" strokeWidth="1" />
      </svg>
      <div className="flex-1 space-y-2">
        <button
          type="button"
          onClick={() => setRun((value) => value + 1)}
          className="motion-press rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          Run eased vs linear
        </button>
        <div className="space-y-2">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-inset">
            <motion.span
              key={`eased-${run}`}
              className="absolute inset-y-0 left-0 w-4 rounded-full bg-accent"
              initial={{ x: "0%" }}
              animate={run > 0 ? { x: ["0%", "94%"] } : { x: "0%" }}
              transition={{ duration: 0.6, ease: motionEasing }}
            />
          </div>
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-bg-inset">
            <motion.span
              key={`linear-${run}`}
              className="absolute inset-y-0 left-0 w-4 rounded-full bg-ink-faint"
              initial={{ x: "0%" }}
              animate={run > 0 ? { x: ["0%", "94%"] } : { x: "0%" }}
              transition={{ duration: 0.6, ease: "linear" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SpringDemo() {
  const [snappyOn, setSnappyOn] = useState(false);
  const [softOn, setSoftOn] = useState(false);

  return (
    <div className="flex flex-wrap gap-8">
      <button
        type="button"
        onClick={() => setSnappyOn((v) => !v)}
        className="flex flex-col items-center gap-2 focus-visible:outline-none"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">Snappy</span>
        <span className="flex h-10 w-20 items-center rounded-full bg-bg-inset px-1">
          <motion.span
            className="h-8 w-8 rounded-full bg-accent focus-visible:ring-2 focus-visible:ring-accent"
            animate={{ x: snappyOn ? 40 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          />
        </span>
      </button>
      <button
        type="button"
        onClick={() => setSoftOn((v) => !v)}
        className="flex flex-col items-center gap-2 focus-visible:outline-none"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">Soft</span>
        <span className="flex h-10 w-20 items-center rounded-full bg-bg-inset px-1">
          <motion.span
            className="h-8 w-8 rounded-full bg-accent-strong"
            animate={{ x: softOn ? 40 : 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 12 }}
          />
        </span>
      </button>
    </div>
  );
}

function ButtonStatesDemo() {
  return (
    <div className="flex flex-wrap gap-3">
      <button type="button" className="motion-press rounded-md bg-ink px-4 py-2 text-sm font-medium text-bg">
        Default
      </button>
      <button type="button" className="motion-press rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink hover:bg-bg-inset">
        Hover me
      </button>
      <button type="button" className="motion-press rounded-md border border-line-strong px-4 py-2 text-sm font-medium text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
        Tab to me
      </button>
      <button type="button" disabled className="rounded-md border border-line px-4 py-2 text-sm font-medium text-ink-faint opacity-50">
        Disabled
      </button>
    </div>
  );
}

function ModalTransitionDemo() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="motion-press rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Open example modal
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: motionPurpose.orientation.duration }}
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Example modal"
              className="w-full max-w-xs rounded-xl border border-line bg-bg-raised p-5 shadow-2xl"
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: motionPurpose.orientation.duration, ease: motionPurpose.orientation.ease as never }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-sans text-sm font-semibold text-ink">Orientation-duration modal</p>
              <p className="mt-1 text-xs text-ink-soft">
                {Math.round(motionPurpose.orientation.duration * 1000)}ms, spatial — long enough to track, short
                enough to not wait on.
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="motion-press mt-3 rounded-md border border-line-strong px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg-inset"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

function SharedElementDemo() {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="flex min-h-[88px] items-start">
      <motion.button
        type="button"
        layout
        onClick={() => setExpanded((v) => !v)}
        transition={{ duration: motionPurpose.explanation.duration, ease: motionPurpose.explanation.ease as never }}
        className={
          expanded
            ? "cat-tint-bg cat-tint-text flex w-full flex-col items-start gap-1 rounded-xl border border-line-strong p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            : "cat-tint-bg cat-tint-text flex h-10 w-10 items-center justify-center rounded-full border border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        }
        style={{ ["--cat-color" as string]: "var(--accent)" }}
      >
        <motion.span layout="position" className="font-mono text-[10px] uppercase tracking-[0.1em]">
          ●
        </motion.span>
        {expanded ? (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-xs">
            Same element, same identity — only what changed animates. Click to collapse.
          </motion.span>
        ) : null}
      </motion.button>
    </div>
  );
}

function ReducedMotionDemo({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const [run, setRun] = useState(0);
  return (
    <div>
      <p className="text-xs text-ink-soft">
        Your system is currently set to{" "}
        <span className="font-medium text-ink">{shouldReduceMotion ? "reduced motion" : "full motion"}</span>. This
        row simulates both regardless, for comparison.
      </p>
      <button
        type="button"
        onClick={() => setRun((value) => value + 1)}
        className="motion-press mt-3 rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-line-strong hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        Trigger comparison
      </button>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">Full motion</p>
          <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-inset">
            <motion.span
              key={`full-${run}`}
              className="absolute inset-y-0 left-0 w-4 rounded-full bg-accent"
              initial={{ x: "0%" }}
              animate={run > 0 ? { x: ["0%", "88%"] } : { x: "0%" }}
              transition={{ duration: 0.5, ease: motionEasing }}
            />
          </div>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">Reduced motion</p>
          <div className="relative mt-2 h-1.5 w-full overflow-hidden rounded-full bg-bg-inset">
            <motion.span
              key={`reduced-${run}`}
              className="absolute inset-y-0 left-0 w-4 rounded-full bg-ink-faint"
              initial={{ x: "0%" }}
              animate={run > 0 ? { x: "88%" } : { x: "0%" }}
              transition={{ duration: 0.01 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MotionLab({ onClose }: { onClose: () => void }) {
  const shouldReduceMotion = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => previousFocus?.focus();
  }, []);

  function trapFocus(e: React.KeyboardEvent<HTMLElement>) {
    if (e.key !== "Tab") return;
    const focusable = [...(dialogRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    ) ?? [])];
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Motion Lab"
        onKeyDown={trapFocus}
        className="relative flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-xl border border-line bg-bg shadow-2xl"
        initial={shouldReduceMotion ? false : { opacity: 0, y: -10, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6, scale: 0.985 }}
        transition={{ duration: 0.22, ease: motionEasing }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">Command palette</p>
            <h2 className="font-sans text-base font-semibold text-ink">Motion Lab</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close Motion Lab"
            className="motion-press flex h-8 w-8 items-center justify-center rounded-full border border-line-strong text-ink-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto px-5 pb-6">
          <LabSection title="Duration tokens" explain="Every animation in the system picks one of four durations, by purpose, not by feel.">
            <DurationDemo />
          </LabSection>
          <LabSection title="Easing curve" explain="One curve, used everywhere motion needs to feel deliberate rather than mechanical.">
            <EasingDemo />
          </LabSection>
          <LabSection title="Spring examples" explain="Springs read as physical, not timed — used sparingly, for toggles and playful feedback.">
            <SpringDemo />
          </LabSection>
          <LabSection title="Button states" explain="Focus, hover, and disabled states stay consistent across the system — tab through these.">
            <ButtonStatesDemo />
          </LabSection>
          <LabSection title="Modal transitions" explain="Orientation-duration motion — preserves where you are, never feels like a jump cut.">
            <ModalTransitionDemo />
          </LabSection>
          <LabSection title="Shared-element transition" explain="One element persists across a state change — only the parts that changed animate.">
            <SharedElementDemo />
          </LabSection>
          <LabSection title="Reduced-motion comparison" explain="Every animation in the system has a reduced-motion equivalent — never just disabled.">
            <ReducedMotionDemo shouldReduceMotion={Boolean(shouldReduceMotion)} />
          </LabSection>
        </div>
      </motion.div>
    </motion.div>
  );
}
