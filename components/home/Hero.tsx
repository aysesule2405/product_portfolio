"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { BrandGlow } from "@/components/ui/BrandGlow";
import { positioning } from "@/lib/data/positioning";

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

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div aria-hidden className="grid-field grid-field-fade absolute inset-x-0 top-0 h-[420px] opacity-40" />
      <BrandGlow className="-right-24 -top-32 h-[520px] w-[520px] rotate-12 sm:-right-16 sm:-top-20" />

      <Container className="relative pt-12 pb-16 sm:pt-16 sm:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="motion-card overflow-hidden rounded-2xl border border-line bg-bg-raised/90 shadow-2xl shadow-black/20 backdrop-blur-xl"
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
          className="mt-8 font-mono text-xs text-ink-faint"
        >
          {focusAreas.join(" · ")}
        </motion.p>
      </Container>
    </section>
  );
}
