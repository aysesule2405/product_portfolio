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
  // The "light" side of each lerp target, pre-allocated once — LIGHTING_TONE
  // is a constant, so these never need to change after construction. Reused
  // every frame below instead of `new THREE.Color(...)`, which ran on every
  // frame this component rendered (i.e. almost always) regardless of whether
  // a theme transition was even in progress.
  const lightKeyColor = useMemo(() => new THREE.Color(LIGHTING_TONE.light.key), []);
  const lightSkyColor = useMemo(() => new THREE.Color(LIGHTING_TONE.light.sky), []);
  const lightGroundColor = useMemo(() => new THREE.Color(LIGHTING_TONE.light.ground), []);
  const lightRimColor = useMemo(() => new THREE.Color(LIGHTING_TONE.light.rim), []);

  useFrame(() => {
    const m = morphRef.current;
    const dark = LIGHTING_TONE.dark;
    const light = LIGHTING_TONE.light;
    if (keyRef.current) {
      keyColor.set(dark.key).lerp(lightKeyColor, m);
      keyRef.current.color.copy(keyColor);
      keyRef.current.intensity = THREE.MathUtils.lerp(dark.keyIntensity, light.keyIntensity, m);
    }
    if (hemiRef.current) {
      skyColor.set(dark.sky).lerp(lightSkyColor, m);
      groundColor.set(dark.ground).lerp(lightGroundColor, m);
      hemiRef.current.color.copy(skyColor);
      hemiRef.current.groundColor.copy(groundColor);
      hemiRef.current.intensity = THREE.MathUtils.lerp(dark.hemiIntensity, light.hemiIntensity, m);
    }
    if (rimRef.current) {
      rimColor.set(dark.rim).lerp(lightRimColor, m);
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

export interface InstanceTransform {
  position: THREE.Vector3;
  rotation?: THREE.Euler;
  scale?: THREE.Vector3 | number;
}

/** A view-dependent (fresnel) shell, shared by the moon and sun — a uniform-
 * opacity GlassShell around a sphere reads as a flat-opacity ring at every
 * point on the circumference regardless of viewing angle, which is what
 * made Phase 2C's moon shell look like "a visible blue ring" rather than an
 * optical coating. This instead fades toward zero opacity head-on and rises
 * only near the true grazing silhouette edge, and separately dims on the
 * side facing away from the key light — so the coating all but disappears
 * on the shadowed hemisphere instead of tracing an even circumference all
 * the way around.
 *
 * Renamed from MoonShell (Phase 2C.1) and given real vertex displacement —
 * the direct result of the user's "not eye-catching, not interactive"
 * feedback on the whole scene: a continuous, low-frequency noise ripple
 * (so the coating reads as alive even at rest) plus a much stronger bulge
 * toward the cursor, so the payoff is immediate and unmissable rather than
 * the few tenths of a degree of camera parallax this scene had before. The
 * solid moon/sun core underneath is untouched — only the glass coating
 * itself ripples, which keeps the celestial body geologically believable
 * while making the material around it feel tactile and reactive. Reused for
 * the sun (replacing its old two-pass GlassShell) so both states share one
 * reactive mechanism rather than the moon alone feeling upgraded. */
// Ashima/webgl-noise 3D simplex noise — compact, widely-used, not hand-rolled
// from scratch here. Shared between RippleShell and InstancedRippleShell (the
// centerpiece and the satellites' glass shells) via string interpolation
// rather than pasted twice, so a future tweak can't drift between the two.
export const SIMPLEX_NOISE_GLSL = `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

const RIPPLE_SHELL_VERTEX = `
  uniform float uTime;
  uniform vec3 uPointerDir;
  uniform float uAmbientAmount;
  uniform float uBulgeAmount;
  uniform float uMorphBoost;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDisplacement;

  ${SIMPLEX_NOISE_GLSL}

  void main() {
    vec3 n = normalize(normal);
    float ambient = snoise(n * 2.4 + vec3(0.0, 0.0, uTime * 0.12)) * uAmbientAmount;
    float bulge = pow(max(dot(n, uPointerDir), 0.0), 3.0) * uBulgeAmount;
    // A separate, higher-frequency, faster-moving noise sample — distinct
    // from the ambient term so it reads as the shell genuinely convulsing
    // through the transformation, not just a bigger version of the same
    // slow idle ripple. uMorphBoost is 0 at rest and peaks mid-transition
    // (see CelestialBody's 4*m*(1-m) — zero at either settled end, peak
    // exactly halfway through the crossfade).
    float morphRipple = snoise(n * 5.5 + vec3(uTime * 0.9, uTime * 0.6, 0.0)) * uMorphBoost * uAmbientAmount * 3.0;
    float displacement = ambient + bulge + morphRipple;
    vDisplacement = displacement;
    vec3 pos = position + n * displacement;
    vNormal = normalize(normalMatrix * n);
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RIPPLE_SHELL_FRAGMENT = `
  uniform vec3 color;
  uniform vec3 highlightColor;
  uniform float opacity;
  uniform vec3 lightDir;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying float vDisplacement;
  void main() {
    vec3 n = normalize(vNormal);
    float fresnel = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 3.2);
    float lit = smoothstep(-0.5, 0.35, dot(n, normalize(lightDir)));
    vec3 base = mix(color, highlightColor, clamp(vDisplacement * 3.0, 0.0, 1.0));
    float alpha = fresnel * opacity * mix(0.12, 1.0, lit);
    alpha += smoothstep(0.35, 0.9, vDisplacement) * 0.35;
    gl_FragColor = vec4(base, clamp(alpha, 0.0, 1.0));
  }
`;

/** A minimal shape for what we need out of the `shader` object three.js
 * hands `onBeforeCompile` — avoids depending on the exact exported type name
 * for that parameter across three.js versions. */
export interface ReactiveShaderHandle {
  uniforms: {
    uTime: { value: number };
    uPointerDir: { value: THREE.Vector3 };
    [key: string]: { value: unknown };
  };
  vertexShader: string;
}

/** Grafts the same noise-ripple + cursor-bulge displacement RippleShell and
 * InstancedRippleShell use onto a *built-in* material (MeshStandardMaterial,
 * MeshPhysicalMaterial) via `onBeforeCompile` — the direct response to "the
 * 3D objects" needing to morph on interaction, not just their glass
 * coating. `onBeforeCompile` is the standard three.js technique for adding
 * custom vertex displacement to a built-in material while keeping its real
 * lighting model (PBR, flat shading, etc.) intact — the alternative, a fully
 * custom shader, would mean hand-rolling the lighting these materials
 * already get for free. `onCompiled` receives the live shader object so the
 * caller can stash it (in a ref — never read during render, only inside a
 * later useFrame) and update uTime/uPointerDir every frame; three.js only
 * calls onBeforeCompile once, at first compile, not every frame. */
export function injectReactiveDisplacement(
  material: THREE.Material,
  ambientAmount: number,
  bulgeAmount: number,
  onCompiled: (shader: ReactiveShaderHandle) => void
) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = { value: 0 };
    shader.uniforms.uPointerDir = { value: new THREE.Vector3(0, 0, 1) };
    shader.uniforms.uAmbientAmount = { value: ambientAmount };
    shader.uniforms.uBulgeAmount = { value: bulgeAmount };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform float uTime;
        uniform vec3 uPointerDir;
        uniform float uAmbientAmount;
        uniform float uBulgeAmount;
        ${SIMPLEX_NOISE_GLSL}
        `
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        {
          // The bulge test compares uPointerDir (roughly view-space) against
          // a VIEW-space-transformed normal (normalMatrix * normal), not the
          // raw local-space one — these meshes spin continuously on their own
          // axis (see CelestialBody/SatelliteNode's rotation.y += delta*...),
          // and a local-space dot product anchors the "facing the cursor"
          // patch to a fixed set of vertices that rotates away with the mesh
          // instead of tracking the cursor. normalMatrix already folds in the
          // mesh's live rotation (and any parent tilt), so this keeps the
          // reactive patch on whichever side is currently facing the cursor
          // regardless of spin. The actual displacement direction/amount
          // still uses the local-space normal, since it's added to the
          // running transformed position before the model transform is
          // applied.
          vec3 dispNormal = normalize(normal);
          vec3 viewNormal = normalize(normalMatrix * normal);
          float ambientDisp = snoise(dispNormal * 2.1 + vec3(0.0, 0.0, uTime * 0.1)) * uAmbientAmount;
          float bulgeDisp = pow(max(dot(viewNormal, uPointerDir), 0.0), 3.0) * uBulgeAmount;
          transformed += dispNormal * (ambientDisp + bulgeDisp);
        }
        `
      );
    onCompiled(shader as unknown as ReactiveShaderHandle);
  };
}

/** Pairs with injectReactiveDisplacement — call once per frame with whatever
 * ref onCompiled stashed the shader into. A no-op before the material has
 * compiled for the first time (shader still null) or under reduced motion
 * (caller should just not call this at all in that case, same as every
 * other motion source in this scene). */
export function updateReactiveDisplacement(shader: ReactiveShaderHandle | null, elapsedTime: number, pointerX: number, pointerY: number) {
  if (!shader) return;
  shader.uniforms.uTime.value = elapsedTime;
  shader.uniforms.uPointerDir.value.set(pointerX, pointerY, 0.6).normalize();
}

export function RippleShell({
  radius,
  color,
  highlightColor,
  opacity = 0.22,
  lightDirection = new THREE.Vector3(4.5, 5, 5.5),
  fadeRef,
  morphBoostRef,
  reduced = false,
}: {
  radius: number;
  color: string;
  /** The tone the shell glows toward where displacement is strongest — the
   * one place this component intentionally reads as "reacting," not just
   * catching light. Pass a color from the same theme tone the rest of the
   * centerpiece uses (CENTERPIECE_TONE.dark.rim / .light.hotspot) rather
   * than inventing a new accent. */
  highlightColor: string;
  opacity?: number;
  lightDirection?: THREE.Vector3;
  /** Optional per-frame multiplier (see FadeRef) — crossfades this shell
   * with the rest of the moon/sun subtree during the theme morph. */
  fadeRef?: FadeRef;
  /** 0 at rest, peaking mid-transition — an extra, faster/higher-frequency
   * ripple layered on top of the idle ambient noise specifically while the
   * theme morph is in progress, so the transformation itself reads as part
   * of the reactive-distortion language rather than a plain opacity
   * crossfade. See CelestialBody for how this is derived from morphRef. */
  morphBoostRef?: FadeRef;
  /** Freezes the ripple (no time-driven animation, no pointer reaction) —
   * the shell still reads as a slightly organic, non-flat coating, it just
   * stops moving and stops responding to input, matching how every other
   * motion source in this scene degrades under reduced motion. */
  reduced?: boolean;
}) {
  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(color) },
      highlightColor: { value: new THREE.Color(highlightColor) },
      opacity: { value: opacity },
      lightDir: { value: lightDirection.clone().normalize() },
      uTime: { value: 0 },
      uPointerDir: { value: new THREE.Vector3(0, 0, 1) },
      // Displacement amplitude scales with the shell's own radius rather
      // than a fixed world-unit constant, so the effect reads the same
      // relative "aliveness" regardless of how large a given shell is.
      uAmbientAmount: { value: radius * 0.035 },
      uBulgeAmount: { value: radius * 0.11 },
      uMorphBoost: { value: 0 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, highlightColor, radius]
  );
  // Mutated only through this ref, only inside useFrame below — never by
  // touching the `uniforms` object above directly, which the project's
  // react-hooks/immutability rule treats as frozen once useMemo returns it.
  // materialRef.current is the live THREE.ShaderMaterial instance the
  // renderer created from the JSX below (the same object `uniforms` was
  // handed to), so this is the same ref-mutation pattern already used by
  // groupRef.current.position elsewhere in this scene.
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  useFrame((state) => {
    if (!materialRef.current) return;
    if (fadeRef) materialRef.current.uniforms.opacity.value = opacity * fadeRef.current;
    if (!reduced) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const pointerDir = materialRef.current.uniforms.uPointerDir.value as THREE.Vector3;
      pointerDir.set(state.pointer.x, state.pointer.y, 0.6).normalize();
      materialRef.current.uniforms.uMorphBoost.value = morphBoostRef ? morphBoostRef.current : 0;
    } else {
      materialRef.current.uniforms.uMorphBoost.value = 0;
    }
  });
  return (
    <mesh renderOrder={1}>
      <sphereGeometry args={[radius, 64, 64]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={RIPPLE_SHELL_VERTEX}
        fragmentShader={RIPPLE_SHELL_FRAGMENT}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </mesh>
  );
}

