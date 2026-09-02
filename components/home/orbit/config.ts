import * as THREE from "three";
import type { TimelineLane } from "@/lib/types";

export type CategoryId = TimelineLane;

/** Scene-wide light/background tokens — the moon's key light leans cool
 * silver-blue (matching its own silver-blue rim/surface family) rather than
 * the previous warm ivory, which fought the "silver-blue moon tones" the
 * centerpiece itself is built from. Per-category color lives in
 * lib/data/field-map-categories.ts instead of here — this is scene lighting
 * only, not category identity. */
export const SCENE_PALETTE = {
  dark: {
    keyLight: "#dfe8ff",
    rim: "#8fc0ff",
    ambient: 0.36,
  },
  light: {
    keyLight: "#fff1cf",
    rim: "#ffb066",
    ambient: 0.7,
  },
} as const;

/** Desktop 3D layout. Phase 2C enlarged every satellite (see
 * SATELLITE_SCALE) and reduced the centerpiece slightly (see
 * CENTERPIECE_RADIUS), so positions moved outward from their Phase 2B
 * values to keep clear negative space around each bigger object and stop
 * any of them from touching the moon/sun shell — not a uniform push, since
 * "asymmetric but balanced" was the explicit ask, not a wider circle. */
export const SATELLITE_POSITIONS: Record<CategoryId, THREE.Vector3> = {
  roots: new THREE.Vector3(-2.05, 1.35, 1.9),
  experience: new THREE.Vector3(2.05, 1.9, 1.35),
  projects: new THREE.Vector3(0.35, -2.75, 2.35),
  community: new THREE.Vector3(2.35, -1.95, 1.05),
};

/** A separate, more generously-spread mobile layout — not the desktop
 * composition uniformly shrunk. Phase 2C pushed Experience/Community out
 * further still (they were the two flagged as hardest to read at mobile
 * size) and pulled Work up and in slightly so its enlarged form keeps clear
 * of the category nav row below it. */
export const MOBILE_SATELLITE_POSITIONS: Record<CategoryId, THREE.Vector3> = {
  roots: new THREE.Vector3(-2.05, 2.05, 1.0),
  experience: new THREE.Vector3(2.15, 2.0, 0.5),
  projects: new THREE.Vector3(0.3, -2.55, 1.1),
  community: new THREE.Vector3(2.3, -1.65, -0.35),
};

/** Per-category apparent-size multiplier — the primary Phase 2C fix. Not
 * uniform: Community was flagged as reading as "a barely visible line of
 * spheres" at standard viewing distance and needed the most enlargement;
 * Practice already read clearly and needed the least. Applied as a group
 * scale around each satellite's own local origin, so it doesn't change the
 * shared geometry/material work, only how big the result renders. */
export const SATELLITE_SCALE: Record<CategoryId, number> = {
  roots: 1.35,
  experience: 1.55,
  projects: 1.45,
  community: 1.65,
};

export const MOBILE_BREAKPOINT_PX = 640;
export const MOBILE_CENTERPIECE_SCALE = 0.6;
export const DESKTOP_CAMERA_Z = 14.5;
export const MOBILE_CAMERA_Z = 17.5;

/** Reduced from 1.5 (Phase 2B) to make room for the enlarged satellites
 * without crowding — "the central body may be reduced slightly on desktop
 * if necessary to create room" was an explicit option, not a last resort. */
export const CENTERPIECE_RADIUS = 1.38;

/** The centerpiece's own body tones — a cool silver-blue-grey for the moon
 * (glass-shell tint + core emissive share this family), a layered warm
 * ivory/gold/amber gradient for the sun. Distinct from SCENE_PALETTE's
 * keyLight (that's the light source illuminating the scene, not the
 * object's own surface) though harmonized with it. Phase 2C desaturated
 * and softened the shell tones specifically — the Phase 2B shell read as
 * "a thick blue ring/porthole," which was a tuning problem (opacity/
 * contrast), not a technique problem; see CelestialBody's shell opacity. */
export const CENTERPIECE_TONE = {
  dark: {
    body: "#aab4c2",
    core: "#8fb0d8",
    shellFront: "#c9d8f0",
    shellBack: "#8296b5",
    rim: "#9fc0e0",
  },
  light: {
    core: "#fff2d0",
    mid: "#ffdb8a",
    edge: "#e8a94a",
    // A brighter, off-center hotspot — not a second lighting rig, just a
    // warmer tint blended in at a shader-space offset from the sphere's
    // true center, so the sun stops reading as a perfectly symmetric flat
    // gradient disc.
    hotspot: "#fff8e2",
    shellFront: "#fff2d4",
    shellBack: "#e8a94a",
  },
} as const;

export const CATEGORY_ORDER: CategoryId[] = ["roots", "experience", "projects", "community"];
