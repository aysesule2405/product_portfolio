import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const PARALLAX_MAX_X = 0.55;
const PARALLAX_MAX_Y = 0.35;
// A short, fixed dolly-back distance — "the central body moves deeper," not
// a flythrough. Reached well before scrollProgress's own short travel
// distance (see Hero.tsx) lets the hero scroll fully out of the viewport.
const RECEDE_DEPTH = 2.2;

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

  useFrame((state) => {
    const targetX = reduced ? 0 : THREE.MathUtils.clamp(state.pointer.x, -1, 1) * PARALLAX_MAX_X;
    const targetY = reduced ? 0 : THREE.MathUtils.clamp(state.pointer.y, -1, 1) * PARALLAX_MAX_Y;
    const base = baseZRef.current ?? camera.position.z;
    const targetZ = base + (reduced ? 0 : scrollProgress * RECEDE_DEPTH);
    targetPosition.set(targetX, targetY, targetZ);
    camera.position.lerp(targetPosition, 0.05);
    camera.lookAt(lookTarget);
  });

  return null;
}
