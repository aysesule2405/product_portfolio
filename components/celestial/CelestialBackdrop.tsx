"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface Star {
  id: number;
  x: number;
  y: number;
  r: number;
  color: string;
  glow: string;
  opacity: number;
  points: number;
  rotation: number;
  spin: boolean;
  spinDuration: number;
}

interface ShootingStar {
  id: number;
  star: Star;
  dx: number;
  dy: number;
}

const STAR_COLORS = [
  { color: "#76adff", glow: "rgba(81,148,255,0.45)", weight: 0.14 },
  { color: "#b9d6ff", glow: "rgba(159,200,255,0.38)", weight: 0.18 },
  { color: "#fff7e3", glow: "rgba(255,247,227,0.34)", weight: 0.28 },
  { color: "#f5ddb0", glow: "rgba(245,221,176,0.26)", weight: 0.2 },
  { color: "#d4ad54", glow: "rgba(212,173,84,0.24)", weight: 0.14 },
  { color: "#e1905b", glow: "rgba(225,144,91,0.2)", weight: 0.06 },
];

const backdropStyle = {
  background:
    "radial-gradient(circle at 80% 22%, rgba(63,105,172,0.16), transparent 28rem), radial-gradient(circle at 12% 82%, rgba(185,214,255,0.08), transparent 24rem), linear-gradient(180deg, color-mix(in srgb, var(--bg) 76%, transparent), color-mix(in srgb, var(--bg) 88%, #050b17))",
};

const gridStyle = {
  backgroundImage:
    "linear-gradient(color-mix(in srgb, var(--accent) 10%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--cat-data-clarity) 10%, transparent) 1px, transparent 1px)",
  backgroundSize: "96px 96px",
};

function randomSeed(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function pickStarColor(random: () => number) {
  const roll = random();
  let cursor = 0;
  for (const starColor of STAR_COLORS) {
    cursor += starColor.weight;
    if (roll <= cursor) return starColor;
  }
  return STAR_COLORS[2];
}

function buildStars(count: number): Star[] {
  const random = randomSeed(20260710);
  return Array.from({ length: count }, (_, id) => {
    const size = random();
    const r = size < 0.035 ? 1.75 : size < 0.14 ? 0.98 : 0.46;
    const starColor = pickStarColor(random);
    return {
      id,
      x: random() * 100,
      y: random() * 100,
      r,
      color: starColor.color,
      glow: starColor.glow,
      opacity: 0.14 + random() * 0.58,
      points: random() > 0.78 ? 6 : 4,
      rotation: random() * 90,
      spin: r > 0.9 && random() > 0.62,
      spinDuration: 8 + random() * 16,
    };
  });
}

function findNearestStar(stars: Star[], x: number, y: number) {
  let nearest: Star | null = null;
  let distance = Infinity;
  for (const star of stars) {
    if (star.r < 0.9) continue;
    const dx = star.x - x;
    const dy = star.y - y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d < distance) {
      nearest = star;
      distance = d;
    }
  }
  return distance < 5 ? nearest : null;
}

function starClipPath(points: number) {
  const outer = 50;
  const inner = 18;
  const coords: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (i * Math.PI) / points - Math.PI / 2;
    coords.push(`${50 + radius * Math.cos(angle)}% ${50 + radius * Math.sin(angle)}%`);
  }
  return `polygon(${coords.join(", ")})`;
}

