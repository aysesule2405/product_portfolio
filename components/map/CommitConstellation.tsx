"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion, useReducedMotion, useInView, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { TimelineLane, TimelineNode, TimelineNodeKind, ProblemCategory } from "@/lib/types";
import { categoryColorVar } from "@/lib/category-color";
import { categories } from "@/lib/data/categories";
import { WavesBackground } from "@/components/celestial/WavesBackground";

const WIDTH = 1600;
const HEIGHT = 1000;
const FULLSCREEN_SVG_SCALE = 0.92;

const CLUSTERS: { id: TimelineLane; label: string; cx: number; cy: number; spread: number; blurb: string }[] = [
  {
    id: "roots",
    label: "Practice",
    cx: 370,
    cy: 285,
    spread: 220,
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
    cx: 1180,
    cy: 720,
    spread: 175,
    blurb: "Seven shipped projects — AI tools, learning platforms, campus systems, and more.",
  },
  {
    id: "community",
    label: "Community",
    cx: 320,
    cy: 830,
    spread: 205,
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

const SKY_CONSTELLATIONS = [
  // Real constellations — shapes checked against their actual asterisms.
  {
    id: "orion",
    name: "Orion",
    x: 1120,
    y: 700,
    scale: 1.2,
    // Two shoulders + three-star belt + two feet — the hourglass silhouette
    // that makes Orion recognizable, rather than an arbitrary polygon.
    points: [
      [10, 0], // Betelgeuse (shoulder)
      [110, 14], // Bellatrix (shoulder)
      [46, 58], // Mintaka (belt)
      [62, 66], // Alnilam (belt)
      [78, 74], // Alnitak (belt)
      [26, 132], // Saiph (foot)
      [104, 140], // Rigel (foot)
    ],
    lines: [
      [0, 2],
      [1, 4],
      [2, 3],
      [3, 4],
      [2, 5],
      [4, 6],
    ],
  },
  {
    id: "cassiopeia",
    name: "Cassiopeia",
    x: 720,
    y: 160,
    scale: 1.05,
    points: [
      [0, 44],
      [48, 4],
      [94, 54],
      [142, 12],
      [196, 58],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
    ],
  },
  {
    id: "ursa-major",
    name: "Ursa Major",
    x: 1040,
    y: 120,
    scale: 1.0,
    points: [
      [0, 54],
      [48, 20],
      [96, 40],
      [138, 14],
      [194, 18],
      [244, 52],
      [202, 94],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 3],
    ],
  },
  {
    id: "cygnus",
    name: "Cygnus",
    x: 170,
    y: 560,
    scale: 0.95,
    // Deneb–Sadr–Albireo as the main axis, with the two wingtips on
    // opposite sides of the hub so it actually reads as the Northern Cross.
    points: [
      [78, 0], // Deneb (tail)
      [70, 62], // Sadr (hub)
      [54, 148], // Albireo (head)
      [0, 80], // Gienah (wingtip)
      [150, 46], // Delta Cygni (wingtip)
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
      [1, 4],
    ],
  },
  {
    id: "lyra",
    name: "Lyra",
    x: 1320,
    y: 500,
    scale: 0.92,
    points: [
      [0, 0],
      [52, 30],
      [100, 18],
      [126, 66],
      [70, 96],
      [22, 58],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 1],
    ],
  },
  {
    id: "taurus",
    name: "Taurus",
    x: 650,
    y: 900,
    scale: 0.85,
    // The Hyades "V" (Aldebaran as the eye) with the two horn lines
    // extending outward, same simplification most star charts use.
    points: [
      [100, 40], // Aldebaran (eye)
      [55, 80], // vertex
      [10, 45], // other V tip
      [130, 0], // horn tip
      [5, 0], // horn tip
    ],
    lines: [
      [0, 1],
      [1, 2],
      [0, 3],
      [2, 4],
    ],
  },
  {
    id: "pegasus",
    name: "Pegasus",
    x: 560,
    y: 45,
    scale: 0.85,
    // The Great Square with a neck-and-head line off one corner.
    points: [
      [0, 0],
      [110, 0],
      [110, 110],
      [0, 110],
      [-40, 140],
      [-80, 170],
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [3, 4],
      [4, 5],
    ],
  },
  // Invented asterisms named after pieces from the art portfolio — same
  // decorative style as the real ones, drawn from the visual-practice work
  // (see lib/data/visual-work.ts) instead of the night sky.
  {
    id: "venus",
    name: "Venus",
    x: 110,
    y: 90,
    scale: 0.85,
    // A standing figure in contrapposto, after "Venus After Botticelli".
    points: [
      [50, 0], // head
      [50, 20], // neck
      [38, 60], // waist
      [54, 60], // hip
      [30, 130], // left foot
      [66, 130], // right foot
    ],
    lines: [
      [0, 1],
      [1, 2],
      [1, 3],
      [2, 4],
      [3, 5],
    ],
  },
  {
    id: "girl-moon",
    name: "Girl & Moon",
    x: 1520,
    y: 70,
    scale: 0.8,
    // A crescent moon with a small figure looking up at it, after "Girl & Moon".
    points: [
      [40, 0], // crescent tip
      [65, 22], // crescent outer
      [70, 48], // crescent outer
      [48, 70], // crescent tip
      [8, 88], // girl's head
      [8, 120], // girl's feet
    ],
    lines: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
  {
    id: "night-sea",
    name: "Night Sea",
    x: 1450,
    y: 880,
    scale: 0.9,
    // Waves under a moon with its reflection, after "Night Sea".
    points: [
      [60, 0], // moon
      [0, 50], // wave
      [25, 65], // wave
      [50, 48], // wave
      [75, 66], // wave
      [100, 50], // wave
      [60, 80], // reflection
    ],
    lines: [
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [0, 6],
    ],
  },
];

interface PositionedNode extends TimelineNode {
  x: number;
  y: number;
  r: number;
  order: number;
}

interface AsterismPath {
  id: string;
  d: string;
  dash?: string;
  opacity: number;
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

function jitter(seed: number, amount: number) {
  return (mulberry32(seed)() - 0.5) * amount;
}

/** Rounds to 3 decimal places so coordinate strings serialize identically
 * between server and client — Math.cos/Math.sin can differ by a single
 * float64 ULP across JS engines, which otherwise trips a React hydration
 * mismatch on these node positions. */
function round(n: number) {
  return Math.round(n * 1000) / 1000;
}

/** Each field-map lane gets a different asterism silhouette. Keeping this
 * deterministic avoids hydration drift while breaking the old repeated
 * spiral fingerprint across all four clusters. */
function constellationScatter(cluster: (typeof CLUSTERS)[number], members: TimelineNode[]) {
  const count = members.length;
  const last = Math.max(count - 1, 1);

  return members.map((node, i) => {
    const t = count === 1 ? 0.5 : i / last;
    const seed = hashString(`${cluster.id}-${node.id}`);

    if (cluster.id === "roots") {
      const angle = (-155 + t * 205) * (Math.PI / 180);
      const radius = cluster.spread * (0.58 + (i % 3) * 0.18);
      return {
        x: round(cluster.cx + Math.cos(angle) * radius + jitter(seed, 30)),
        y: round(cluster.cy + Math.sin(angle) * radius * 0.78 + jitter(seed + 1, 26)),
      };
    }

    if (cluster.id === "experience") {
      const row = i % 2 === 0 ? -1 : 1;
      return {
        x: round(cluster.cx + (t - 0.5) * cluster.spread * 1.55 + jitter(seed, 22)),
        y: round(cluster.cy + row * (42 + i * 8) + (0.5 - Math.abs(t - 0.5)) * 54 + jitter(seed + 1, 18)),
      };
    }

    if (cluster.id === "projects") {
      const wave = Math.sin(t * Math.PI * 2.2) * 82;
      const step = i % 3 === 0 ? -34 : i % 3 === 1 ? 18 : 52;
      const horizontalSpread = cluster.spread * 2;
      return {
        x: round(cluster.cx - horizontalSpread + t * horizontalSpread * 2 + jitter(seed, 28)),
        y: round(cluster.cy + wave + step + jitter(seed + 1, 22)),
      };
    }

    if (cluster.id === "community") {
      const columns = 3;
      const col = i % columns;
      const row = Math.floor(i / columns);
      const rowOffset = row % 2 === 0 ? 0 : 44;
      return {
        x: round(cluster.cx - 150 + col * 130 + rowOffset + jitter(seed, 18)),
        y: round(cluster.cy - 96 + row * 94 + (col === 1 ? -20 : col === 2 ? 18 : 0) + jitter(seed + 1, 16)),
      };
    }

    const angle = (t * 330 - 70) * (Math.PI / 180);
    const radius = cluster.spread * (0.56 + (i % 4) * 0.12);
    return {
      x: round(cluster.cx + Math.cos(angle) * radius * 0.9 + jitter(seed, 26)),
      y: round(cluster.cy + Math.sin(angle) * radius * 0.7 + (i % 2 === 0 ? -18 : 22) + jitter(seed + 1, 24)),
    };
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

function branchPath(from: { x: number; y: number }, to: { x: number; y: number }) {
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`;
}

function realConstellationPath(constellation: (typeof SKY_CONSTELLATIONS)[number], line: number[]) {
  const from = constellation.points[line[0]];
  const to = constellation.points[line[1]];
  return `M ${from[0]} ${from[1]} L ${to[0]} ${to[1]}`;
}

function RealSkyConstellations() {
  return (
    <g className="field-map-night-layer" opacity="0.62" aria-hidden>
      {SKY_CONSTELLATIONS.map((constellation, index) => (
        <motion.g
          key={constellation.id}
          transform={`translate(${constellation.x} ${constellation.y}) scale(${constellation.scale})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.15 + index * 0.08 }}
        >
          <g fill="none" stroke="color-mix(in srgb, var(--star-yellow) 48%, var(--star-blue-white) 52%)" strokeWidth="1" strokeLinecap="round">
            {constellation.lines.map((line, i) => (
              <motion.path
                key={`${constellation.id}-line-${i}`}
                d={realConstellationPath(constellation, line)}
                strokeDasharray="4 7"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.38 }}
                transition={{ duration: 0.9, delay: 0.24 + index * 0.08 + i * 0.03, ease: "easeInOut" }}
              />
            ))}
          </g>
          {constellation.points.map(([x, y], i) => (
            <motion.circle
              key={`${constellation.id}-star-${i}`}
              cx={x}
              cy={y}
              r={i === 0 ? 3.2 : 2.2}
              fill={i === 0 ? "var(--star-blue-white)" : "var(--star-yellow)"}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: i === 0 ? 0.85 : 0.62, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.2 + index * 0.08 + i * 0.04 }}
            />
          ))}
          <text
            x={0}
            y={-14}
            className="fill-ink-faint font-mono"
            style={{ fontSize: 11, letterSpacing: "0.16em", textTransform: "uppercase" }}
          >
            {constellation.name}
          </text>
        </motion.g>
      ))}
    </g>
  );
}

