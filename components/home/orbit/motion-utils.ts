import * as THREE from "three";

export function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Returns 0→1 eased progress for a delayed entrance animation — call once
 * per frame with the scene clock's `elapsedTime`. `startRef` lazily captures
 * "now + delay" on its first call, so several instances that all mount in
 * the same React commit still stagger correctly off their own `delay`. */
export function entranceProgress(
  startRef: { current: number | null },
  elapsedTime: number,
  delay: number,
  duration: number,
  reduced: boolean
) {
  if (reduced) return 1;
  if (startRef.current === null) startRef.current = elapsedTime + delay;
  const t = THREE.MathUtils.clamp((elapsedTime - startRef.current) / duration, 0, 1);
  return easeOutCubic(t);
}

export const CLICK_PUNCH_DURATION = 0.4;
export const CATEGORY_ACTIVATE_DELAY_MS = 280;

/** A quick scale-up-then-settle pulse starting the instant `active` goes
 * true — a single sine hump (0 at both ends, peak at the midpoint) rather
 * than a spring: cheap, and it can't get caught mid-oscillation since the
 * page navigates away right as it finishes. Skipped entirely under reduced
 * motion by the caller (see useCategoryActivate), not by this function. */
export function clickPunchScale(startRef: { current: number | null }, elapsedTime: number, active: boolean) {
  if (!active) {
    startRef.current = null;
    return 1;
  }
  if (startRef.current === null) startRef.current = elapsedTime;
  const t = THREE.MathUtils.clamp((elapsedTime - startRef.current) / CLICK_PUNCH_DURATION, 0, 1);
  return 1 + Math.sin(t * Math.PI) * 0.4;
}

/** CSS cubic-bezier(0.22, 1, 0.36, 1) as an imperative easing function —
 * mirrors lib/motion.ts's `motionEasing` token so per-frame lerps (the
 * theme-morph crossfade, scroll-departure sequence) use the exact same curve
 * as the rest of the site's framer-motion transitions, not an approximation.
 * Standard "UnitBezier" solve: Newton-Raphson for t-given-x, then evaluate y
 * at that t — a bezier easing's two axes aren't the same curve, so the y
 * control values can't be used as scalar lerp weights directly. */
function bezierComponent(t: number, p1: number, p2: number) {
  const u = 1 - t;
  return 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t;
}

function bezierComponentDerivative(t: number, p1: number, p2: number) {
  const u = 1 - t;
  return 3 * u * u * p1 + 6 * u * t * (p2 - p1) + 3 * t * t * (1 - p2);
}

export function siteEase(x: number, x1 = 0.22, y1 = 1, x2 = 0.36, y2 = 1) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  let t = x;
  for (let i = 0; i < 6; i++) {
    const dx = bezierComponent(t, x1, x2) - x;
    const derivative = bezierComponentDerivative(t, x1, x2);
    if (Math.abs(derivative) < 1e-6) break;
    t -= dx / derivative;
    t = THREE.MathUtils.clamp(t, 0, 1);
  }
  return bezierComponent(t, y1, y2);
}