// three.js's WebGLProgram prepends a standard vertex-shader prelude to every
// material — built-in or custom — that already includes
// `#ifdef USE_INSTANCING attribute mat4 instanceMatrix; #endif` whenever the
// material is used on an InstancedMesh. Re-declaring it here caused a real
// "redefinition" compile error caught in testing (the shell failed to
// compile at all, i.e., the satellites lost their shells entirely) — the
// attribute just needs to be *used*, not declared. Displacement is computed
// in the geometry's own local space (before the instance matrix is
// applied), so every instance ripples/bulges independently despite sharing
// one geometry, one material, and one draw call.
const INSTANCED_RIPPLE_VERTEX = `
  uniform float uTime;
  uniform vec3 uPointerDir;
  uniform float uProximity;
  uniform float uAmbientAmount;
  uniform float uBulgeAmount;
  varying float vDisplacement;

  ${SIMPLEX_NOISE_GLSL}

  void main() {
    vec3 n = normalize(normal);
    // The bulge test uses a view-space-transformed normal, not the raw
    // local-space one — this shell sits inside SatelliteNode's spinRef group,
    // which spins continuously, and a local-space dot product would anchor
    // the "facing the cursor" patch to a fixed set of vertices that rotates
    // away with the satellite instead of tracking the cursor (same fix as
    // injectReactiveDisplacement in this file). normalMatrix here reflects
    // the mesh's own (and its spinning parent's) current rotation, though not
    // each instance's own additional offset rotation within the shared
    // geometry — a per-instance-correct version would need the instance
    // matrix's inverse-transpose, which the fragment shader's note above
    // already opted out of for the same non-uniform-scale reason.
    vec3 viewNormal = normalize(normalMatrix * normal);
    float ambient = snoise(n * 2.8 + vec3(0.0, 0.0, uTime * 0.15)) * uAmbientAmount;
    // Bulge is scaled by uProximity — how close the cursor is to *this
    // satellite* (computed once per satellite in SatelliteNode, not
    // per-instance) — so a satellite being approached ripples noticeably
    // harder than one sitting idle across the scene, rather than every
    // satellite reacting equally to a global pointer direction.
    float bulge = pow(max(dot(viewNormal, uPointerDir), 0.0), 3.0) * uBulgeAmount * uProximity;
    float displacement = ambient + bulge;
    vDisplacement = displacement;
    vec3 pos = position + n * displacement;

    // Deliberately not carrying a per-instance-transformed normal forward —
    // see the fragment shader's note. Only position needs the instance
    // matrix; #ifdef USE_INSTANCING here still just *uses* the
    // three.js-provided instanceMatrix attribute, never re-declares it (see
    // the redefinition note above).
    #ifdef USE_INSTANCING
      vec4 instancePosition = instanceMatrix * vec4(pos, 1.0);
    #else
      vec4 instancePosition = vec4(pos, 1.0);
    #endif

    vec4 mvPosition = modelViewMatrix * instancePosition;
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const INSTANCED_RIPPLE_FRAGMENT = `
  uniform vec3 color;
  uniform vec3 highlightColor;
  uniform float opacity;
  varying float vDisplacement;
  void main() {
    // No fresnel/view-angle term here, unlike RippleShell's centerpiece
    // version — this shell's instance matrix can carry strong non-uniform
    // scale (ColumnLens's lenses flatten to ~30% on one axis), and a fresnel
    // term needs a correctly transformed normal, which non-uniform scaling
    // breaks unless you use an inverse-transpose (not attempted here — not
    // worth the complexity for a fresnel accent). Skipped proactively rather
    // than shipped wrong.
    //
    // This shell is also fully unlit (no directional/hemisphere response),
    // unlike the MeshPhysicalMaterial-based shell it replaced — that one
    // always read clearly because the scene's own lights shaded it
    // regardless of the category's raw hex luminance. That turned out to be
    // a real, separate bug caught in testing: a flat unlit color alone
    // left Experience's indigo (#4f4a7a, deliberately dark/desaturated)
    // nearly invisible against the scene's dark background, while brighter
    // category colors (Practice's coral, Community's cyan) happened to still
    // read fine at the same opacity. A baseline mix toward the lighter
    // highlightColor (not just where displacement is active) sets a
    // brightness floor so every category color reads clearly at rest, then
    // ramps further toward the highlight where the shell is actively
    // rippling.
    vec3 base = mix(color, highlightColor, 0.3 + clamp(vDisplacement * 4.0, 0.0, 1.0) * 0.7);
    float alpha = opacity;
    alpha += smoothstep(0.25, 0.7, vDisplacement) * 0.3;
    gl_FragColor = vec4(base, clamp(alpha, 0.0, 1.0));
  }
