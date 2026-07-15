"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";

/**
 * Ambient light-mode water loop behind the field map — replaces an 82MB GIF with a
 * ~1-1.5MB video pair. Renders a static poster until mounted (avoids an SSR/client
 * mismatch), falls back to that same static poster under reduced motion instead of
 * autoplaying, and exposes a pause control since this is long-running ambient motion.
 */
export function WavesBackground({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => setMounted(true), []);

  const playing = mounted && !prefersReducedMotion && !paused;

  return (
    <div className={`field-map-video-layer ${className ?? ""}`}>
      {playing ? (
        <video
          className="h-full w-full object-cover"
          poster="/images/waves-poster.jpg"
          muted
          loop
          autoPlay
          playsInline
          aria-hidden
        >
          <source src="/videos/waves.webm" type="video/webm" />
          <source src="/videos/waves.mp4" type="video/mp4" />
        </video>
      ) : (
        <Image
          src="/images/waves-poster.jpg"
          alt=""
          aria-hidden
          fill
          sizes="(min-width: 1024px) 800px, 100vw"
          className="object-cover"
        />
      )}

      {mounted && !prefersReducedMotion ? (
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          aria-label={paused ? "Play ambient water animation" : "Pause ambient water animation"}
          aria-pressed={paused}
          className="motion-press absolute bottom-2 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-line-strong bg-bg/85 text-ink-soft backdrop-blur-sm hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {paused ? (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
              <path d="M1 0.5 9 5 1 9.5Z" />
            </svg>
          ) : (
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden>
              <rect x="1.5" y="0.5" width="2.5" height="9" />
              <rect x="6" y="0.5" width="2.5" height="9" />
            </svg>
          )}
        </button>
      ) : null}
    </div>
  );
}
