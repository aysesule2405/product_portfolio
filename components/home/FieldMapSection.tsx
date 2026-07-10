"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "@/components/work/ProjectCard";
import { CommitConstellation } from "@/components/map/CommitConstellation";
import { categories } from "@/lib/data/categories";
import { projects } from "@/lib/data/projects";
import { buildTimelineNodes } from "@/lib/data/timeline";
import { hiringLenses, getHiringLens } from "@/lib/data/hiring";
import { categoryColorVar } from "@/lib/category-color";
import { ProblemCategory } from "@/lib/types";

export function FieldMapSection({ initialHiring }: { initialHiring?: string }) {
  const [view, setView] = useState<"map" | "list">("map");
  const [hiringId, setHiringId] = useState<string | null>(initialHiring ?? null);
  const [activeFilter, setActiveFilter] = useState<ProblemCategory | null>(null);

  const nodes = useMemo(() => buildTimelineNodes(), []);
  const hiringLens = getHiringLens(hiringId ?? undefined);
  const highlightCategories = hiringLens?.categories;

  const filtered = useMemo(() => {
    if (!activeFilter) return projects;
    return projects.filter((p) => p.categories.includes(activeFilter));
  }, [activeFilter]);

  return (
    <section id="field-map" className="scroll-mt-20 border-t border-line py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Field map"
              title="What I make clear"
              description="Product work, work experience, visual practice, and community roles as four star clusters on one field — each one its own constellation, threaded to the others wherever the work shares a problem type. Expand it full-screen to explore."
            />
            <div className="flex shrink-0 gap-1 rounded-full border border-line p-1">
              <button
                type="button"
                onClick={() => setView("map")}
                aria-pressed={view === "map"}
                className={clsx(
                  "motion-press rounded-full px-3 py-1.5 text-xs font-medium",
                  view === "map" ? "bg-ink text-bg" : "text-ink-soft hover:text-ink"
                )}
              >
                Map view
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                aria-pressed={view === "list"}
                className={clsx(
                  "motion-press rounded-full px-3 py-1.5 text-xs font-medium",
                  view === "list" ? "bg-ink text-bg" : "text-ink-soft hover:text-ink"
                )}
              >
                List view
              </button>
            </div>
          </div>
        </Reveal>

        <Reveal subtle className="mt-8 flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
            What are you hiring for?
          </span>
          <button
            type="button"
            onClick={() => setHiringId(null)}
            aria-pressed={hiringId === null}
            className={clsx(
              "motion-press rounded-full border px-3 py-1.5 text-xs font-medium",
              hiringId === null ? "border-transparent bg-ink text-bg" : "border-line text-ink-soft hover:border-line-strong"
            )}
          >
            Show everything
          </button>
          {hiringLenses.map((lens) => (
            <button
              key={lens.id}
              type="button"
              onClick={() => setHiringId(lens.id === hiringId ? null : lens.id)}
              aria-pressed={hiringId === lens.id}
              title={lens.description}
              className={clsx(
                "motion-press rounded-full border px-3 py-1.5 text-xs font-medium",
                hiringId === lens.id ? "border-transparent bg-ink text-bg" : "border-line text-ink-soft hover:border-line-strong"
              )}
            >
              {lens.label}
            </button>
          ))}
        </Reveal>

        {view === "map" ? (
          <Reveal subtle className="mt-8">
            <CommitConstellation nodes={nodes} highlightCategories={highlightCategories} />
          </Reveal>
        ) : (
          <Reveal subtle className="mt-8">
            <div role="group" aria-label="Filter projects by problem type" className="flex flex-wrap gap-2">
              <FilterChip label="All studies" active={activeFilter === null} onClick={() => setActiveFilter(null)} />
              {categories.map((cat) => (
                <FilterChip
                  key={cat.id}
                  label={cat.label}
                  active={activeFilter === cat.id}
                  onClick={() => setActiveFilter(cat.id === activeFilter ? null : cat.id)}
                  category={cat.id}
                />
              ))}
            </div>

            <motion.div layout className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {filtered.map((project) => (
                  <ProjectCard key={project.slug} project={project} />
                ))}
              </AnimatePresence>
            </motion.div>
          </Reveal>
        )}
      </Container>
    </section>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  category,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  category?: ProblemCategory;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={category ? { ["--cat-color" as string]: categoryColorVar(category) } : undefined}
      className={clsx(
        "motion-press rounded-full border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        active
          ? "cat-tint-bg cat-tint-text border-transparent"
          : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}
