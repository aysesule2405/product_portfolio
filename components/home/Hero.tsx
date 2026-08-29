"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Container } from "@/components/ui/Container";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { BrandGlow } from "@/components/ui/BrandGlow";
import { HeroOrbit } from "@/components/home/Hero3D";
import { positioning } from "@/lib/data/positioning";
import { useNavReveal } from "@/lib/nav-reveal-context";
import { useReducedMotion } from "@/lib/motion";

const focusAreas = [
  "Product building",
  "Software engineering",
  "Product & UX design",
  "Creative technology",
  "Visual craft",
];

const codeLines = [
  { n: 1, content: <span className="text-ink-faint">{"// clarity-lab/index.tsx"}</span> },
  {
    n: 2,
    content: (
      <>
        <span className="text-accent">export const</span> positioning = {"{"}
      </>
    ),
  },
  {
    n: 3,
    content: (
      <>
        &nbsp;&nbsp;name: <span className="cat-tint-text" style={{ ["--cat-color" as string]: "var(--accent)" }}>&quot;Ayse Sule Ekiz&quot;</span>,
      </>
    ),
  },
  {
    n: 4,
    content: (
      <>
        &nbsp;&nbsp;headline:{" "}
        <span className="text-ink">&quot;{positioning.headline}&quot;</span>,
      </>
    ),
  },
  {
    n: 5,
    content: (
      <>
        &nbsp;&nbsp;role: <span className="text-ink-soft">&quot;{positioning.role}&quot;</span>,
      </>
    ),
  },
  { n: 6, content: <span>{"}"}</span> },
];

function ScrollCue() {
  const shouldReduceMotion = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none flex flex-col items-center gap-2">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
        Scroll to explore
      </span>
      <motion.svg
        width="14"
        height="20"
        viewBox="0 0 14 20"
        fill="none"
        className="text-ink-faint"
        animate={shouldReduceMotion ? {} : { y: [0, 6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      >
        <path
          d="M7 1v14M1 9l6 6 6-6"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </div>
  );
}

/** Both the balloon and the kites are real downloads with attribution
 * requirements, not procedural geometry — the balloon is CC-BY-4.0
 * (commercial use fine); the kites are CC-BY-NC-4.0 (noncommercial only —
 * flagged to and knowingly accepted by the site owner for this hackathon
 * entry, which carries no purchase/licensing fee itself). Only rendered
 * once the theme is known client-side to avoid a light/dark hydration
 * mismatch, and only in light mode since that's the only theme using either
 * asset. */
function ModelCredits() {
  const { resolvedTheme } = useTheme();
  // Same SSR-safe mount pattern as useReducedMotion in lib/motion.ts: stay
  // false through the first client paint (matching the server, which knows
  // no theme at all) so this never flashes/hydration-mismatches.
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  if (!hasMounted || resolvedTheme !== "light") return null;

  return (
    <div className="pointer-events-auto absolute bottom-3 right-3 flex flex-col items-end gap-0.5 font-mono text-[9px] uppercase tracking-[0.06em] text-ink-faint/70">
      <a
        href="https://sketchfab.com/3d-models/hot-air-balloon-3861f77828a9460ca3875f9eef00cef4"
        target="_blank"
        rel="noreferrer"
        className="hover:text-ink-soft hover:underline"
      >
        Hot Air Balloon by Jacob Thompson (CC BY 4.0)
      </a>
      <a
        href="https://sketchfab.com/3d-models/kites-in-clouds-127390bafd6a40ca9b96f27d40548970"
        target="_blank"
        rel="noreferrer"
        className="hover:text-ink-soft hover:underline"
      >
        Kites in Clouds by minhazmehedi (CC BY-NC 4.0)
      </a>
    </div>
  );
}

export function Hero() {
  const { revealNav } = useNavReveal();
  const introRef = useRef<HTMLDivElement>(null);

  // The nav stays closed for the moon/sun cover screen and opens for good the
  // moment the visitor scrolls far enough into the index.tsx intro to mean it
  // — not on the first pixel of scroll, which would fire before the cover
  // has really been left behind.
  useEffect(() => {
    const node = introRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        revealNav();
        observer.disconnect();
      },
      { threshold: 0.05 }
    );
    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* TopBar is h-11 (44px) and StatusBar is min-h-10/sm:h-8 (40px/32px) —
          both sit outside this section as flex siblings, so "fill the first
          screen" means 100dvh minus that chrome, not 100dvh itself. Full
          bleed on purpose — no border, no boxed-in canvas — the moon/sun
          scene owns the entire screen. */}
      <section className="relative h-[calc(100dvh-5.25rem)] min-h-[520px] overflow-hidden sm:h-[calc(100dvh-4.75rem)]">
        <HeroOrbit className="absolute inset-0" />
        <div className="pointer-events-none absolute inset-x-0 bottom-4 flex flex-col items-center gap-2 sm:bottom-6">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
            Drag to orbit · pinch or ⌃+scroll to zoom · click a cluster to explore
          </span>
          <ScrollCue />
        </div>
        <ModelCredits />
      </section>

      <section ref={introRef} className="relative overflow-hidden border-b border-line">
        <div aria-hidden className="grid-field grid-field-fade absolute inset-x-0 top-0 h-[420px] opacity-40" />
        <BrandGlow className="-right-24 -top-32 h-[520px] w-[520px] rotate-12 sm:-right-16 sm:-top-20" />

        <Container className="relative pt-12 pb-16 sm:pt-16 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="motion-card mx-auto max-w-3xl overflow-hidden rounded-2xl border border-line bg-bg-raised/90 shadow-2xl shadow-black/20 backdrop-blur-xl"
          >
            <WindowChrome filename="index.tsx" />

            <div className="px-5 py-6 sm:px-8 sm:py-9">
              <div className="font-mono text-[13px] leading-7 sm:text-[15px]">
                {codeLines.map((line) => (
                  <div key={line.n} className="flex gap-4">
                    <span className="w-5 shrink-0 select-none text-right text-ink-faint">{line.n}</span>
                    {line.n === 4 ? (
                      <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">
                        &nbsp;&nbsp;headline: <span className="text-ink">&quot;</span>
                        <h1 className="inline font-mono text-[inherit] font-normal text-ink">
                          {positioning.headline}
                        </h1>
                        <span className="text-ink">&quot;</span>,
                      </div>
                    ) : (
                      <div className="min-w-0 flex-1 whitespace-pre-wrap break-words">{line.content}</div>
                    )}
                  </div>
                ))}
              </div>

              <p className="mt-6 max-w-2xl border-l-2 border-line-strong pl-4 text-sm leading-relaxed text-ink-soft sm:text-base">
                {positioning.story}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="#selected-work"
                  className="motion-press inline-flex min-h-11 items-center rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  View selected work
                </Link>
                <Link
                  href="#field-map"
                  className="motion-press inline-flex min-h-11 items-center rounded-md border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  Explore the field map
                </Link>
              </div>

              <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                Computer Science · remote, hybrid, or onsite · open to US relocation
              </p>
            </div>
          </motion.div>

          <motion.p
            aria-label="Areas of focus"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3, ease: "easeOut" }}
            className="mt-8 text-center font-mono text-xs text-ink-faint"
          >
            {focusAreas.join(" · ")}
          </motion.p>
        </Container>
      </section>
    </>
  );
}
