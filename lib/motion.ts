import type { Variants } from "framer-motion";

export const motionTimings = {
  fast: 0.18,
  base: 0.36,
  slow: 0.52,
};

export const motionEasing = [0.22, 1, 0.36, 1] as const;

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
