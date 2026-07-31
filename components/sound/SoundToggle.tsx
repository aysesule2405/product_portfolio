"use client";

import { useSound } from "@/components/sound/SoundProvider";

export function SoundToggle() {
  const { enabled, ready, toggle } = useSound();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={ready ? `Turn interface sounds ${enabled ? "off" : "on"}` : "Toggle interface sounds"}
      aria-pressed={enabled}
      title={ready ? `Interface sounds: ${enabled ? "on" : "off"}` : "Interface sounds"}
      className="motion-press flex h-11 w-10 shrink-0 items-center justify-center rounded-md text-ink-soft hover:bg-bg-inset hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent lg:h-7 lg:w-7"
    >
      {enabled ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 10v4h3l4 3V7L8 10H5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path
            d="M15 9.2a4 4 0 0 1 0 5.6M17.5 6.8a7.3 7.3 0 0 1 0 10.4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M5 10v4h3l4 3V7L8 10H5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="m16 10 4 4m0-4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}