export function CelestialBackdrop() {
  const shouldReduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const stars = useMemo(() => buildStars(280), []);
  const brightStars = useMemo(() => stars.filter((star) => star.r > 1), [stars]);
  const [hoveredStar, setHoveredStar] = useState<Star | null>(null);
  const [shootingStars, setShootingStars] = useState<ShootingStar[]>([]);
  const lastScrollY = useRef(0);
  const shotId = useRef(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!mounted || shouldReduceMotion) return;
    function handlePointerMove(event: PointerEvent) {
      const x = (event.clientX / window.innerWidth) * 100;
      const y = (event.clientY / window.innerHeight) * 100;
      setHoveredStar(findNearestStar(stars, x, y));
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [mounted, shouldReduceMotion, stars]);

  useEffect(() => {
    if (!mounted || shouldReduceMotion) return;
    function launchShot() {
      const index = Math.abs(Math.floor(window.scrollY / 113)) % brightStars.length;
      const star = brightStars[index];
      if (!star) return;
      const id = shotId.current++;
      const shot = {
        id,
        star,
        dx: 12 + (id % 5) * 2,
        dy: 8 + (id % 3) * 2,
      };
      setShootingStars((items) => [...items.slice(-3), shot]);
      window.setTimeout(() => {
        setShootingStars((items) => items.filter((item) => item.id !== id));
      }, 1300);
    }

    function handleScroll() {
      if (Math.abs(window.scrollY - lastScrollY.current) < 320) return;
      lastScrollY.current = window.scrollY;
      launchShot();
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [brightStars, mounted, shouldReduceMotion]);

  if (!mounted) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0" style={backdropStyle} />
        <div className="absolute inset-0 opacity-28" style={gridStyle} />
      </div>
    );
  }

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0" style={backdropStyle} />
      <div className="absolute inset-0 opacity-28" style={gridStyle} />

      {stars.map((star) => {
        const size = star.r * 8;
        return (
          <motion.span
            key={star.id}
            className="absolute block"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: size,
              height: size,
              opacity: star.opacity,
              backgroundColor: star.color,
              clipPath: starClipPath(star.points),
              filter: star.r > 0.9 ? `drop-shadow(0 0 ${star.r * 5}px ${star.glow})` : undefined,
              x: "-50%",
              y: "-50%",
              rotate: star.rotation,
            }}
            animate={
              shouldReduceMotion
                ? undefined
                : {
                    opacity: [star.opacity * 0.58, star.opacity, star.opacity * 0.7],
                    rotate: star.spin ? [star.rotation, star.rotation + 360] : star.rotation,
                  }
            }
            transition={{
              opacity: { duration: 3.2 + (star.id % 9) * 0.42, repeat: Infinity, ease: "easeInOut" },
              rotate: { duration: star.spinDuration, repeat: Infinity, ease: "linear" },
            }}
          />
        );
      })}

      {hoveredStar ? (
        <motion.span
          key={hoveredStar.id}
          className="absolute rounded-full border"
          style={{
            left: `${hoveredStar.x}%`,
            top: `${hoveredStar.y}%`,
            borderColor: hoveredStar.color,
          }}
          initial={{
            width: hoveredStar.r * 10,
            height: hoveredStar.r * 10,
            opacity: 0.68,
            x: "-50%",
            y: "-50%",
          }}
          animate={{
            width: hoveredStar.r * 34,
            height: hoveredStar.r * 34,
            opacity: 0,
            x: "-50%",
            y: "-50%",
          }}
          transition={{ duration: 0.9, repeat: Infinity, ease: "easeOut" }}
        />
      ) : null}

      {shootingStars.map((shot) => (
        <motion.span
          key={shot.id}
          className="absolute h-px origin-left rounded-full"
          style={{
            left: `${shot.star.x}%`,
            top: `${shot.star.y}%`,
            width: `${shot.dx * 0.7}vw`,
            rotate: "32deg",
            background: `linear-gradient(90deg, transparent, ${shot.star.color}, transparent)`,
            boxShadow: `0 0 14px ${shot.star.glow}`,
          }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{
            scaleX: [0, 1, 1],
            opacity: [0, 0.9, 0],
            x: [0, shot.dx * 1.4, shot.dx * 4.8],
            y: [0, shot.dy * 1.4, shot.dy * 4.8],
          }}
          transition={{ duration: 1.15, ease: "easeOut" }}
        />
      ))}

      <svg className="absolute inset-0 h-full w-full opacity-50" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="constellation-line" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor="rgba(185,214,255,0.1)" />
            <stop offset="0.5" stopColor="rgba(201,168,76,0.2)" />
            <stop offset="1" stopColor="rgba(118,173,255,0.08)" />
          </linearGradient>
        </defs>

        <g stroke="url(#constellation-line)" strokeWidth="0.08" fill="none" vectorEffect="non-scaling-stroke">
          <path d="M8 74 L18 66 L27 72 L40 57 L52 64" />
          <path d="M62 22 L70 28 L78 23 L88 33 L96 28" />
          <path d="M4 28 L14 19 L24 24 L34 16" />
          <path d="M58 86 L66 78 L76 82 L88 72" />
        </g>
      </svg>
    </div>
  );
}