`;

/** The satellites' equivalent of RippleShell — same reactive-distortion
 * language (idle noise ripple, cursor bulge) as the centerpiece, replacing
 * InstancedGlassShell for the three satellite forms that have a glass shell
 * (Practice, Experience, Community; Work's open-frame design has no
 * comparable shell surface). One instanced draw call regardless of instance
 * count, same as InstancedGlassShell — this doesn't cost anything extra on
 * the draw-call budget, just changes what each shell's shader does. */
export function InstancedRippleShell({
  geometry,
  color,
  highlightColor,
  opacity = 0.5,
  transforms,
  proximityRef,
  reduced = false,
}: {
  geometry: THREE.BufferGeometry;
  color: string;
  highlightColor: string;
  opacity?: number;
  transforms: InstanceTransform[];
  /** 0–1, computed once per satellite in SatelliteNode's own useFrame (see
   * PROXIMITY_RADIUS there) — how hard this satellite's shell bulges scales
   * with how close the cursor is to the satellite as a whole, not to any
   * individual instance within it. */
  proximityRef?: FadeRef;
  reduced?: boolean;
}) {
  const count = transforms.length;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    const quaternion = new THREE.Quaternion();
    const scaleVec = new THREE.Vector3();
    transforms.forEach((t, i) => {
      quaternion.setFromEuler(t.rotation ?? new THREE.Euler());
      if (typeof t.scale === "number") scaleVec.setScalar(t.scale);
      else if (t.scale) scaleVec.copy(t.scale);
      else scaleVec.set(1, 1, 1);
      matrix.compose(t.position, quaternion, scaleVec);
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [transforms, geometry]);

  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(color) },
      highlightColor: { value: new THREE.Color(highlightColor) },
      opacity: { value: opacity },
      uTime: { value: 0 },
      uPointerDir: { value: new THREE.Vector3(0, 0, 1) },
      uProximity: { value: 0 },
      // Smaller absolute amplitude than the centerpiece's RippleShell —
      // these shells wrap much smaller forms, and displacement is computed
      // in the shared base geometry's own local space (before each
      // instance's own scale is applied), so the same absolute value already
      // reads proportionally larger on a small satellite than the
      // centerpiece's would on the moon.
      uAmbientAmount: { value: 0.012 },
      uBulgeAmount: { value: 0.075 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, highlightColor]
  );

  useFrame((state) => {
    if (!materialRef.current) return;
    // opacity isn't in the uniforms useMemo's dependency array (only color/
    // highlightColor are, to avoid rebuilding the whole uniforms object on
    // every hover-driven opacity change) — syncing it here every frame from
    // the latest render's prop value keeps it live without that rebuild.
    materialRef.current.uniforms.opacity.value = opacity;
    if (!reduced) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
      const pointerDir = materialRef.current.uniforms.uPointerDir.value as THREE.Vector3;
      pointerDir.set(state.pointer.x, state.pointer.y, 0.6).normalize();
      materialRef.current.uniforms.uProximity.value = proximityRef ? proximityRef.current : 0;
    } else {
      materialRef.current.uniforms.uProximity.value = 0;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, count]} renderOrder={1}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={INSTANCED_RIPPLE_VERTEX}
        fragmentShader={INSTANCED_RIPPLE_FRAGMENT}
        transparent
        depthWrite={false}
        side={THREE.FrontSide}
      />
    </instancedMesh>
  );
}
