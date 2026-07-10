"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useInView, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { TimelineLane, TimelineNode, TimelineNodeKind, ProblemCategory } from "@/lib/types";
import { categoryColorVar } from "@/lib/category-color";
import { categories } from "@/lib/data/categories";

const WIDTH = 1600;
const HEIGHT = 1000;

const CLUSTERS: { id: TimelineLane; label: string; cx: number; cy: number; spread: number; blurb: string }[] = [
  {
    id: "roots",
    label: "Practice",
    cx: 300,
    cy: 260,
    spread: 155,
    blurb: "Ceramics, painting, and design — where the eye training started, long before product work.",
  },
  {
    id: "experience",
    label: "Experience",
    cx: 1300,
    cy: 220,
    spread: 100,
    blurb: "Two internships and a campus IT role — systems, data, and design put into production.",
  },
  {
    id: "projects",
    label: "Work",
    cx: 800,
    cy: 610,
    spread: 175,
    blurb: "Seven shipped projects — AI tools, learning platforms, campus systems, and more.",
  },
  {
    id: "community",
    label: "Community",
    cx: 320,
    cy: 830,
    spread: 145,
    blurb: "Leading ACM-Women, GDSC, and Design Club — mentoring 70+ students along the way.",
  },
];

const POPOVER_WIDTH = 236;
const POPOVER_HEIGHT = 168;

const MAGNITUDE: Record<TimelineNodeKind, number> = {
  project: 11,
  experience: 8,
  "visual-work": 8,
  community: 7,
  artwork: 6,
};

interface PositionedNode extends TimelineNode {
  x: number;
  y: number;
  r: number;
  order: number;
}

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic per-string hash — lets each star pick a stable "personality"
 * (twinkle timing) from its id, without a separate random seed to track. */
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Decorative, non-interactive background stars for atmosphere — seeded so
 * the field is stable across renders instead of reshuffling. */
function useBackgroundStars(count: number) {
  return useMemo(() => {
    const rand = mulberry32(1337);
    return Array.from({ length: count }, () => ({
      x: rand() * WIDTH,
      y: rand() * HEIGHT,
      r: 0.6 + rand() * 1.6,
      o: 0.15 + rand() * 0.35,
    }));
  }, [count]);
}

/** Scatters a cluster's members around its anchor with even, organic
 * coverage (golden-angle spiral) — the same distribution real starfields
 * and sunflower seed-heads use, so points never land in a grid. */
function spiralScatter(cx: number, cy: number, count: number, spread: number) {
  const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
  return Array.from({ length: count }, (_, i) => {
    const r = spread * Math.sqrt((i + 0.6) / count);
    const theta = i * GOLDEN_ANGLE;
    return { x: cx + r * Math.cos(theta), y: cy + r * Math.sin(theta) };
  });
}

/** Greedy nearest-neighbor visiting order, so the connecting line traces a
 * clean asterism shape through spatially close stars instead of jumping
 * around in whatever order the data happened to list them. */
function nearestNeighborOrder(points: { x: number; y: number }[]): number[] {
  if (points.length === 0) return [];
  const visited = new Set([0]);
  const order = [0];
  while (order.length < points.length) {
    const last = points[order[order.length - 1]];
    let bestIdx = -1;
    let bestDist = Infinity;
    points.forEach((p, i) => {
      if (visited.has(i)) return;
      const d = (p.x - last.x) ** 2 + (p.y - last.y) ** 2;
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    });
    if (bestIdx === -1) break;
    visited.add(bestIdx);
    order.push(bestIdx);
  }
  return order;
}

function linePath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }
  return d;
}