function byAngle(points: PositionedNode[], cx: number, cy: number) {
  return [...points].sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
}

function clusterAsterisms(cluster: (typeof CLUSTERS)[number], members: PositionedNode[]): AsterismPath[] {
  if (members.length < 2) return [];
  const ordered = nearestNeighborOrder(members).map((i) => members[i]);
  const angular = byAngle(members, cluster.cx, cluster.cy);
  const paths: AsterismPath[] = [];

  if (cluster.id === "community") {
    paths.push({
      id: `${cluster.id}-orbit`,
      d: `${linePath([...angular, angular[0]])} Z`,
      dash: "7 10",
      opacity: 0.34,
    });
    const anchor = angular[Math.floor(angular.length / 2)];
    angular
      .filter((_, i) => i % 3 === 0)
      .slice(0, 3)
      .forEach((node, i) => {
        if (node.id !== anchor.id) paths.push({ id: `${cluster.id}-branch-${i}`, d: branchPath(anchor, node), opacity: 0.38 });
      });
    return paths;
  }

  if (cluster.id === "projects") {
    const upper = ordered.filter((node) => node.y <= cluster.cy + 26);
    const lower = ordered.filter((node) => node.y > cluster.cy + 26);
    paths.push({ id: `${cluster.id}-upper`, d: linePath(upper), opacity: 0.46 });
    paths.push({ id: `${cluster.id}-lower`, d: linePath(lower), opacity: 0.42 });
    if (upper.length && lower.length) {
      paths.push({
        id: `${cluster.id}-bridge-a`,
        d: branchPath(upper[Math.floor(upper.length / 2)], lower[Math.floor(lower.length / 2)]),
        dash: "4 8",
        opacity: 0.34,
      });
      paths.push({
        id: `${cluster.id}-bridge-b`,
        d: branchPath(upper[upper.length - 1], lower[0]),
        dash: "3 9",
        opacity: 0.28,
      });
    }
    return paths.filter((path) => path.d);
  }

  if (cluster.id === "experience") {
    const center = ordered.reduce((best, node) => {
      const bestDist = (best.x - cluster.cx) ** 2 + (best.y - cluster.cy) ** 2;
      const nodeDist = (node.x - cluster.cx) ** 2 + (node.y - cluster.cy) ** 2;
      return nodeDist < bestDist ? node : best;
    }, ordered[0]);
    ordered
      .filter((node) => node.id !== center.id)
      .forEach((node, i) => {
        paths.push({ id: `${cluster.id}-ray-${i}`, d: branchPath(center, node), opacity: i === 0 ? 0.46 : 0.34 });
      });
    return paths;
  }

  const main = ordered.filter((_, i) => i % 2 === 0);
  const branch = ordered.filter((_, i) => i % 2 === 1);
  paths.push({ id: `${cluster.id}-main`, d: linePath(main.length > 1 ? main : ordered), opacity: 0.48 });
  branch.slice(0, 3).forEach((node, i) => {
    const anchor = main[Math.min(i, main.length - 1)] ?? ordered[0];
    paths.push({ id: `${cluster.id}-branch-${i}`, d: branchPath(anchor, node), dash: i % 2 === 0 ? undefined : "4 8", opacity: 0.36 });
  });
  return paths.filter((path) => path.d);
}

