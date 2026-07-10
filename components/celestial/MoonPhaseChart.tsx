"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { calculateMoonPhase, SYNODIC_MONTH } from "@/lib/moon-phase";

const moonImages = [
  { src: "/images/moon-phases/moon_01_new.png", alt: "New moon" },
  { src: "/images/moon-phases/moon_02_waxing_crescent.png", alt: "Waxing crescent moon" },
  { src: "/images/moon-phases/moon_03_first_quarter.png", alt: "First quarter moon" },
  { src: "/images/moon-phases/moon_04_waxing_gibbous.png", alt: "Waxing gibbous moon" },
  { src: "/images/moon-phases/moon_05_full.png", alt: "Full moon" },
  { src: "/images/moon-phases/moon_06_waning_gibbous.png", alt: "Waning gibbous moon" },
  { src: "/images/moon-phases/moon_07_third_quarter.png", alt: "Last quarter moon" },
  { src: "/images/moon-phases/moon_08_waning_crescent.png", alt: "Waning crescent moon" },
];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function phasePoint(index: number, radius: number, center: number) {
  const angle = (index / 8) * Math.PI * 2 - Math.PI / 2;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

export function MoonPhaseChart() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setNow(new Date()));
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearInterval(timer);
    };
  }, []);

  const phase = useMemo(() => (now ? calculateMoonPhase(now) : null), [now]);
  const currentImage = moonImages[phase?.phaseIndex ?? 0];
  const cycleProgress = phase ? phase.age / SYNODIC_MONTH : 0;
  const marker = phasePoint(cycleProgress * 8, 122, 150);
  const circumference = 2 * Math.PI * 118;

  return (
    <div className="motion-card overflow-hidden rounded-2xl border border-line bg-bg-raised/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-accent">Lunar phase</p>
        <p className="font-mono text-xs text-ink-faint">{now ? formatShortDate(now) : "--"}</p>
      </div>

      <div className="relative border-b border-line">
        <div
          aria-hidden
          className="absolute inset-0 opacity-45"
          style={{
            backgroundImage:
              "linear-gradient(var(--line) 1px, transparent 1px), linear-gradient(90deg, var(--line) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />

        <div className="relative mx-auto aspect-square w-full max-w-[390px] p-6 sm:p-8">
          <svg viewBox="0 0 300 300" className="absolute inset-0 h-full w-full">
            <defs>
              <linearGradient id="lunar-cycle-gold" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="rgba(240,216,145,0.95)" />
                <stop offset="1" stopColor="rgba(170,128,48,0.68)" />
              </linearGradient>
            </defs>

            {Array.from({ length: 48 }, (_, i) => {
              const angle = (i / 48) * Math.PI * 2 - Math.PI / 2;
              const major = i % 6 === 0;
              const inner = major ? 118 : 126;
              const outer = 132;
              return (
                <line
                  key={i}
                  x1={150 + Math.cos(angle) * inner}
                  y1={150 + Math.sin(angle) * inner}
                  x2={150 + Math.cos(angle) * outer}
                  y2={150 + Math.sin(angle) * outer}
                  stroke="rgba(201,168,76,0.28)"
                  strokeWidth={major ? 1.2 : 0.6}
                />
              );
            })}

            <circle cx="150" cy="150" r="136" fill="none" stroke="rgba(201,168,76,0.22)" strokeWidth="1" />
            <circle cx="150" cy="150" r="118" fill="none" stroke="rgba(201,168,76,0.24)" strokeWidth="1" />
            <circle cx="150" cy="150" r="94" fill="none" stroke="rgba(201,168,76,0.14)" strokeDasharray="5 12" />
            <circle
              cx="150"
              cy="150"
              r="118"
              fill="none"
              stroke="url(#lunar-cycle-gold)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${circumference * cycleProgress} ${circumference}`}
              transform="rotate(-90 150 150)"
            />

            <line x1="150" y1="14" x2="150" y2="42" stroke="rgba(201,168,76,0.38)" />
            <line x1="150" y1="258" x2="150" y2="286" stroke="rgba(201,168,76,0.38)" />
            <line x1="14" y1="150" x2="42" y2="150" stroke="rgba(201,168,76,0.38)" />
            <line x1="258" y1="150" x2="286" y2="150" stroke="rgba(201,168,76,0.38)" />
            <text x="150" y="49" textAnchor="middle" className="fill-accent font-mono" style={{ fontSize: 10 }}>
              New
            </text>
            <text x="150" y="265" textAnchor="middle" className="fill-accent font-mono" style={{ fontSize: 10 }}>
              Full
            </text>
            <text x="39" y="154" textAnchor="middle" className="fill-accent font-mono" style={{ fontSize: 10 }}>
              Q3
            </text>
            <text x="261" y="154" textAnchor="middle" className="fill-accent font-mono" style={{ fontSize: 10 }}>
              Q1
            </text>

            {phase ? (
              <g>
                <circle cx={marker.x} cy={marker.y} r="8" fill="var(--bg)" stroke="#f0d891" strokeWidth="2" />
                <path
                  d="M0,-4 L1.2,-1.2 L4,0 L1.2,1.2 L0,4 L-1.2,1.2 L-4,0 L-1.2,-1.2 Z"
                  transform={`translate(${marker.x} ${marker.y})`}
                  fill="#f0d891"
                />
              </g>
            ) : null}
          </svg>

          <div className="absolute inset-[22%]">
            <Image
              src={currentImage.src}
              alt={currentImage.alt}
              fill
              sizes="(min-width: 1024px) 280px, 65vw"
              className="object-contain drop-shadow-[0_0_28px_rgba(240,216,145,0.18)]"
              priority={false}
            />
          </div>

          <div className="absolute bottom-[24%] left-1/2 -translate-x-1/2 font-mono text-sm font-semibold text-accent">
            {phase ? `${Math.round(phase.illumination * 100)}%` : "--"}
          </div>
        </div>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-mono text-sm text-ink-faint">Phase</span>
          <span className="text-right font-mono text-sm font-semibold text-ink">
            {phase ? phase.phaseName : "Syncing"}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-mono text-sm text-ink-faint">Illumination</span>
          <span className="text-right font-mono text-sm font-semibold text-ink">
            {phase ? `${Math.round(phase.illumination * 100)}%` : "--"}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-mono text-sm text-ink-faint">Lunar Age</span>
          <span className="text-right font-mono text-sm font-semibold text-ink">
            {phase ? `${phase.age.toFixed(1)} days` : "--"}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-mono text-sm text-ink-faint">Next Full Moon</span>
          <span className="text-right font-mono text-sm font-semibold text-ink">
            {phase ? `${formatDate(phase.nextFullDate)} · ${Math.ceil(phase.daysToFull)}d` : "--"}
          </span>
        </div>
        <div className="pt-2">
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-inset">
            <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(3, cycleProgress * 100)}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}
