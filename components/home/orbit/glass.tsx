import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mulberry32, hashString } from "./procedural";
import type { FadeRef } from "./motion-utils";

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

const LIGHTING_TONE = {
  dark: { key: "#dfe8ff", rim: "#7fb0ff", sky: "#25406b", ground: "#050810", keyIntensity: 1.7, hemiIntensity: 0.55, rimIntensity: 0.9 },
  light: { key: "#fff3d8", rim: "#ffb066", sky: "#fff6df", ground: "#c9b998", keyIntensity: 2.1, hemiIntensity: 0.7, rimIntensity: 1.0 },
} as const;

/** A small, intentional three-point rig — key + hemisphere fill + a subtle
 * rim-toned point light. Proved out during the Phase 2B exploration against
 * Phase 2's flatter single-ambient-plus-point setup and is now the
 * production lighting rig, not a direction-specific variable.
 *
 * Phase 3 switched this from a static `theme` prop to a live `morphRef` —
 * every material the light falls on now crossfades over the theme-morph
 * duration, so a light that snapped instantly would mean the crossfading
 * moon/sun are lit wrong for most of that transition. Colors/intensities are
 * lerped every frame via refs on each light, the same imperative pattern as
 * everywhere else in this scene. */
export function SceneLightingRig({ morphRef }: { morphRef: FadeRef }) {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const hemiRef = useRef<THREE.HemisphereLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const keyColor = useMemo(() => new THREE.Color(), []);
  const skyColor = useMemo(() => new THREE.Color(), []);
  const groundColor = useMemo(() => new THREE.Color(), []);
  const rimColor = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const m = morphRef.current;
    const dark = LIGHTING_TONE.dark;
    const light = LIGHTING_TONE.light;
    if (keyRef.current) {
      keyColor.set(dark.key).lerp(new THREE.Color(light.key), m);
      keyRef.current.color.copy(keyColor);
      keyRef.current.intensity = THREE.MathUtils.lerp(dark.keyIntensity, light.keyIntensity, m);
    }
    if (hemiRef.current) {
      skyColor.set(dark.sky).lerp(new THREE.Color(light.sky), m);
      groundColor.set(dark.ground).lerp(new THREE.Color(light.ground), m);
      hemiRef.current.color.copy(skyColor);
      hemiRef.current.groundColor.copy(groundColor);
      hemiRef.current.intensity = THREE.MathUtils.lerp(dark.hemiIntensity, light.hemiIntensity, m);
    }
    if (rimRef.current) {
      rimColor.set(dark.rim).lerp(new THREE.Color(light.rim), m);
      rimRef.current.color.copy(rimColor);
      rimRef.current.intensity = THREE.MathUtils.lerp(dark.rimIntensity, light.rimIntensity, m);
    }
  });

  return (
    <>
      <directionalLight ref={keyRef} position={[4.5, 5, 5.5]} />
      <hemisphereLight ref={hemiRef} />
      <pointLight ref={rimRef} position={[-5, -2.2, -3]} distance={13} />
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

/** A handful of small, randomly-placed soft blobs layered around the rim of
 * an otherwise-normal radial gradient — breaks the perfectly-circular
 * silhouette into something closer to an irregular solar corona (real
 * coronae aren't concentric circles) without needing per-pixel noise. Used
 * by the sun only; the moon's atmosphere reads better perfectly soft/round. */
function useIrregularCoronaTexture(seed: string) {
  return useMemo(() => {
    const size = 160;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const c = size / 2;
    const base = ctx.createRadialGradient(c, c, 0, c, c, c * 0.72);
    base.addColorStop(0, "rgba(255,255,255,0.15)");
    base.addColorStop(0.4, "rgba(255,255,255,0.05)");
    base.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, size, size);

    const rand = mulberry32(hashString(seed));
    const blobCount = 7;
    for (let i = 0; i < blobCount; i++) {
      const angle = (i / blobCount) * Math.PI * 2 + rand() * 0.7;
      const reach = c * (0.55 + rand() * 0.4);
      const bx = c + Math.cos(angle) * reach;
      const by = c + Math.sin(angle) * reach;
      const br = c * (0.28 + rand() * 0.22);
      const blob = ctx.createRadialGradient(bx, by, 0, bx, by, br);
      blob.addColorStop(0, "rgba(255,255,255,0.06)");
      blob.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = blob;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, [seed]);
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
 * the object still needs to read on its own. `irregular` swaps in a
 * blob-perturbed variant (see useIrregularCoronaTexture) for the sun, whose
 * brief specifically asked for "irregular radial falloff" rather than the
 * moon's calmer, perfectly round atmosphere.
 */
export function Corona({
  color,
  radius,
  opacity = 0.3,
  irregular = false,
  seed = "corona",
  fadeRef,
}: {
  color: string;
  radius: number;
  opacity?: number;
  irregular?: boolean;
  seed?: string;
  /** Optional per-frame multiplier (see FadeRef) — used to crossfade this
   * corona out with the rest of its subtree during the theme morph without
   * this component owning any animation state of its own. */
  fadeRef?: FadeRef;
}) {
  const regularTexture = useCoronaTexture();
  const irregularTexture = useIrregularCoronaTexture(seed);
  const texture = irregular ? irregularTexture : regularTexture;
  const materialRef = useRef<THREE.SpriteMaterial>(null);
  useFrame(() => {
    if (materialRef.current && fadeRef) materialRef.current.opacity = opacity * fadeRef.current;
  });
  return (
    <sprite scale={[radius * 2, radius * 2, 1]} renderOrder={-1}>
      <spriteMaterial ref={materialRef} map={texture} color={color} transparent opacity={opacity} depthWrite={false} blending={THREE.AdditiveBlending} />
    </sprite>
  );
}

/** Cheap "faux transmission": two coincident meshes on the same geometry,
 * one rendered back-face-only with a deeper tint (what you'd see looking
 * through the far wall of the object) and one front-face-only with a paler
 * tint plus a soft clearcoat — no real MeshPhysicalMaterial transmission
 * (which forces a back-buffer render pass per instance), just two ordinary
 * transparent draws. This front/back tint contrast is also what carries
 * edge definition in light mode, where additive rim light washes out
 * against the pale background (see RimGlow's dark-only gating in
 * SatelliteNode/CelestialBody) — no separate "light mode edge" technique
 * needed on top of it.
 *
 * `frontRoughness`/`frontClearcoat` default to a softer, less uniformly
 * glossy finish than the original values (0.08/0.8) — those read as
 * "opaque and plastic" at normal viewing size, especially in light mode; a
 * rougher clearcoat scatters its highlight into something narrower and
 * less like a toy's molded-plastic sheen. */
export function GlassShell({
  geometry,
  frontColor,
  backColor,
  opacity = 0.55,
  frontRoughness = 0.16,
  frontClearcoat = 0.5,
  frontClearcoatRoughness = 0.28,
  fadeRef,
}: {
  geometry: THREE.BufferGeometry;
  frontColor: string;
  backColor: string;
  opacity?: number;
  frontRoughness?: number;
  frontClearcoat?: number;
  frontClearcoatRoughness?: number;
  /** Optional per-frame multiplier (see FadeRef) — used by the sun's shell
   * to crossfade with the rest of its subtree during the theme morph. */
  fadeRef?: FadeRef;
}) {
  const backRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const frontRef = useRef<THREE.MeshPhysicalMaterial>(null);
  useFrame(() => {
    if (!fadeRef) return;
    const f = fadeRef.current;
    if (backRef.current) backRef.current.opacity = opacity * 0.8 * f;
    if (frontRef.current) frontRef.current.opacity = opacity * f;
  });
  return (
    <>
      <mesh geometry={geometry} renderOrder={0}>
        <meshPhysicalMaterial
          ref={backRef}
          color={backColor}
          transparent
          opacity={opacity * 0.8}
          roughness={0.2}
          metalness={0}
          side={THREE.BackSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry} renderOrder={1}>
        <meshPhysicalMaterial
          ref={frontRef}
          color={frontColor}
          transparent
          opacity={opacity}
          roughness={frontRoughness}
          metalness={0}
          clearcoat={frontClearcoat}
          clearcoatRoughness={frontClearcoatRoughness}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

export interface InstanceTransform {
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3 | number;
}

/** The same two-pass faux-transmission technique as GlassShell, but for N
 * repeated instances of one geometry sharing one material each (front pass,
 * back pass) — two draw calls total regardless of instance count, instead
 * of two per instance. Used wherever a form repeats an identical shell
 * several times with only position/rotation/scale varying (Experience's
 * lens segments, Community's companion lenses) — the single largest lever
 * available for the Phase 2C.1 draw-call reduction, since those two forms
 * alone accounted for 18 of Phase 2C's 100 dark-mode draws. */
export function InstancedGlassShell({
  geometry,
  frontColor,
  backColor,
  opacity = 0.55,
  transforms,
  frontRoughness = 0.16,
  frontClearcoat = 0.5,
  frontClearcoatRoughness = 0.28,
}: {
  geometry: THREE.BufferGeometry;
  frontColor: string;
  backColor: string;
  opacity?: number;
  transforms: InstanceTransform[];
  frontRoughness?: number;
  frontClearcoat?: number;
  frontClearcoatRoughness?: number;
}) {
  const count = transforms.length;
  const frontRef = useRef<THREE.InstancedMesh>(null);
  const backRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scaleVec = new THREE.Vector3();
    for (const ref of [frontRef, backRef]) {
      const mesh = ref.current;
      if (!mesh) continue;
      transforms.forEach((t, i) => {
        quaternion.setFromEuler(t.rotation ?? new THREE.Euler());
        if (typeof t.scale === "number") scaleVec.setScalar(t.scale);
        else if (t.scale) scaleVec.copy(t.scale);
        else scaleVec.set(1, 1, 1);
        matrix.compose(t.position, quaternion, scaleVec);
        mesh.setMatrixAt(i, matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
    }
  }, [transforms, geometry]);

  return (
    <>
      <instancedMesh ref={backRef} args={[geometry, undefined, count]} renderOrder={0}>
        <meshPhysicalMaterial color={backColor} transparent opacity={opacity * 0.8} roughness={0.2} metalness={0} side={THREE.BackSide} depthWrite={false} />
      </instancedMesh>
      <instancedMesh ref={frontRef} args={[geometry, undefined, count]} renderOrder={1}>
        <meshPhysicalMaterial
          color={frontColor}
          transparent
          opacity={opacity}
          roughness={frontRoughness}
          metalness={0}
          clearcoat={frontClearcoat}
          clearcoatRoughness={frontClearcoatRoughness}
          side={THREE.FrontSide}
          depthWrite={false}
        />
      </instancedMesh>
    </>
  );
}

/** A view-dependent (fresnel) shell for the moon specifically — a uniform-
 * opacity GlassShell around a sphere reads as a flat-opacity ring at every
 * point on the circumference regardless of viewing angle, which is what
 * made Phase 2C's moon shell look like "a visible blue ring" rather than an
 * optical coating. This instead fades toward zero opacity head-on and rises
 * only near the true grazing silhouette edge, and separately dims on the
 * side facing away from the key light — so the coating all but disappears
 * on the shadowed hemisphere instead of tracing an even circumference all
 * the way around. */
const MOON_SHELL_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const MOON_SHELL_FRAGMENT = `
  uniform vec3 color;
  uniform float opacity;
  uniform vec3 lightDir;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec3 n = normalize(vNormal);
    float fresnel = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 3.2);
    float lit = smoothstep(-0.5, 0.35, dot(n, normalize(lightDir)));
    gl_FragColor = vec4(color, fresnel * opacity * mix(0.12, 1.0, lit));
  }
`;

export function MoonShell({
  radius,
  color,
  opacity = 0.22,
  lightDirection = new THREE.Vector3(4.5, 5, 5.5),
  fadeRef,
}: {
  radius: number;
  color: string;
  opacity?: number;
  lightDirection?: THREE.Vector3;
  /** Optional per-frame multiplier (see FadeRef) — crossfades this shell
   * with the rest of the moon subtree during the theme morph. */
  fadeRef?: FadeRef;
}) {
  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(color) },
      opacity: { value: opacity },
      lightDir: { value: lightDirection.clone().normalize() },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color]
  );
  // Mutated only through this ref, only inside useFrame below — never by
  // touching the `uniforms` object above directly, which the project's
  // react-hooks/immutability rule treats as frozen once useMemo returns it.
  // materialRef.current is the live THREE.ShaderMaterial instance the
  // renderer created from the JSX below (the same object `uniforms` was
  // handed to), so this is the same ref-mutation pattern already used by
  // groupRef.current.position elsewhere in this scene.
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    if (materialRef.current && fadeRef) materialRef.current.uniforms.opacity.value = opacity * fadeRef.current;
  });
  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[radius, 40, 40]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={MOON_SHELL_VERTEX}
        fragmentShader={MOON_SHELL_FRAGMENT}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}
