"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Tag } from "@/components/ui/Tag";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { BrandGlow } from "@/components/ui/BrandGlow";
import { ProblemCategory } from "@/lib/types";

const heroTags: { label: string; category: ProblemCategory }[] = [
  { label: "AI tools", category: "ai-trust" },
  { label: "Product design", category: "design-systems" },
  { label: "Design systems", category: "design-systems" },
  { label: "Frontend", category: "creative-tools" },
  { label: "Education", category: "learning-workflows" },
  { label: "Data clarity", category: "data-clarity" },
  { label: "Emotional UX", category: "emotional-ux" },
  { label: "Accessibility", category: "campus-systems" },
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
        <span className="text-ink">&quot;I design the human layer of complex systems.&quot;</span>,
      </>
    ),
  },
  {
    n: 5,
    content: (
      <>
        &nbsp;&nbsp;role: <span className="text-ink-soft">&quot;Product designer &amp; design-minded engineer&quot;</span>,
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
            <pre className="font-mono text-[13px] leading-7 sm:text-[15px]">
              {codeLines.map((line) => (
                <div key={line.n} className="flex gap-4">
                  <span className="w-5 shrink-0 select-none text-right text-ink-faint">{line.n}</span>
                  <span className="min-w-0 flex-1 whitespace-pre-wrap break-words">{line.content}</span>
                </div>
              ))}
            </pre>

            <p className="mt-6 max-w-2xl border-l-2 border-line-strong pl-4 text-sm leading-relaxed text-ink-soft sm:text-base">
              Product designer and design-minded engineer building AI tools, learning
              systems, dashboards, and digital experiences that make complex workflows
              feel clear, trustworthy, and human.{" "}
              <em className="not-italic text-ink">I build with code. I think with art.</em>
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="#field-map"
                className="motion-press rounded-md bg-ink px-5 py-2.5 text-sm font-medium text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                View product work
              </Link>
              <Link
                href="/visual-practice"
                className="motion-press rounded-md border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
              >
                Explore visual work
              </Link>
              <Link
                href="/#contact"
                className="motion-press rounded-md px-5 py-2.5 text-sm font-medium text-ink-soft underline decoration-line-strong decoration-2 underline-offset-4 hover:text-ink"
              >
                Contact me
              </Link>
            </div>
          </div>
        </motion.div>

        <motion.ul
          aria-label="Areas of focus"
          className="mt-8 flex flex-wrap gap-2"
          initial="hidden"
          animate="show"
          variants={{
            hidden: {},
            show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
          }}
        >
          {heroTags.map((tag) => (
            <motion.li
              key={tag.label}
              variants={{
                hidden: { opacity: 0, y: 8, scale: 0.94 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Tag category={tag.category}>{tag.label}</Tag>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}
