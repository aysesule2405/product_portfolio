import { useMemo } from "react";

export type QualityTier = "high" | "mid" | "low";

/** Conservative on purpose — a high tier that caps at 1.5 rather than 2 costs
 * meaningfully less fill-rate on a Retina display while being visually
 * indistinguishable for this scene's flat-shaded, low-poly geometry (no fine
 * detail for the extra pixel density to resolve). Core navigation and
 * composition are identical across every tier; this only ever budgets
 * decorative cost (DPR, particle counts). */
export const DPR_CAP: Record<QualityTier, number> = { high: 1.5, mid: 1.25, low: 1 };
export const DUST_COUNT: Record<QualityTier, number> = { high: 90, mid: 60, low: 30 };
export const STAR_COUNT: Record<QualityTier, number> = { high: 700, mid: 450, low: 250 };

/** Best-effort device classification, not true detection — deviceMemory and
 * hardwareConcurrency are Chromium-only (undefined on Safari/Firefox), and
 * coarse-pointer is a proxy for "likely mobile," not a guarantee. Unknown
 * capability on a fine-pointer device lands on "mid," a safe middle ground,
 * rather than assuming the best case. */
function detectTier(): QualityTier {
  if (typeof window === "undefined") return "mid";
  const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches ?? false;
  if (coarsePointer) return "low";

  const nav = navigator as Navigator & { deviceMemory?: number };
  const memory = nav.deviceMemory;
  const cores = navigator.hardwareConcurrency;

  if (memory !== undefined && memory <= 4) return "mid";
  if (cores !== undefined && cores <= 4) return "mid";
  if (memory !== undefined && memory >= 8) return "high";
  if (cores !== undefined && cores >= 8) return "high";
  return "mid";
}

/** Computed once per mount — device capability doesn't change mid-session,
 * so this deliberately isn't reactive to anything. */
export function useQualityTier(): QualityTier {
  return useMemo(() => detectTier(), []);
}