function usePositionedNodes(nodes: TimelineNode[]): PositionedNode[] {
  return useMemo(() => {
    const result: PositionedNode[] = [];
    CLUSTERS.forEach((cluster) => {
      const members = nodes
        .filter((n) => n.lane === cluster.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      const points = spiralScatter(cluster.cx, cluster.cy, members.length, cluster.spread);
      members.forEach((node, i) => {
        result.push({ ...node, x: points[i].x, y: points[i].y, r: MAGNITUDE[node.kind] ?? 7, order: result.length });
      });
    });
    return result;
  }, [nodes]);
}

/** A four-point sparkle, authored centered on its own local origin so it
 * rotates cleanly once translated to a node's (x, y) via a wrapping motion.g. */
function Sparkle({ scale = 1 }: { scale?: number }) {
  const s = scale;
  return (
    <path
      d={`M0,${-8 * s} C${1 * s},${-2 * s} ${2 * s},${-1 * s} ${8 * s},0 C${2 * s},${1 * s} ${1 * s},${2 * s} 0,${8 * s} C${-1 * s},${2 * s} ${-2 * s},${1 * s} ${-8 * s},0 C${-2 * s},${-1 * s} ${-1 * s},${-2 * s} 0,${-8 * s} Z`}
      fill="currentColor"
    />
  );
}

/** A single star: reveals in on first scroll into view, twinkles gently at
 * rest, then hands over to the hover/select spin+glow treatment. */
function Star({
  node,
  isActive,
  isDimmed,
  revealed,
  shouldReduceMotion,
}: {
  node: PositionedNode;
  isActive: boolean;
  isDimmed: boolean;
  revealed: boolean;
  shouldReduceMotion: boolean;
}) {
  const baseScale = node.r / 6;
  const revealDelay = Math.min(node.order * 0.035, 0.9);
  const seed = hashString(node.id);
  const idleDuration = 2.6 + mulberry32(seed)() * 2.2;
  const idleDelay = mulberry32(seed + 17)() * 2.5;

  return (
    <g opacity={isDimmed ? 0.24 : 1} style={{ transition: "opacity 0.2s ease" }}>
      <motion.circle
        style={{ x: node.x, y: node.y, color: categoryColorVar(node.category) }}
        fill="currentColor"
        filter="url(#star-glow)"
        initial={false}
        animate={
          isActive
            ? shouldReduceMotion
              ? { opacity: 0.45, r: node.r + 7 }
              : { opacity: [0.15, 0.5, 0.15], r: [node.r + 3, node.r + 8, node.r + 3] }
            : { opacity: 0, r: node.r + 2 }
        }
        transition={
          isActive && !shouldReduceMotion
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 0.25 }
        }
      />

      <motion.g
        style={{ x: node.x, y: node.y, color: categoryColorVar(node.category) }}
        initial={{ opacity: 0, scale: 0 }}
        animate={
          !revealed
            ? { opacity: 0, scale: 0, rotate: 0 }
            : isActive
              ? { opacity: 1, scale: baseScale * 1.4, rotate: shouldReduceMotion ? 0 : 360 }
              : { opacity: shouldReduceMotion ? 1 : [0.82, 1, 0.82], scale: baseScale, rotate: 0 }
        }
        transition={
          !revealed
            ? { duration: 0.3 }
            : isActive
              ? {
                  scale: { duration: 0.3, ease: "easeOut" },
                  opacity: { duration: 0.2 },
                  rotate: shouldReduceMotion
                    ? { duration: 0.3 }
                    : { duration: 1.8, repeat: Infinity, ease: "linear" },
                }
              : {
                  scale: { duration: 0.4, delay: revealDelay, ease: "easeOut" },
                  opacity: shouldReduceMotion
                    ? { duration: 0.4, delay: revealDelay }
                    : {
                        duration: idleDuration,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: revealDelay + idleDelay,
                      },
                }
        }
      >
        <Sparkle />
      </motion.g>

      <motion.text
        x={node.x}
        y={node.y + node.r + 20}
        textAnchor="middle"
        className="fill-ink-soft font-mono"
        style={{ fontSize: 12 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: revealed ? 1 : 0 }}
        transition={{ duration: 0.4, delay: revealed ? revealDelay + 0.15 : 0 }}
      >
        {node.title.length > 16 ? `${node.title.slice(0, 15)}…` : node.title}
      </motion.text>
    </g>
  );
}

