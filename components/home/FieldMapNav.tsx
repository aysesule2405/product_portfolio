"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { FIELD_MAP_CATEGORIES, type FieldMapCategory } from "@/lib/data/field-map-categories";
import type { TimelineLane } from "@/lib/types";

export interface FieldMapSelection {
  hoveredId: TimelineLane | null;
  activeId: TimelineLane | null;
}

const FADE_NONE = "none";
const FADE_RIGHT = "linear-gradient(to right, black 88%, transparent 100%)";
const FADE_LEFT = "linear-gradient(to right, transparent 0%, black 12%, black 100%)";
const FADE_BOTH = "linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)";

/** Fades only the edge that still has more to scroll toward — a static
 * always-on right fade (Phase 2B) implied there was always more content to
 * the right, even once you'd scrolled all the way to the last card. Reads
 * scrollLeft/scrollWidth directly rather than tracking an approximate
 * "hasOverflow" boolean, so it stays correct if font size, card width, or
 * viewport changes. */
function useEdgeFadeMask(ref: React.RefObject<HTMLElement | null>) {
  const [mask, setMask] = useState(FADE_NONE);

  const update = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    const { scrollLeft, scrollWidth, clientWidth } = node;
    const overflowing = scrollWidth - clientWidth > 4;
    if (!overflowing) {
      setMask(FADE_NONE);
      return;
    }
    // scroll-snap's own resting position sits at ~1 padding unit (px-3 =
    // 12px), not 0 — a 4px threshold never registered "at the start" at
    // all. 18px clears that snap offset with a little margin.
    const edgeThreshold = 18;
    const atStart = scrollLeft <= edgeThreshold;
    const atEnd = scrollLeft + clientWidth >= scrollWidth - edgeThreshold;
    if (atStart) setMask(FADE_RIGHT);
    else if (atEnd) setMask(FADE_LEFT);
    else setMask(FADE_BOTH);
  }, [ref]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    update();
    node.addEventListener("scroll", update, { passive: true });
    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(node);
    window.addEventListener("resize", update);
    return () => {
      node.removeEventListener("scroll", update);
      resizeObserver.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref, update]);

  return mask;
}

/** The hero's real navigation — four semantic links to the site's existing
 * four categories. Deliberately NOT positioned as an overlay pinned to each
 * 3D node's projected screen coordinate: that would need a live
 * camera-projection bridge to stay correct across every viewport/aspect
 * ratio (this scene's camera is fixed, so it's possible, but adds a second
 * synced-position system for a decorative alignment gain). Instead this
 * renders as its own bottom-anchored row, color-matched per category so the
 * association with its floating counterpart in the scene still reads
 * clearly. Statically imported into Hero.tsx (not part of the
 * dynamically-imported WebGL module) and fully functional without it — the
 * 3D nodes add hover/glow enhancement on top of this, they don't gate it.
 * `resolvedTheme` is undefined until the client mount; this only affects
 * which of the two (dark/light) tints get used for the color chip, not
 * layout, so unlike ModelCredits there's no content to gate behind a mount
 * guard beyond falling back to the dark tint (the site's own default
 * theme) for that first paint. */
export function FieldMapNav({
  selection,
  onHoverChange,
  onActivate,
}: {
  selection: FieldMapSelection;
  onHoverChange: (id: TimelineLane, hovered: boolean) => void;
  onActivate: (category: FieldMapCategory) => void;
}) {
  const { resolvedTheme } = useTheme();
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const isLight = hasMounted && resolvedTheme === "light";
  const navRef = useRef<HTMLElement | null>(null);
  const maskImage = useEdgeFadeMask(navRef);

  return (
    <nav
      ref={navRef}
      aria-label="Field map categories"
      // A single scrollable row rather than a wrapped grid — two stacked
      // rows of cards on a narrow viewport eat enough vertical space to
      // visually collide with the satellites floating above them (the
      // scene fills the full hero height on every device; the nav is what
      // needs to adapt). Matches the existing site convention for a
      // horizontal strip that doesn't fit (see TopBar's own tab list).
      // The mask (see useEdgeFadeMask) only ever fades the edge that still
      // has more to scroll toward, and turns off entirely once every card
      // fits without scrolling (sm and up).
      className="pointer-events-auto flex w-full max-w-full snap-x items-stretch gap-2 overflow-x-auto px-3 sm:justify-center sm:gap-3"
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      {FIELD_MAP_CATEGORIES.map((category) => {
        const color = isLight ? category.colorLight : category.colorDark;
        const isHovered = selection.hoveredId === category.id;
        const isActive = selection.activeId === category.id;
        const highlighted = isHovered || isActive;
        return (
          <Link
            key={category.id}
            href={category.href}
            onMouseEnter={() => onHoverChange(category.id, true)}
            onMouseLeave={() => onHoverChange(category.id, false)}
            onFocus={() => onHoverChange(category.id, true)}
            onBlur={() => onHoverChange(category.id, false)}
            onClick={(e) => {
              e.preventDefault();
              onActivate(category);
            }}
            className="motion-press flex w-[7.25rem] shrink-0 snap-start flex-col gap-0.5 rounded-xl border px-3 py-2 text-left backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:w-auto sm:max-w-[11rem]"
            style={{
              borderColor: highlighted ? color : "var(--line)",
              background: "color-mix(in srgb, var(--bg) 55%, transparent)",
            }}
          >
            <span
              className="font-mono text-[12px] uppercase tracking-[0.1em] transition-colors"
              style={{ color: highlighted ? color : "var(--ink)" }}
            >
              {category.label}
            </span>
            <span className="text-[11px] leading-snug text-ink-faint">{category.shortDescription}</span>
          </Link>
        );
      })}
    </nav>
  );
}
