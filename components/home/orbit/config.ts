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
    ambient: 0.32,
  },
  light: {
    keyLight: "#fff1cf",
    rim: "#ffb066",
    ambient: 0.7,
  },
} as const;

/** Desktop 3D layout — position is part of the composition, not the theme,
 * so there is only ever one set of satellite positions per breakpoint. */
export const SATELLITE_POSITIONS: Record<CategoryId, THREE.Vector3> = {
  roots: new THREE.Vector3(-1.5, 1.1, 2.15),
  experience: new THREE.Vector3(1.5, 1.35, 1.7),
  projects: new THREE.Vector3(0.25, -2.15, 2.75),
  community: new THREE.Vector3(1.5, -1.65, 1.5),
};

/** A separate, more generously-spread mobile layout — not the desktop
 * composition uniformly shrunk. On a narrow/tall viewport, the old single
 * layout put every satellite close enough to the centerpiece to read as
 * "ears and feet on a character" rather than an intentional constellation;
 * this pushes each one further out into its own quadrant instead. Paired
 * with MOBILE_CENTERPIECE_SCALE (shrinks the centerpiece specifically) and
 * MOBILE_CAMERA_Z (pulls the camera back a little further) in
 * HeroOrbitScene, not by scaling this whole layout down. */
export const MOBILE_SATELLITE_POSITIONS: Record<CategoryId, THREE.Vector3> = {
  roots: new THREE.Vector3(-2.0, 1.95, 1.0),
  experience: new THREE.Vector3(2.05, 1.85, 0.5),
  projects: new THREE.Vector3(0.3, -2.75, 1.1),
  community: new THREE.Vector3(2.15, -1.5, -0.35),
};

export const MOBILE_BREAKPOINT_PX = 640;
export const MOBILE_CENTERPIECE_SCALE = 0.6;
export const DESKTOP_CAMERA_Z = 14.5;
export const MOBILE_CAMERA_Z = 17.5;

export const CENTERPIECE_RADIUS = 1.5;

/** The centerpiece's own body tones — a cool silver-blue-grey for the moon
 * (glass-shell tint + core emissive share this family), a layered warm
 * ivory/gold/amber gradient for the sun. Distinct from SCENE_PALETTE's
 * keyLight (that's the light source illuminating the scene, not the
 * object's own surface) though harmonized with it. */
export const CENTERPIECE_TONE = {
  dark: {
    body: "#aab4c2",
    core: "#8fb0d8",
    shellFront: "#dce8fb",
    shellBack: "#7b93b8",
    rim: "#9fc0e0",
  },
  light: {
    core: "#fff2d0",
    mid: "#ffdb8a",
    edge: "#e8a94a",
    shellFront: "#fff2d4",
    shellBack: "#e8a94a",
  },
} as const;

export const CATEGORY_ORDER: CategoryId[] = ["roots", "experience", "projects", "community"];