export function CommitConstellation({
  nodes,
  highlightCategories,
}: {
  nodes: TimelineNode[];
  highlightCategories?: ProblemCategory[];
}) {
  const positioned = usePositionedNodes(nodes);
  const backgroundStars = useBackgroundStars(90);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [autoStartTour, setAutoStartTour] = useState(false);
  const [legendActive, setLegendActive] = useState<ProblemCategory | null>(null);
  const [prevHighlight, setPrevHighlight] = useState(highlightCategories);
  const shouldReduceMotion = useReducedMotion();

  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, amount: 0.3 });

  // Clears the legend's own selection whenever the hiring lens changes, so a
  // stale legend pick doesn't silently override the new lens. Adjusting
  // state during render (not in an effect) is the sanctioned way to react to
  // a prop change without an extra render pass.
  if (prevHighlight !== highlightCategories) {
    setPrevHighlight(highlightCategories);
    setLegendActive(null);
  }

  const effectiveHighlight = legendActive ? [legendActive] : highlightCategories;

  const byId = useMemo(() => {
    const map = new Map<string, PositionedNode>();
    positioned.forEach((n) => map.set(n.id, n));
    return map;
  }, [positioned]);

  const clusterPaths = useMemo(() => {
    return CLUSTERS.map((cluster) => {
      const members = positioned.filter((n) => n.lane === cluster.id);
      const order = nearestNeighborOrder(members);
      const ordered = order.map((i) => members[i]);
      return { id: cluster.id, d: linePath(ordered) };
    });
  }, [positioned]);

  const threads = useMemo(() => {
    const seen = new Set<string>();
    const result: { d: string; category: ProblemCategory; key: string }[] = [];
    positioned.forEach((node) => {
      node.threadsTo.forEach((otherId) => {
        const other = byId.get(otherId);
        if (!other || other.lane === node.lane) return;
        const key = [node.id, otherId].sort().join("::");
        if (seen.has(key)) return;
        seen.add(key);
        const d = `M ${node.x} ${node.y} L ${other.x} ${other.y}`;
        result.push({ d, category: node.category, key });
      });
    });
    return result;
  }, [positioned, byId]);

  const selected = selectedId ? byId.get(selectedId) : undefined;

  function dimmed(node: PositionedNode) {
    if (!effectiveHighlight || effectiveHighlight.length === 0) return false;
    return !effectiveHighlight.includes(node.category);
  }

  function popoverPosition(node: PositionedNode) {
    const clampedX = Math.min(Math.max(node.x - POPOVER_WIDTH / 2, 8), WIDTH - POPOVER_WIDTH - 8);
    const below = node.y < HEIGHT / 2;
    const y = below ? node.y + 24 : node.y - 24 - POPOVER_HEIGHT;
    return { x: clampedX, y, below };
  }

  const svgBody = (
    <>
      <defs>
        <filter id="star-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="4" result="blur" />
        </filter>
      </defs>

      {backgroundStars.map((s, i) => (
        <circle key={`bg-${i}`} cx={s.x} cy={s.y} r={s.r} fill="var(--ink-faint)" opacity={s.o} />
      ))}

      <ShootingStar shouldReduceMotion={!!shouldReduceMotion} />

      {CLUSTERS.map((cluster) => (
        <text
          key={cluster.id}
          x={cluster.cx}
          y={cluster.cy - cluster.spread - 22}
          textAnchor="middle"
          className="fill-ink-faint font-mono"
          style={{ fontSize: 13, letterSpacing: "0.14em", textTransform: "uppercase" }}
        >
          {cluster.label}
        </text>
      ))}

      {threads.map((thread, i) => (
        <motion.path
          key={thread.key}
          d={thread.d}
          fill="none"
          stroke={categoryColorVar(thread.category)}
          strokeWidth={1}
          strokeDasharray="2 5"
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 0.28 : 0 }}
          transition={{ duration: 0.8, delay: 1.1 + (i % 7) * 0.05 }}
        />
      ))}

      {clusterPaths.map((cluster, i) => (
        <motion.path
          key={cluster.id}
          d={cluster.d}
          fill="none"
          stroke="var(--line-strong)"
          strokeWidth={1.3}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: 0.6 } : { pathLength: 0, opacity: 0 }}
          transition={{
            pathLength: { duration: 1, delay: i * 0.25, ease: "easeInOut" },
            opacity: { duration: 0.3, delay: i * 0.25 },
          }}
        />
      ))}

      {positioned.map((node) => (
        <Star
          key={node.id}
          node={node}
          isActive={node.id === hoveredId || node.id === selectedId}
          isDimmed={dimmed(node)}
          revealed={isInView}
          shouldReduceMotion={!!shouldReduceMotion}
        />
      ))}

      {positioned.map((node) => (
        <foreignObject key={`hit-${node.id}`} x={node.x - 20} y={node.y - 20} width={40} height={40}>
          <button
            type="button"
            onClick={() => setSelectedId(node.id === selectedId ? null : node.id)}
            onMouseEnter={() => setHoveredId(node.id)}
            onMouseLeave={() => setHoveredId((v) => (v === node.id ? null : v))}
            onFocus={() => setHoveredId(node.id)}
            onBlur={() => setHoveredId((v) => (v === node.id ? null : v))}
            aria-label={`${node.title}, ${node.dateLabel}`}
            aria-pressed={node.id === selectedId}
            className="h-10 w-10 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          />
        </foreignObject>
      ))}

      <AnimatePresence>
        {selected ? (
          (() => {
            const pos = popoverPosition(selected);
            return (
              <foreignObject
                key={selected.id}
                x={pos.x}
                y={pos.y}
                width={POPOVER_WIDTH}
                height={POPOVER_HEIGHT}
                style={{ overflow: "visible" }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.75, y: pos.below ? -8 : 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{
                    transformOrigin: pos.below ? "top center" : "bottom center",
                    ["--cat-color" as string]: categoryColorVar(selected.category),
                  }}
                  className="cat-tint-border rounded-xl border bg-bg-raised p-4 shadow-xl"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="cat-tint-text font-mono text-[10px] uppercase tracking-[0.1em]">
                      {selected.dateLabel}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      aria-label="Close"
                      className="text-xs text-ink-faint hover:text-ink-soft"
                    >
                      ✕
                    </button>
                  </div>
                  <h3 className="mt-1.5 font-sans text-base font-semibold leading-snug text-ink">
                    {selected.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-ink-soft">
                    {selected.summary}
                  </p>
                  {selected.href ? (
                    <Link
                      href={selected.href}
                      className="cat-tint-text mt-2 inline-flex items-center gap-1.5 text-xs font-medium hover:underline"
                    >
                      {selected.kind === "project" ? "Read the case study" : "See the connection"}
                      <svg width="12" height="9" viewBox="0 0 14 10" fill="none" aria-hidden>
                        <path
                          d="M0.5 5H13M13 5L9 1M13 5L9 9"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </Link>
                  ) : null}
                </motion.div>
              </foreignObject>
            );
          })()
        ) : null}
      </AnimatePresence>
    </>
  );

  return (
    <div ref={containerRef}>
      <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-raised">
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="block w-full"
          role="img"
          aria-label="A constellation connecting product projects, work experience, visual practice, and community roles, grouped into four star clusters and threaded together by shared themes. Hover or focus a star to preview it; select it to open details."
        >
          {svgBody}
        </svg>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAutoStartTour(true);
              setFullscreen(true);
            }}
            className="hidden items-center gap-1.5 rounded-full border border-line bg-bg/85 px-3 py-1.5 font-mono text-[11px] text-ink-soft backdrop-blur-sm hover:border-line-strong hover:text-ink sm:flex"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
            Take the tour
          </button>
          <button
            type="button"
            onClick={() => {
              setAutoStartTour(false);
              setFullscreen(true);
            }}
            className="flex items-center gap-1.5 rounded-full border border-line bg-bg/85 px-3 py-1.5 font-mono text-[11px] text-ink-soft backdrop-blur-sm hover:border-line-strong hover:text-ink"
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
              <path
                d="M6 2H2v4M10 2h4v4M6 14H2v-4M10 14h4v-4"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Explore
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {categories.map((cat) => {
          const active = legendActive === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setLegendActive((prev) => (prev === cat.id ? null : cat.id))}
              aria-pressed={active}
              className={clsx(
                "flex items-center gap-1.5 rounded-full px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                active ? "bg-bg-inset text-ink" : "text-ink-faint hover:text-ink-soft"
              )}
            >
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: categoryColorVar(cat.id) }} />
              {cat.shortLabel}
            </button>
          );
        })}
      </div>

      {fullscreen ? (
        <ConstellationFullscreen
          onClose={() => setFullscreen(false)}
          autoStartTour={autoStartTour}
          onTourStart={() => setSelectedId(null)}
        >
          {svgBody}
        </ConstellationFullscreen>
      ) : null}
    </div>
  );
}

