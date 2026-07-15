import type { Variants } from "framer-motion";
import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

export const motionTimings = {
  fast: 0.18,
  base: 0.36,
  slow: 0.52,
};

export const motionEasing = [0.22, 1, 0.36, 1] as const;

/**
 * Motion tokens grouped by what the motion is *for*, not just how long it takes.
 * See docs/DESIGN_SYSTEM.md for the full rationale behind each category.
 */
export const motionPurpose = {
  /** Buttons, fields, tabs, filters — immediate, small transform/color change. */
  feedback: { duration: 0.16, ease: motionEasing },
  /** Modals, page transitions, filtering, navigation — preserve spatial relationships. */
  orientation: { duration: 0.35, ease: motionEasing },
  /** System diagrams, source trails, timelines, persistent identity — triggered, replayable. */
  explanation: { duration: 0.6, ease: motionEasing },
  /** Stars, clouds, water, gentle art movement — slow, low-contrast, pausable. */
  atmosphere: { duration: 2.4, ease: "linear" as const },
} as const;

/** Wraps framer-motion's reduced-motion hook so ambient/ornamental animation can branch on it explicitly. */
export function useReducedMotion(): boolean {
  return useFramerReducedMotion() ?? false;
}

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: motionTimings.slow, ease: motionEasing },
  },
};

export const softRevealVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: motionTimings.base, ease: motionEasing },
  },
};

export const staggerContainerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
};