function usePositionedNodes(nodes: TimelineNode[]): PositionedNode[] {
  return useMemo(() => {
    const result: PositionedNode[] = [];
    CLUSTERS.forEach((cluster) => {
      const members = nodes
        .filter((n) => n.lane === cluster.id)
        .sort((a, b) => a.date.localeCompare(b.date));
      const points = constellationScatter(cluster, members);
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

const SHELL_ASSETS = [
  { src: "/images/sea_shells/sea-shell-1.png", color: "#efb2a8" },
  { src: "/images/sea_shells/sea-shell-2.png", color: "#f8caac" },
  { src: "/images/sea_shells/sea-shell-3.png", color: "#f58581" },
  { src: "/images/sea_shells/sea-shell-4.png", color: "#fcc9ca" },
  { src: "/images/sea_shells/sea-shell-5.png", color: "#e8c9bc" },
] as const;

const CATEGORY_SHELL_INDEX: Record<ProblemCategory, number> = {
  "ai-trust": 0,
  "learning-workflows": 1,
  "data-clarity": 2,
  "campus-systems": 3,
  "emotional-ux": 4,
  "creative-tools": 0,
  "community-learning": 1,
  "design-systems": 2,
};

function shellVariant(category: ProblemCategory) {
  return CATEGORY_SHELL_INDEX[category];
}

function ShellIcon({ variant, scale = 1 }: { variant: number; scale?: number }) {
  const shell = SHELL_ASSETS[variant % SHELL_ASSETS.length];
  const size = 32 * scale;

  return (
    <image
      href={shell.src}
      x={-size / 2}
      y={-size / 2}
      width={size}
      height={size}
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
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
  const starColor = `color-mix(in srgb, ${categoryColorVar(node.category)} 54%, var(--star-yellow) 46%)`;
  const shellIndex = shellVariant(node.category);
  const shellColor = categoryColorVar(node.category);
  const shellAssetColor = SHELL_ASSETS[shellIndex].color;
  const shellScale = Math.max(0.68, node.r / 9);
  const shellIdleRotate = (seed % 13) - 6;

  return (
    <g opacity={isDimmed ? 0.24 : 1} style={{ transition: "opacity 0.2s ease" }}>
      <motion.circle
        className="field-map-star-layer"
        style={{ x: node.x, y: node.y, color: starColor }}
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
        className="field-map-star-layer"
        style={{ x: node.x, y: node.y, color: starColor }}
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

      <motion.circle
        className="field-map-shell-layer"
        cx={node.x}
        cy={node.y}
        fill="none"
        stroke={shellColor}
        strokeWidth={1.2}
        initial={false}
        animate={
          isActive && !shouldReduceMotion
            ? { opacity: [0.1, 0.36, 0.1], r: [node.r + 11, node.r + 21, node.r + 11] }
            : { opacity: isActive ? 0.2 : 0.07, r: node.r + 12 }
        }
        transition={isActive && !shouldReduceMotion ? { duration: 1.9, repeat: Infinity, ease: "easeInOut" } : { duration: 0.25 }}
      />

      <motion.g
        className="field-map-shell-layer"
        style={{ x: node.x, y: node.y, color: shellAssetColor }}
        initial={{ opacity: 0, scale: 0, rotate: shellIdleRotate }}
        animate={
          !revealed
            ? { opacity: 0, scale: 0, rotate: shellIdleRotate }
            : isActive
              ? {
                  opacity: 1,
                  scale: shellScale * 1.22,
                  rotate: shouldReduceMotion ? shellIdleRotate : [shellIdleRotate - 2, shellIdleRotate + 5, shellIdleRotate - 2],
                }
              : {
                  opacity: shouldReduceMotion ? 0.94 : [0.78, 0.96, 0.78],
                  scale: shellScale,
                  rotate: shellIdleRotate,
                }
        }
        transition={
          !revealed
            ? { duration: 0.3 }
            : isActive
              ? {
                  scale: { duration: 0.28, ease: "easeOut" },
                  opacity: { duration: 0.2 },
                  rotate: shouldReduceMotion ? { duration: 0.2 } : { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
                }
              : {
                  scale: { duration: 0.4, delay: revealDelay, ease: "easeOut" },
                  opacity: shouldReduceMotion
                    ? { duration: 0.4, delay: revealDelay }
                    : {
                        duration: idleDuration + 1.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: revealDelay + idleDelay,
                      },
                }
        }
      >
        <ShellIcon variant={shellIndex} scale={1} />
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
    return CLUSTERS.flatMap((cluster) => {
      const members = positioned.filter((n) => n.lane === cluster.id);
      return clusterAsterisms(cluster, members);
    });
  }, [positioned]);

  const threads = useMemo(() => {
    const seen = new Set<string>();
    const categoryCounts = new Map<ProblemCategory, number>();
    const result: { d: string; category: ProblemCategory; key: string; dash: string }[] = [];
    positioned.forEach((node) => {
      node.threadsTo.forEach((otherId) => {
        const other = byId.get(otherId);
        if (!other || other.lane === node.lane) return;
        const key = [node.id, otherId].sort().join("::");
        if (seen.has(key)) return;
        const count = categoryCounts.get(node.category) ?? 0;
        if (count >= 3) return;
        seen.add(key);
        categoryCounts.set(node.category, count + 1);
        const mx = (node.x + other.x) / 2;
        const my = (node.y + other.y) / 2 - 28 + (count % 2) * 56;
        const d = `M ${node.x} ${node.y} Q ${mx} ${my} ${other.x} ${other.y}`;
        result.push({ d, category: node.category, key, dash: count % 2 === 0 ? "2 8" : "1 7" });
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
        <circle className="field-map-night-layer" key={`bg-${i}`} cx={s.x} cy={s.y} r={s.r} fill="var(--ink-faint)" opacity={s.o} />
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
          className="field-map-thread"
          stroke={`color-mix(in srgb, ${categoryColorVar(thread.category)} 26%, var(--star-yellow) 74%)`}
          strokeWidth={0.9}
          strokeDasharray={thread.dash}
          initial={{ opacity: 0 }}
          animate={{ opacity: isInView ? 0.22 : 0 }}
          transition={{ duration: 0.8, delay: 1.1 + (i % 7) * 0.05 }}
        />
      ))}

      {clusterPaths.map((cluster, i) => (
        <motion.path
          key={cluster.id}
          d={cluster.d}
          fill="none"
          className="field-map-cluster-line"
          stroke="color-mix(in srgb, var(--star-yellow) 72%, var(--star-blue-white) 28%)"
          strokeWidth={1.1}
          strokeDasharray={cluster.dash}
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isInView ? { pathLength: 1, opacity: cluster.opacity } : { pathLength: 0, opacity: 0 }}
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
    <div ref={containerRef} className="field-map">
      <div className="field-map-card relative overflow-hidden rounded-2xl border border-line bg-bg-raised">
        <WavesBackground />
        <svg
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="field-map-svg block w-full"
          role="img"
          aria-label="A constellation connecting product projects, work experience, visual practice, and community roles, grouped into four star clusters and threaded together by shared themes. Hover or focus a star to preview it; select it to open details."
        >
          {svgBody}
        </svg>

        <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAutoStartTour(true);
              setFullscreen(true);
            }}
            className="field-map-action hidden min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[11px] backdrop-blur-sm sm:flex"
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
            className="field-map-action flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 font-mono text-[11px] backdrop-blur-sm"
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
                "flex min-h-10 items-center gap-1.5 rounded-full px-2 py-1 font-mono text-[10px] transition-colors sm:min-h-0 sm:px-1.5 sm:py-0.5",
                active ? "bg-bg-inset text-ink" : "text-ink-faint hover:text-ink-soft"
              )}
            >
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: categoryColorVar(cat.id) }}
              />
              {cat.shortLabel}
            </button>
          );
        })}
      </div>

      {fullscreen
        ? createPortal(
            <ConstellationFullscreen
              onClose={() => setFullscreen(false)}
              autoStartTour={autoStartTour}
              onTourStart={() => setSelectedId(null)}
              nodes={positioned}
            >
              {svgBody}
            </ConstellationFullscreen>,
            document.body
          )
        : null}
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
          className="field-map-night-layer"
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
 * the viewport, accounting for the svg's internal render scale and the
 * wrapper's center-origin transform (see the derivation in the tour effect
 * below — kept as a pure function so the math only lives in one place). */
function viewForCluster(cluster: { cx: number; cy: number }, scale: number) {
  return {
    x: scale * FULLSCREEN_SVG_SCALE * (WIDTH / 2 - cluster.cx),
    y: scale * FULLSCREEN_SVG_SCALE * (HEIGHT / 2 - cluster.cy),
    scale,
  };
}

function FieldMapList({
  nodes,
  onBackToMap,
}: {
  nodes: TimelineNode[];
  onBackToMap: () => void;
}) {
  return (
    <div id="field-map-list" className="h-full overflow-y-auto px-4 py-5 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              Accessible field index
            </p>
            <h2 className="mt-2 font-sans text-2xl font-semibold text-ink">Browse every constellation.</h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-soft">
              The same projects, experience, practice, and community work—organized as a readable list.
            </p>
          </div>
          <button
            type="button"
            onClick={onBackToMap}
            className="min-h-11 shrink-0 rounded-md border border-line px-3 py-2 font-mono text-[10px] text-ink-soft hover:border-line-strong hover:text-ink"
          >
            Back to map
          </button>
        </div>

        <div className="mt-7 grid gap-6 md:grid-cols-2">
          {CLUSTERS.map((cluster) => {
            const entries = nodes
              .filter((node) => node.lane === cluster.id)
              .sort((a, b) => b.date.localeCompare(a.date));

            return (
              <section key={cluster.id} className="overflow-hidden rounded-xl border border-line bg-bg-raised">
                <div className="border-b border-line px-4 py-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    {cluster.label} · {entries.length}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-soft">{cluster.blurb}</p>
                </div>
                <ul className="divide-y divide-line">
                  {entries.map((node) => {
                    const content = (
                      <>
                        <div className="flex items-start justify-between gap-3">
                          <span className="font-sans text-sm font-semibold text-ink">{node.title}</span>
                          <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-faint">
                            {node.dateLabel}
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{node.summary}</p>
                        <span className="mt-2 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-faint">
                          <span
                            aria-hidden
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: categoryColorVar(node.category) }}
                          />
                          {categories.find((category) => category.id === node.category)?.shortLabel}
                        </span>
                      </>
                    );

                    return (
                      <li key={node.id}>
                        {node.href ? (
                          <Link
                            href={node.href}
                            className="motion-press block min-h-11 px-4 py-3 hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                          >
                            {content}
                          </Link>
                        ) : (
                          <div className="px-4 py-3">{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ConstellationFullscreen({
  onClose,
  children,
  autoStartTour = false,
  onTourStart,
  nodes,
}: {
  onClose: () => void;
  children: React.ReactNode;
  autoStartTour?: boolean;
  onTourStart?: () => void;
  nodes: TimelineNode[];
}) {
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const dragRef = useRef<{ startX: number; startY: number; viewX: number; viewY: number } | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);
  const [tourActive, setTourActive] = useState(autoStartTour);
  const [tourStep, setTourStep] = useState(0);
  const [listOpen, setListOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Runs once, deferred, for the case where the tour auto-starts on mount
  // (the "Take the tour" entry point on the embedded card).
  useEffect(() => {
    if (!autoStartTour) return;
    const t = setTimeout(() => onTourStart?.(), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep keyboard focus and page scrolling inside the full-screen map until
  // the visitor closes it, then return them to the control that launched it.
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
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

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose]);

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
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    setView((v) => ({ ...v, x: drag.viewX + dx, y: drag.viewY + dy }));
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
    <div
      ref={dialogRef}
      className="field-map-fullscreen fixed inset-0 z-50 flex h-dvh flex-col bg-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Field map, expanded"
    >
      <WavesBackground />
      <div className="field-map-fullscreen-toolbar flex min-h-14 shrink-0 items-center justify-between border-b border-line px-2 sm:h-12 sm:min-h-12 sm:px-4">
        <p className="hidden font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint sm:block">
          Field map — drag to explore, scroll to zoom
        </p>
        <div className="flex w-full items-center justify-between gap-1 sm:w-auto sm:justify-start sm:gap-2">
          <button
            type="button"
            onClick={tourActive ? stopTour : startTour}
            className="min-h-11 rounded-md border border-line px-2.5 py-2 font-mono text-[10px] text-ink-soft hover:border-line-strong hover:text-ink sm:text-[11px]"
          >
            {tourActive ? "Exit tour" : "Take the tour"}
          </button>
          <button
            type="button"
            aria-controls="field-map-list"
            aria-pressed={listOpen}
            onClick={() => {
              stopTour();
              setListOpen((open) => !open);
            }}
            className="min-h-11 min-w-11 rounded-md border border-line px-2.5 py-2 font-mono text-[10px] text-ink-soft hover:border-line-strong hover:text-ink sm:hidden"
          >
            {listOpen ? "Map" : "List"}
          </button>
          <button
            type="button"
            onClick={() => zoomBy(0.85)}
            aria-label="Zoom out"
            className="hidden h-11 w-11 items-center justify-center rounded-md border border-line text-ink-soft hover:border-line-strong hover:text-ink min-[360px]:flex sm:h-9 sm:w-9"
          >
            −
          </button>
          <button
            type="button"
            onClick={() => zoomBy(1 / 0.85)}
            aria-label="Zoom in"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink-soft hover:border-line-strong hover:text-ink sm:h-9 sm:w-9"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => {
              stopTour();
              reset();
            }}
            className="min-h-11 rounded-md border border-line px-2.5 py-2 font-mono text-[10px] text-ink-soft hover:border-line-strong hover:text-ink sm:text-[11px]"
          >
            Reset
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close expanded field map"
            className="flex h-11 w-11 items-center justify-center rounded-md border border-line text-ink-soft hover:border-line-strong hover:text-ink sm:h-9 sm:w-9"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="relative min-h-0 w-full flex-1">
        {listOpen ? (
          <FieldMapList nodes={nodes} onBackToMap={() => setListOpen(false)} />
        ) : (
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
                width={WIDTH * FULLSCREEN_SVG_SCALE}
                height={HEIGHT * FULLSCREEN_SVG_SCALE}
                className="field-map-svg"
                role="img"
                aria-hidden
              >
                <RealSkyConstellations />
                {children}
              </svg>
            </div>
          </div>
        )}

        {tourActive && !listOpen ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center px-3 sm:bottom-6 sm:px-4">
            <div className="pointer-events-auto w-full max-w-md rounded-xl border border-line bg-bg-raised/95 p-4 shadow-xl backdrop-blur-sm">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                  {tourStep + 1} / {CLUSTERS.length} · {CLUSTERS[tourStep].label}
                </p>
                <button
                  type="button"
                  onClick={stopTour}
                  className="min-h-11 px-2 text-xs text-ink-faint hover:text-ink-soft"
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
