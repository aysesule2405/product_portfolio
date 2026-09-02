import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/** Replaces the old OrbitControls-driven free-orbit rig. Phase 2 is
 * composition only — a fixed camera looking at the scene's authored center,
 * no drag, no zoom, no auto-rotate. Phase 3 adds restrained pointer parallax
 * (a small clamped camera offset lerped toward normalized pointer position)
 * and the scroll-departure sequence here; both are additive to this same
 * component, not a replacement for it, since "no unrestricted orbit" is a
 * permanent constraint, not a Phase 2 placeholder. */
export function CameraRig() {
  const { camera } = useThree();

  useEffect(() => {
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return null;
}
