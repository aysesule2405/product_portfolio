import { useTheme } from "next-themes";
import { useReducedMotion } from "@/lib/motion";

export type ThemeMorphState = "dark" | "light";

/** Drives the day/night morph as a single 0→1 value: 0 = dark/night/moon,
 * 1 = light/day/sun. Phase 2 only needs the resolved end state — the
 * animated crossfade (~800ms, reversible mid-transition, skipped under
 * reduced motion, triggered only by a deliberate theme toggle rather than
 * on initial load) is Phase 3 work. That version will hold `target` in a
 * ref and lerp toward it inside a `useFrame`/effect (refs must only be
 * written outside of render, per React's rules of hooks), not compute it
 * inline during render the way this stub does — every consumer already
 * reads `theme`/`target` as plain values, not a live per-frame ref, so
 * Phase 3 only needs to add the animated ref alongside these, not replace
 * this hook's shape. */
export function useThemeMorph() {
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const target = resolvedTheme === "light" ? 1 : 0;
  return { target, theme: (resolvedTheme === "light" ? "light" : "dark") as ThemeMorphState, reduced };
}
