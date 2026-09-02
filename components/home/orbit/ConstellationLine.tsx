import * as THREE from "three";
import { QuadraticBezierLine } from "@react-three/drei";

/** A thin dashed curve from the centerpiece to one satellite. Must be
 * rendered inside a `<group position={targetPosition}>` (matching
 * SatelliteNode's own wrapper) — start/end/mid are expressed in that group's
 * local space, not world space, so the curve's start point cancels the
 * group's own translation back to the centerpiece at world origin. */
export function ConstellationLine({
  targetPosition,
  color,
  opacity = 0.3,
}: {
  targetPosition: THREE.Vector3;
  color: string;
  opacity?: number;
}) {
  return (
    <QuadraticBezierLine
      start={new THREE.Vector3(0, 0, 0).sub(targetPosition)}
      end={[0, 0, 0]}
      mid={targetPosition.clone().multiplyScalar(-0.45).add(new THREE.Vector3(0, 0.5, 0))}
      color={color}
      lineWidth={1}
      dashed
      dashScale={6}
      transparent
      opacity={opacity}
    />
  );
}
