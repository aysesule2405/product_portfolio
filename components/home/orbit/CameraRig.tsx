import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARALLAX_MAX_X = 0.55;
const PARALLAX_MAX_Y = 0.35;
// A short, fixed dolly-back distance — "the central body moves deeper," not
// a flythrough. Reached well before scrollProgress's own short travel
// distance (see Hero.tsx) lets the hero scroll fully out of the viewport.
const RECEDE_DEPTH = 2.2;
// Chosen so `1 - exp(-lambda * dt)` at a 60fps dt (~0.0167s) lands close to
// the old fixed-factor lerp's 0.05 — same settle feel, but exp(-lambda*dt)
// keeps the actual convergence rate in wall-clock time regardless of the
// display's refresh rate, where a flat per-frame factor doesn't (it applies
// twice as often, and therefore converges roughly twice as fast in real
// time, on a 120Hz display as on 60Hz).
const CAMERA_DAMP_LAMBDA = 3;

/**
 * Phase 3's only camera motion: a small, clamped offset lerped toward the
 * normalized pointer position (restrained parallax between the satellite
 * cluster and the background layers), plus a short dolly-back driven by
 * `scrollProgress` (0–1, owned by Hero.tsx) for the scroll-departure
 * sequence. OrbitControls/zoom/auto-rotate were removed entirely rather
 * than kept as a Phase 2 placeholder — "no unrestricted orbit" is a
 * permanent constraint on this component, not a temporary gap being filled
 * in now. Reduced motion disables both: no pointer-driven movement, and no
 * scroll-linked recede (see Hero.tsx's own reduced-motion handling for why
 * `scrollProgress` itself stays at 0 in that case rather than this
 * component re-deriving it).
 */
export function CameraRig({ reduced, scrollProgress }: { reduced: boolean; scrollProgress: number }) {
  const { camera } = useThree();
  const baseZRef = useRef<number | null>(null);
  if (baseZRef.current === null) baseZRef.current = camera.position.z;
  // Scratch vectors, not touched by useMemo's own render-time return value —
  // only ever written to via .set()/.lerp() (mutating method calls) inside
  // useFrame below, never reassigned with `=`.
  const targetPosition = useMemo(() => new THREE.Vector3(), []);
  const lookTarget = useMemo(() => new THREE.Vector3(0, 0, 0), []);

  useFrame((state, delta) => {
    const targetX = reduced ? 0 : THREE.MathUtils.clamp(state.pointer.x, -1, 1) * PARALLAX_MAX_X;
    const targetY = reduced ? 0 : THREE.MathUtils.clamp(state.pointer.y, -1, 1) * PARALLAX_MAX_Y;
    const base = baseZRef.current ?? camera.position.z;
    const targetZ = base + (reduced ? 0 : scrollProgress * RECEDE_DEPTH);
    targetPosition.set(targetX, targetY, targetZ);
    // Vector3.lerp already applies its factor per-component, so a single
    // exponential-decay factor computed from delta time (the same math
    // THREE.MathUtils.damp uses internally) gives the same frame-rate-
    // independent result as damping x/y/z separately.
    camera.position.lerp(targetPosition, 1 - Math.exp(-CAMERA_DAMP_LAMBDA * delta));
    camera.lookAt(lookTarget);
  });

  return null;
}
