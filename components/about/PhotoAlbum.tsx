"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { useReducedMotion } from "@/lib/motion";

const photos = [
  {
    src: "/images/Ayse 1.jpeg",
    alt: "Ayse Sule Ekiz in front of blue background",
    label: "portrait 01",
  },
  {
    src: "/images/Ayse 2.jpeg",
    alt: "A personal photo from Ayse Sule Ekiz's album",
    label: "portrait 02",
  },
  {
    src: "/images/Ayse 3.jpg",
    alt: "A personal photo from Ayse Sule Ekiz's album",
    label: "portrait 03",
  },
  {
    src: "/images/Ayse 4.jpeg",
    alt: "A personal photo from Ayse Sule Ekiz's album",
    label: "portrait 04",
  },
  {
    src: "/images/Ayse 5.jpeg",
    alt: "A personal photo from Ayse Sule Ekiz's album",
    label: "portrait 05",
  },
  {
    src: "/images/Ayse 6.jpg",
    alt: "A personal photo from Ayse Sule Ekiz's album",
    label: "portrait 06",
  },
  {
    src: "/images/Ayse 7.jpeg",
    alt: "A personal photo from Ayse Sule Ekiz's album",
    label: "portrait 07",
  },
  {
    src: "/images/Ayse 8.JPG",
    alt: "A personal photo from Ayse Sule Ekiz's album",
    label: "portrait 08",
  },
];

function wrapIndex(index: number) {
  return (index + photos.length) % photos.length;
}

export function PhotoAlbum() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const shouldReduceMotion = useReducedMotion();
  const activePhoto = photos[activeIndex];

  function showPhoto(nextIndex: number, nextDirection: number) {
    setDirection(nextDirection);
    setActiveIndex(wrapIndex(nextIndex));
  }

  return (
    <div className="motion-card motion-card-no-shine overflow-hidden rounded-2xl border border-line bg-bg-raised/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
      <WindowChrome
        filename="ayse_album"
        compact
        right={
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            {String(activeIndex + 1).padStart(2, "0")} / {String(photos.length).padStart(2, "0")}
          </span>
        }
      />

      <div className="relative border-b border-line bg-bg/60 p-4 sm:p-5">
        <div className="relative aspect-square overflow-hidden rounded-lg border border-line bg-bg-inset">
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            <motion.div
              key={activePhoto.src}
              className="absolute inset-0"
              custom={direction}
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * 36, scale: 1.02 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: direction * -36, scale: 0.985 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image
                src={activePhoto.src}
                alt={activePhoto.alt}
                fill
                priority={activeIndex === 0}
                sizes="(min-width: 1024px) 520px, 90vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="absolute inset-x-6 top-1/2 flex -translate-y-1/2 justify-between">
          <button
            type="button"
            onClick={() => showPhoto(activeIndex - 1, -1)}
            aria-label="Show previous photo"
            className="motion-press flex h-11 w-11 items-center justify-center rounded-full border border-line bg-bg-raised/85 text-ink shadow-lg backdrop-blur hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M11 4L6 9L11 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => showPhoto(activeIndex + 1, 1)}
            aria-label="Show next photo"
            className="motion-press flex h-11 w-11 items-center justify-center rounded-full border border-line bg-bg-raised/85 text-ink shadow-lg backdrop-blur hover:border-line-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden>
              <path d="M7 4L12 9L7 14" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto px-4 py-4 sm:px-5">
        {photos.map((photo, index) => {
          const active = index === activeIndex;
          return (
            <button
              key={photo.src}
              type="button"
              onClick={() => showPhoto(index, index >= activeIndex ? 1 : -1)}
              aria-label={`Show ${photo.label}`}
              aria-current={active ? "true" : undefined}
              className={clsx(
                "motion-press relative h-16 w-16 shrink-0 overflow-hidden rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                active ? "border-accent ring-2 ring-accent/45" : "border-line opacity-70 hover:opacity-100"
              )}
            >
              <Image src={photo.src} alt="" fill sizes="64px" className="object-cover" />
              {active ? <span className="absolute inset-x-2 bottom-1 h-0.5 rounded-full bg-accent" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
