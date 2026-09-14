import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { useReducedMotion } from "@/lib/motion";
import { siteEase } from "./motion-utils";

export type ThemeMorphState = "dark" | "light";

const MORPH_DURATION_S = 0.8;

/**
 * Drives the day/night morph as a single 0→1 value: 0 = dark/night/moon,
 * 1 = light/day/sun. `morphRef` is a plain ref, not React state — every
 * consumer reads `morphRef.current` inside its own `useFrame`, the same
 * imperative-per-frame pattern already used everywhere else in this file
 * (entranceProgress, clickPunchScale), so a live crossfade never triggers a
 * React re-render on any of the meshes it drives.
 *
 * On first mount, `morphRef` snaps straight to the resolved theme's value —
 * no animation, so there's no flash of the opposite theme and nothing that
 * could read as an unintended transition. After that, every real theme
 * change animates: `siteEase` (the site's own [0.22,1,0.36,1] curve) over
 * ~800ms, starting from whatever `morphRef` currently holds rather than
 * always 0 or 1 — toggling again before a transition finishes reverses
 * cleanly from the interrupted midpoint instead of snapping or restarting.
 * `useReducedMotion` skips the animation and snaps directly to the target,
 * same as every other motion primitive in this scene.
 */
export function useThemeMorph() {
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const target = resolvedTheme === "light" ? 1 : 0;

  const morphRef = useRef(target);
  const startValueRef = useRef(target);
  const targetRef = useRef(target);
  const transitionStartRef = useRef<number | null>(null);
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      morphRef.current = target;
      startValueRef.current = target;
      targetRef.current = target;
      transitionStartRef.current = null;
      return;
    }
    if (targetRef.current !== target) {
      startValueRef.current = morphRef.current;
      targetRef.current = target;
      transitionStartRef.current = performance.now();
    }
  }, [target]);

  /** Call once per frame (from a single owner — see HeroOrbitScene) to
   * advance the animation. Everyone else just reads `morphRef.current`. */
  function tick() {
    if (reduced) {
      morphRef.current = targetRef.current;
      transitionStartRef.current = null;
      return;
    }
    if (transitionStartRef.current === null) return;
    const elapsedS = (performance.now() - transitionStartRef.current) / 1000;
    const t = Math.min(elapsedS / MORPH_DURATION_S, 1);
    morphRef.current = startValueRef.current + (targetRef.current - startValueRef.current) * siteEase(t);
    if (t >= 1) transitionStartRef.current = null;
  }

  return { morphRef, tick, target, theme: (resolvedTheme === "light" ? "light" : "dark") as ThemeMorphState, reduced };
}
