"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { ProblemCategory, Project, TimelineNode } from "@/lib/types";

export type WorkView = "map" | "grid" | "list";

function FieldMapPlaceholder() {
  return (
    <div
      className="flex aspect-[16/10] w-full items-center justify-center rounded-2xl border border-line bg-bg-raised"
      aria-busy="true"
      aria-label="Loading field map"
    >
      <span className="font-mono text-xs text-ink-faint">Loading field map…</span>
    </div>
  );
}

// The constellation is a large, animation-heavy client component only ever needed when
// someone actually opens map view — lazy-load it instead of shipping it to every visitor.
const CommitConstellation = dynamic(
  () => import("@/components/map/CommitConstellation").then((mod) => mod.CommitConstellation),
  {
    ssr: false,
    loading: FieldMapPlaceholder,
  }
);

function DeferredConstellation({
  nodes,
  highlightCategories,
}: {
  nodes: TimelineNode[];
  highlightCategories?: ProblemCategory[];
}) {
  const triggerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setReady(true);
        observer.disconnect();
      },
      { rootMargin: "600px 0px" }
    );

    observer.observe(trigger);
    return () => observer.disconnect();
  }, []);

  return <div ref={triggerRef}>{ready ? <CommitConstellation nodes={nodes} highlightCategories={highlightCategories} /> : <FieldMapPlaceholder />}</div>;
}

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
  const [hiringId, setHiringId] = useState<string | null>(
    getHiringLens(initialHiring)?.id ?? null
  );
  const [activeFilter, setActiveFilter] = useState<ProblemCategory | null>(null);

  const nodes = useMemo(() => buildTimelineNodes(), []);
  const hiringLens = getHiringLens(hiringId ?? undefined);
  const highlightCategories = hiringLens?.categories;

  const filtered = useMemo(() => {
    return projects.filter((project) => {
      const matchesProblem = !activeFilter || project.categories.includes(activeFilter);
      const matchesHiringLens =
        !hiringLens ||
        project.categories.some((category) => hiringLens.categories.includes(category));
      return matchesProblem && matchesHiringLens;
    });
  }, [activeFilter, hiringLens]);

  return (
    <div className={className}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Reveal subtle className="flex flex-wrap items-center gap-2">
          <span className="mb-1 w-full font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint sm:mb-0 sm:w-auto">
            What are you hiring for?
          </span>
          <button
            type="button"
            data-sound="navigation"
            onClick={() => {
              setHiringId(null);
              setActiveFilter(null);
            }}
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
              data-sound="navigation"
              onClick={() => {
                setHiringId(lens.id === hiringId ? null : lens.id);
                setActiveFilter(null);
              }}
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
            {categories
              .filter(
                (category) =>
                  category.id !== "community-learning" &&
                  (!hiringLens || hiringLens.categories.includes(category.id))
              )
              .map((category) => (
                <FilterChip
                  key={category.id}
                  label={category.label}
                  active={activeFilter === category.id}
                  onClick={() =>
                    setActiveFilter(category.id === activeFilter ? null : category.id)
                  }
                  category={category.id}
                />
              ))}
          </div>
        </Reveal>
      ) : null}

      <Reveal subtle className="mt-8">
        {view === "map" ? (
          <DeferredConstellation nodes={nodes} highlightCategories={highlightCategories} />
        ) : view === "grid" ? (
          <motion.div layout className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((project, index) => (
                <ProjectCard key={project.slug} project={project} priority={index === 0} />
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
      data-sound="navigation"
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
      data-sound="navigation"
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
