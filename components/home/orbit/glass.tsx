import { useMemo } from "react";
import * as THREE from "three";

/**
 * The Glass Instruments material/geometry toolkit — promoted from the
 * Phase 2B exploration (components/home/orbit/directions/shapes.tsx, which
 * now just re-exports this) into a shared production module once Glass was
 * selected as the scene's visual system. Used by both CelestialBody and
 * SatelliteNode.
 */

/** A curved, asymmetric leaf/petal outline extruded to a thin shell —
 * "Practice"'s folded/layered optical form. Centered on its own origin so
 * instances can be freely rotated/scaled around a shared base point without
 * recomputing a pivot. */
export function petalGeometry(length = 0.62, width = 0.3, thickness = 0.05, bevel = 0.014) {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.bezierCurveTo(width, length * 0.18, width * 0.85, length * 0.78, 0, length);
  shape.bezierCurveTo(-width * 0.85, length * 0.78, -width, length * 0.18, 0, 0);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: thickness,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 14,
  });
  geometry.translate(0, -length * 0.42, -thickness / 2);
  return geometry;
}

/** A pleated, accordion-folded profile extruded to a thin plate —
 * "Experience"'s accumulated-vertical-structure form. Borrowed from the
 * Crafted exploration (which built it for ceramic/paper-fold material) and
 * re-rendered here in glass — the silhouette reads as "layered/accumulated"
 * regardless of which material wraps it, which is exactly why it survived
 * the direction pick even though its origin direction didn't. */
export function pleatedGeometry(teeth = 5, width = 0.5, amplitude = 0.09, depth = 0.1) {
  const shape = new THREE.Shape();
  const w = width;
  shape.moveTo(-w / 2, -0.3);
  for (let i = 0; i <= teeth; i++) {
    const x = -w / 2 + (w * i) / teeth;
    const y = -0.3 + (0.6 * i) / teeth;
    shape.lineTo(x + (i % 2 === 0 ? amplitude : -amplitude), y);
  }
  shape.lineTo(w / 2, 0.3);
  shape.lineTo(w / 2 - 0.08, 0.3);
  for (let i = teeth; i >= 0; i--) {
    const x = -w / 2 + (w * i) / teeth;
    const y = -0.3 + (0.6 * i) / teeth;
    shape.lineTo(x + (i % 2 === 0 ? amplitude : -amplitude) - 0.08, y);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, curveSegments: 8 });
  geometry.center();
  return geometry;
}

/** A small, intentional three-point rig — key + hemisphere fill + a subtle
 * rim-toned point light. Proved out during the Phase 2B exploration against
 * Phase 2's flatter single-ambient-plus-point setup and is now the
 * production lighting rig, not a direction-specific variable. */
export function SceneLightingRig({ theme }: { theme: "dark" | "light" }) {
  const key = theme === "dark" ? "#dfe8ff" : "#fff3d8";
  const rim = theme === "dark" ? "#7fb0ff" : "#ffb066";
  const skyColor = theme === "dark" ? "#25406b" : "#fff6df";
  const groundColor = theme === "dark" ? "#050810" : "#c9b998";
  return (
    <>
      <directionalLight position={[4.5, 5, 5.5]} intensity={theme === "dark" ? 1.7 : 2.1} color={key} />
      <hemisphereLight args={[skyColor, groundColor, theme === "dark" ? 0.55 : 0.7]} />
      <pointLight position={[-5, -2.2, -3]} intensity={theme === "dark" ? 0.9 : 1.0} color={rim} distance={13} />
    </>
  );
}

function useCoronaTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const c = size / 2;
    // A true radial gradient has no geometric edge at all — a fresnel-on-a-
    // sphere falloff (tried first during exploration, and rejected) still
    // reads as a hard-edged disc because the material covers the entire
    // sphere surface, just at varying opacity.
    const gradient = ctx.createRadialGradient(c, c, 0, c, c, c);
    gradient.addColorStop(0, "rgba(255,255,255,0.16)");
    gradient.addColorStop(0.25, "rgba(255,255,255,0.05)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.012)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

/**
 * A soft, low-opacity radial falloff behind the centerpiece — significantly
 * larger than the object but never opaque enough to read as its own shape.
 * The exploration's first attempt at this was a fresnel shader on a sphere,
 * which still reads as a hard-edged disc (a shader covers the *whole*
 * sphere surface, just at varying opacity) — a true canvas radial gradient
 * has no geometric edge at all, which is what "soft falloff" actually
 * requires. Not scene-lit and not silhouette-following: it's atmosphere,
 * not a second material layer, so it disappears when glow is disabled and
 * the object still needs to read on its own.
 */
export function Corona({ color, radius, opacity = 0.3 }: { color: string; radius: number; opacity?: number }) {
  const texture = useCoronaTexture();
  return (
    <sprite scale={[radius * 2, radius * 2, 1]} renderOrder={-1}>
      <spriteMaterial map={texture} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

/** Cheap "faux transmission": two coincident meshes on the same geometry,
 * one rendered back-face-only with a deeper tint (what you'd see looking
 * through the far wall of the object) and one front-face-only with a paler
 * tint plus a stronger clearcoat — no real MeshPhysicalMaterial transmission
 * (which forces a back-buffer render pass per instance), just two ordinary
 * transparent draws. This front/back tint contrast is also what carries
 * edge definition in light mode, where additive rim light washes out
 * against the pale background (see RimGlow's dark-only gating in
 * SatelliteNode/CelestialBody) — no separate "light mode edge" technique
 * needed on top of it. */
export function GlassShell({
  geometry,
  frontColor,
  backColor,
  opacity = 0.55,
}: {
  geometry: THREE.BufferGeometry;
  frontColor: string;
  backColor: string;
  opacity?: number;
}) {
  return (
    <>
      <mesh geometry={geometry} renderOrder={0}>
        <meshPhysicalMaterial
          color={backColor}
          transparent
          opacity={opacity * 0.8}
          roughness={0.15}
          metalness={0}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry} renderOrder={1}>
        <meshPhysicalMaterial
          color={frontColor}
          transparent
          opacity={opacity}
          roughness={0.08}
          metalness={0}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}