/** A rare, subtle streak across the background starfield — purely
 * atmospheric, skipped entirely when the viewer prefers reduced motion. */
function ShootingStar({ shouldReduceMotion }: { shouldReduceMotion: boolean }) {
  const [star, setStar] = useState<{ key: number; fromX: number; fromY: number; toX: number; toY: number } | null>(
    null
  );

  useEffect(() => {
    if (shouldReduceMotion) return;
    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    let key = 0;

    function schedule() {
      const delay = 9000 + Math.random() * 8000;
      showTimer = setTimeout(() => {
        const fromX = Math.random() * WIDTH * 0.6;
        const fromY = Math.random() * HEIGHT * 0.3;
        const angle = Math.PI / 5 + Math.random() * (Math.PI / 8);
        const dist = 260 + Math.random() * 160;
        key += 1;
        setStar({
          key,
          fromX,
          fromY,
          toX: fromX + Math.cos(angle) * dist,
          toY: fromY + Math.sin(angle) * dist,
        });
        hideTimer = setTimeout(() => setStar(null), 1100);
        schedule();
      }, delay);
    }

    schedule();
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <AnimatePresence>
      {star ? (
        <motion.line
          key={star.key}
          stroke="var(--ink-faint)"
          strokeWidth={1.5}
          strokeLinecap="round"
          initial={{ x1: star.fromX, y1: star.fromY, x2: star.fromX, y2: star.fromY, opacity: 0 }}
          animate={{ x1: star.fromX, y1: star.fromY, x2: star.toX, y2: star.toY, opacity: [0, 0.8, 0] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      ) : null}
    </AnimatePresence>
  );
}

/** Where the view should land so a given cluster's anchor sits centered in
 * the viewport, accounting for the svg's internal 0.75x render scale and the
 * wrapper's center-origin transform (see the derivation in the tour effect
 * below — kept as a pure function so the math only lives in one place). */
function viewForCluster(cluster: { cx: number; cy: number }, scale: number) {
  return {
    x: scale * 0.75 * (WIDTH / 2 - cluster.cx),
    y: scale * 0.75 * (HEIGHT / 2 - cluster.cy),
    scale,
  };
}

function ConstellationFullscreen({
  onClose,
  children,
  autoStartTour = false,
  onTourStart,
}: {
  onClose: () => void;
  children: React.ReactNode;
  autoStartTour?: boolean;
  onTourStart?: () => void;
}) {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; viewX: number; viewY: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [tourActive, setTourActive] = useState(autoStartTour);
  const [tourStep, setTourStep] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Runs once, deferred, for the case where the tour auto-starts on mount
  // (the "Take the tour" entry point on the embedded card).
  useEffect(() => {
    if (!autoStartTour) return;
    const t = setTimeout(() => onTourStart?.(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function clampScale(scale: number) {
    return Math.min(Math.max(scale, 0.6), 3);
  }

  function reset() {
    setView({ x: 0, y: 0, scale: 1 });
  }

  function stopTour() {
    setTourActive(false);
  }

  function startTour() {
    onTourStart?.();
    setTourStep(0);
    setTourActive(true);
  }

  useEffect(() => {
    if (!tourActive) return;
    const showTimer = setTimeout(() => setView(viewForCluster(CLUSTERS[tourStep], 1.6)), 0);
    const isLast = tourStep >= CLUSTERS.length - 1;
    const advanceTimer = setTimeout(
      () => {
        if (isLast) {
          setTourActive(false);
          setView({ x: 0, y: 0, scale: 1 });
        } else {
          setTourStep((s) => s + 1);
        }
      },
      shouldReduceMotion ? (isLast ? 5200 : 4800) : isLast ? 4200 : 3800
    );
    return () => {
      clearTimeout(showTimer);
      clearTimeout(advanceTimer);
    };
  }, [tourActive, tourStep, shouldReduceMotion]);

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    if (tourActive) stopTour();
    const delta = -e.deltaY * 0.0015;
    setView((v) => ({ ...v, scale: clampScale(v.scale * (1 + delta)) }));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (tourActive) stopTour();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, viewX: view.x, viewY: view.y };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setView((v) => ({ ...v, x: dragRef.current!.viewX + dx, y: dragRef.current!.viewY + dy }));
  }

  function onPointerUp() {
    dragRef.current = null;
    setDragging(false);
  }

  function zoomBy(factor: number) {
    if (tourActive) stopTour();
    setView((v) => ({ ...v, scale: clampScale(v.scale * factor) }));
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg" role="dialog" aria-modal="true" aria-label="Field map, expanded">
      <div className="flex h-12 items-center justify-between border-b border-line px-4">
        <p className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint sm:block">
          Field map — drag to explore, scroll to zoom
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={tourActive ? stopTour : startTour}
            className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-ink-soft hover:border-line-strong hover:text-ink"
          >
            {tourActive ? "Exit tour" : "Take the tour"}
          </button>
          <button
            type="button"
            onClick={() => zoomBy(0.85)}
            aria-label="Zoom out"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-soft hover:border-line-strong hover:text-ink"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1 / 0.85)}
            aria-label="Zoom in"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-soft hover:border-line-strong hover:text-ink"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              stopTour();
              reset();
            }}
            className="rounded-md border border-line px-2.5 py-1 font-mono text-[11px] text-ink-soft hover:border-line-strong hover:text-ink"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close expanded field map"
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-ink-soft hover:border-line-strong hover:text-ink"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="relative h-[calc(100%-3rem)] w-full">
        <div
          className="h-full w-full touch-none overflow-hidden"
          style={{ cursor: dragging ? "grabbing" : "grab" }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        >
          <div
            className="flex h-full w-full items-center justify-center"
            style={{
              transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
              transformOrigin: "center center",
              transition: dragging ? "none" : "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <svg
              viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
              width={WIDTH * 0.75}
              height={HEIGHT * 0.75}
              role="img"
              aria-hidden
            >
              {children}
            </svg>
          </div>
        </div>

        {tourActive ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-md rounded-xl border border-line bg-bg-raised/95 p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {tourStep + 1} / {CLUSTERS.length} · {CLUSTERS[tourStep].label}
                </p>
                <button
                  type="button"
                  onClick={stopTour}
                  className="text-xs text-ink-faint hover:text-ink-soft"
                >
                  Exit tour
                </button>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{CLUSTERS[tourStep].blurb}</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
