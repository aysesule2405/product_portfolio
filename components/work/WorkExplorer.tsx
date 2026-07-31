"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "@/components/work/ProjectCard";
import { categories } from "@/lib/data/categories";
import { projects } from "@/lib/data/projects";
import { buildTimelineNodes } from "@/lib/data/timeline";
import { hiringLenses, getHiringLens } from "@/lib/data/hiring";
import { categoryColorVar } from "@/lib/category-color";
import { ProblemCategory, Project } from "@/lib/types";

export type WorkView = "map" | "grid" | "list";

// The constellation is a large, animation-heavy client component only ever needed when
// someone actually opens map view — lazy-load it instead of shipping it to every visitor.
const CommitConstellation = dynamic(
  () => import("@/components/map/CommitConstellation").then((mod) => mod.CommitConstellation),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-line bg-bg-raised">
        <span className="font-mono text-xs text-ink-faint">Loading field map…</span>
      </div>
    ),
  }
);

/**
 * Shared explorer used both by the homepage's compact field-map section and the full
 * /work index. Owns filter/hiring-lens/view state and its own view-toggle row; the caller
 * supplies its own heading and anchor id around it.
 */
export function WorkExplorer({
  initialHiring,
  defaultView = "map",
  className,
}: {
  initialHiring?: string;
  defaultView?: WorkView;
  className?: string;
}) {
  const [view, setView] = useState<WorkView>(defaultView);
  const [hiringId, setHiringId] = useState<string | null>(initialHiring ?? null);
  const [activeFilter, setActiveFilter] = useState<ProblemCategory | null>(null);

  const nodes = useMemo(() => buildTimelineNodes(), []);
  const hiringLens = getHiringLens(hiringId ?? undefined);
  const highlightCategories = hiringLens?.categories;

  const filtered = useMemo(() => {
    return activeFilter ? projects.filter((project) => project.categories.includes(activeFilter)) : projects;
  }, [activeFilter]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Reveal subtle className="flex flex-wrap items-center gap-2">
          <span className="mb-1 w-full font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint sm:mb-0 sm:w-auto">
            What are you hiring for?
          </span>
          <button
            type="button"
            onClick={() => setHiringId(null)}
            aria-pressed={hiringId === null}
            className={clsx(
              "motion-press min-h-11 rounded-full border px-4 py-2 text-xs font-medium",
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
                "motion-press min-h-11 rounded-full border px-4 py-2 text-xs font-medium",
                hiringId === lens.id ? "border-transparent bg-ink text-bg" : "border-line text-ink-soft hover:border-line-strong"
              )}
            >
              {lens.label}
            </button>
          ))}
        </Reveal>

        <div className="grid w-full shrink-0 grid-cols-3 gap-1 rounded-full border border-line p-1 sm:flex sm:w-auto" role="group" aria-label="Choose a view">
          <ViewButton label="Map" active={view === "map"} onClick={() => setView("map")} />
          <ViewButton label="Grid" active={view === "grid"} onClick={() => setView("grid")} />
          <ViewButton label="List" active={view === "list"} onClick={() => setView("list")} />
        </div>
      </div>

      {view !== "map" ? (
        <Reveal subtle className="mt-6 flex flex-wrap gap-2">
          <div role="group" aria-label="Filter projects by problem type" className="flex flex-wrap gap-2">
            <FilterChip label="All studies" active={activeFilter === null} onClick={() => setActiveFilter(null)} />
            {categories.filter((cat) => cat.id !== "community-learning").map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.label}
                active={activeFilter === cat.id}
                onClick={() => setActiveFilter(cat.id === activeFilter ? null : cat.id)}
                category={cat.id}
              />
            ))}
          </div>
        </Reveal>
      ) : null}

      <Reveal subtle className="mt-8">
        {view === "map" ? (
          <CommitConstellation nodes={nodes} highlightCategories={highlightCategories} />
        ) : view === "grid" ? (
          <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((project) => (
                <ProjectCard key={project.slug} project={project} />
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <ProjectListRows projects={filtered} />
        )}
      </Reveal>
    </div>
  );
}

function ViewButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "motion-press min-h-11 rounded-full px-3 py-2 text-xs font-medium",
        active ? "bg-ink text-bg" : "text-ink-soft hover:text-ink"
      )}
    >
      {label}
    </button>
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
        "motion-press min-h-11 rounded-full border px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
        active
          ? "cat-tint-bg cat-tint-text border-transparent"
          : "border-line text-ink-soft hover:border-line-strong hover:text-ink"
      )}
    >
      {label}
    </button>
  );
}

/** Compact, scannable text-row list — the accessible equivalent to the map and grid views. */
function ProjectListRows({ projects: rows }: { projects: Project[] }) {
  return (
    <ul className="divide-y divide-line border-y border-line">
      {rows.map((project) => (
        <li key={project.slug}>
          <Link
            href={`/work/${project.slug}`}
            className="motion-press flex flex-col gap-1.5 py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
          >
            <div className="min-w-0">
              <p className="font-sans text-base font-semibold text-ink">{project.title}</p>
              <p className="mt-0.5 text-sm text-ink-soft">{project.oneLiner}</p>
            </div>
            {project.outcome ? (
              <p className="shrink-0 font-mono text-xs text-ink-faint sm:text-right">{project.outcome}</p>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
