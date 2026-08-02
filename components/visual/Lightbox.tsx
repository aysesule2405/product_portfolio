"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export interface LightboxItem {
  src: string;
  alt: string;
  title: string;
  medium: string;
  dateLabel: string;
  caption?: string;
}

/** Full-screen viewer for visual-practice art — keyboard (Escape/arrows), click-away,
 *  and prev/next all close or navigate the same way. */
export function Lightbox({
  item,
  onClose,
  onPrev,
  onNext,
}: {
  item: LightboxItem | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!item) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [item, onClose, onPrev, onNext]);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-50 flex h-dvh items-center justify-center bg-bg/95 p-3 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <button
        ref={closeRef}
        type="button"
        data-sound="navigation"
        onClick={onClose}
        aria-label="Close"
        className="motion-press absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-line-strong bg-bg-raised text-ink hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:right-4 sm:top-4"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
          <path d="M2 2l12 12M14 2 2 14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </button>

      {onPrev ? (
        <button
          type="button"
          data-sound="navigation"
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          aria-label="Previous piece"
          className="motion-press absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-bg-raised text-ink hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:left-4"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M10 2 4 8l6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}
      {onNext ? (
        <button
          type="button"
          data-sound="navigation"
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          aria-label="Next piece"
          className="motion-press absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-line-strong bg-bg-raised text-ink hover:bg-bg-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:right-4"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M6 2l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      ) : null}

      <div className="flex max-h-full w-full max-w-3xl flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
        <div className="relative h-[52dvh] w-full overflow-hidden rounded-xl border border-line bg-bg-raised sm:h-[60vh]">
          <Image src={item.src} alt={item.alt} fill sizes="90vw" className="object-contain" priority />
        </div>
        <div className="text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-faint">
            {item.medium} · {item.dateLabel}
          </p>
          <h2 className="mt-1 font-sans text-lg font-semibold text-ink">{item.title}</h2>
          {item.caption ? <p className="mt-1 max-w-xl text-sm text-ink-soft">{item.caption}</p> : null}
        </div>
      </div>
    </div>
  );
}
