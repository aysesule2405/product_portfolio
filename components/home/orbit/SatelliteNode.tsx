import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FieldMapCategory } from "@/lib/data/field-map-categories";
import { lighten, darken } from "./procedural";
import { SIMPLEX_NOISE_GLSL } from "./glass";
import { entranceProgress, clickPunchScale, CLICK_PUNCH_DURATION, type FadeRef } from "./motion-utils";
import { ConstellationLine } from "./ConstellationLine";
import { SATELLITE_SCALE, type CategoryId } from "./config";
import type { ThemeMorphState } from "./useThemeMorph";

/**
 * One consistent shape language across all four categories — a gradient-
 * mesh core (see GradientCore) with an orbital ring or moon configuration,
 * differentiated by ring count/proportion rather than by switching geometry
 * families per category. Replaces the earlier Glass Instruments forms
 * (petal shells, a graduated lens stack, an open hex frame, a ring +
 * orbiting cluster) after review found the whole set "confusing at first
 * look" — prototyped as five geometric and five organic directions plus a
 * combined pass at app/satellite-lab (now removed) before landing here:
 * the original "Orbital ring systems" geometry (sphere + ring/moons, same
 * proportions and ring counts as first designed) with only the core
 * sphere's material swapped for a multi-stop gradient plus a glass fresnel
 * rim — "keep the shape of the orbital rings, just add the gradient."
 *
 *   Practice   -> one thin tilted ring
 *   Experience -> two crossing rings (a layered, armillary-sphere read)
 *   Work       -> one flatter, thicker, faceted ring
 *   Community  -> no ring — three small orbiting moons instead
 */
// How much further out a satellite drifts at full scroll-departure (40% of
// its own distance from the centerpiece) — restrained on purpose, per the
// original brief's "short, controlled transition, not another planetary
// flythrough."
const SCROLL_SEPARATION = 0.4;

// Cursor-proximity reaction — the direct response to "not eye-catching, not
// interactive" feedback on the whole scene: satellites now visibly speed up,
// brighten, and grow as the cursor nears their on-screen position, an
// unmissable payoff rather than the previous hover-only glow. Distance is
// measured in normalized device coordinates (the same -1..1 space as
// state.pointer), so PROXIMITY_RADIUS is a fraction of the viewport, not a
// world-space unit.
const PROXIMITY_RADIUS = 0.4;
const PROXIMITY_DAMP_LAMBDA = 6;

// Richer hover feedback — damping the binary isHovered flag rather than
// snapping scale/light to it instantly gives hover a genuine ease in/out
// instead of a hard on/off toggle.
const HOVER_DAMP_LAMBDA = 8;

// The click-confirmation pulse ring — a "sonar ping" expanding out from a
// satellite the instant it's activated, timed to the same window as the
// existing scale punch (CLICK_PUNCH_DURATION) rather than inventing a
// second duration constant.
const PULSE_RING_INNER = 0.78;
const PULSE_RING_OUTER = 1.0;
const PULSE_SCALE_FROM = 0.6;
const PULSE_SCALE_TO = 2.4;

interface RingSpec {
  radius: number;
  tube: number;
  rotation: [number, number, number];
  /** Low radial/tubular segment count + flat shading, for Work's cut-gem
   * read — every other ring stays smooth. */
  faceted?: boolean;
}

interface MoonSpec {
  angle: number;
  distance: number;
  radius: number;
}

interface OrbitalConfig {
  coreRadius: number;
  groupRotation: [number, number, number];
  rings: RingSpec[];
  moons?: MoonSpec[];
}

const ORBITAL_CONFIG: Record<CategoryId, OrbitalConfig> = {
  roots: {
    coreRadius: 0.32,
    groupRotation: [0.55, 0.3, 0],
    rings: [{ radius: 0.55, tube: 0.02, rotation: [Math.PI / 2, 0, 0] }],
  },
  experience: {
    coreRadius: 0.29,
    groupRotation: [0.4, 0.2, 0],
    rings: [
      { radius: 0.49, tube: 0.017, rotation: [Math.PI / 2, 0, 0] },
      { radius: 0.49, tube: 0.017, rotation: [Math.PI / 2, 0.5, 0] },
    ],
  },
  projects: {
    coreRadius: 0.32,
    groupRotation: [0.3, 0.2, 0],
    rings: [{ radius: 0.55, tube: 0.04, rotation: [Math.PI / 2, 0, 0], faceted: true }],
  },
  community: {
    coreRadius: 0.29,
    groupRotation: [0, 0, 0],
    rings: [],
    moons: [0, 1, 2].map((i) => ({ angle: (i / 3) * Math.PI * 2, distance: 0.55, radius: 0.1 })),
  },
};

export function SatelliteNode({
  category,
  theme,
  reduced,
  index,
  position,
  isHovered,
  isActive,
  scrollProgress,
  onHoverChange,
}: {
  category: FieldMapCategory;
  theme: ThemeMorphState;
  reduced: boolean;
  index: number;
  position: THREE.Vector3;
  isHovered: boolean;
  isActive: boolean;
  /** 0–1, owned by Hero.tsx — see CameraRig's doc comment. Read directly
   * (not mirrored into a ref) inside this component's own useFrame, the
   * same way `reduced`/`isActive`/`position` already are: useFrame always
   * calls the latest render's closure, so a plain prop stays current
   * without any extra plumbing. */
  scrollProgress: number;
  onHoverChange: (hovered: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const pointLightRef = useRef<THREE.PointLight>(null);
  const pulseMeshRef = useRef<THREE.Mesh>(null);
  const pulseMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const introStart = useRef<number | null>(null);
  const punchStart = useRef<number | null>(null);
  const proximityRef = useRef(0);
  const hoverAmountRef = useRef(0);
  // Scratch vectors, allocated once — reused every frame via .copy()/scalar
  // mutation below instead of .clone()/`new THREE.Vector3()`, which would
  // otherwise allocate two fresh vectors per satellite per frame (eight per
  // frame across all four) purely for GC to collect a moment later.
  const targetScratch = useMemo(() => new THREE.Vector3(), []);
  const startScratch = useMemo(() => new THREE.Vector3(), []);
  const ndcScratch = useMemo(() => new THREE.Vector3(), []);

  const color = theme === "light" ? category.colorLight : category.colorDark;
  // Brightened well past the satellite's own (often dark/desaturated) base
  // tone — a click confirmation needs to read clearly against a dark scene
  // regardless of how dim that category's color is, the same lesson the
  // gradient core's own brightness floor below applies.
  const pulseColor = useMemo(() => lighten(color, 0.65), [color]);
  const bobSeed = useMemo(() => (category.id.charCodeAt(0) % 7) * 0.9, [category.id]);
  const spinSpeed = useMemo(() => 0.06 + (category.id.charCodeAt(1) % 5) * 0.02, [category.id]);
  const categoryScale = SATELLITE_SCALE[category.id];
  const pulseRingGeometry = useDisposable(useMemo(() => new THREE.RingGeometry(PULSE_RING_INNER, PULSE_RING_OUTER, 40), []));
  const orbitalConfig = ORBITAL_CONFIG[category.id];

  useFrame((state, delta) => {
    const intro = entranceProgress(introStart, state.clock.elapsedTime, 0.3 + index * 0.15, 1.1, reduced);
    const punch = clickPunchScale(punchStart, state.clock.elapsedTime, isActive);
    // clickPunchScale resets punchStart to null the instant isActive goes
    // false, and sets it to the current elapsed time on activation — reusing
    // that same ref here (rather than a second one) keeps the pulse ring
    // exactly in sync with the scale punch instead of two independently
    // timed effects drifting apart.
    const pulseT =
      punchStart.current === null || reduced
        ? 1
        : THREE.MathUtils.clamp((state.clock.elapsedTime - punchStart.current) / CLICK_PUNCH_DURATION, 0, 1);

    hoverAmountRef.current = THREE.MathUtils.damp(hoverAmountRef.current, isHovered ? 1 : 0, HOVER_DAMP_LAMBDA, delta);
    const hoverAmount = hoverAmountRef.current;

    // How close the cursor is to this satellite's on-screen position, in
    // normalized device coordinates — measured before applying this frame's
    // own position update, so it's one frame behind during motion, which is
    // imperceptible at this distance scale. Skipped entirely under reduced
    // motion (near stays 0), matching how every other proximity/parallax
    // effect in this scene degrades.
    let near = 0;
    if (!reduced && groupRef.current) {
      ndcScratch.copy(groupRef.current.position).project(state.camera);
      const screenDist = Math.hypot(ndcScratch.x - state.pointer.x, ndcScratch.y - state.pointer.y);
      near = THREE.MathUtils.clamp(1 - screenDist / PROXIMITY_RADIUS, 0, 1);
    }
    proximityRef.current = THREE.MathUtils.damp(proximityRef.current, near, PROXIMITY_DAMP_LAMBDA, delta);
    const proximity = proximityRef.current;

    if (groupRef.current) {
      const bob = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.7 + bobSeed) * 0.08 * intro;
      const departed = reduced ? 0 : scrollProgress;
      targetScratch.copy(position).multiplyScalar(1 + departed * SCROLL_SEPARATION);
      startScratch.copy(targetScratch).setY(targetScratch.y - 5);
      groupRef.current.position.lerpVectors(startScratch, targetScratch, intro);
      groupRef.current.position.y += bob;
      const hoverScale = 1 + hoverAmount * 0.12 + proximity * 0.28;
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, intro) * punch * hoverScale * categoryScale);
    }
    if (spinRef.current && !reduced) {
      // Minimal static rotation for evaluating the form at rest, boosted
      // sharply as the cursor approaches — the "wakes up" half of the
      // proximity reaction, paired with the brightness boost below.
      spinRef.current.rotation.y += delta * spinSpeed * (1 + proximity * 4);
    }
    if (pointLightRef.current) {
      pointLightRef.current.intensity = hoverAmount * 1.6 + (isActive ? 1.0 : 0) + proximity * 2.4;
    }
    if (pulseMeshRef.current && pulseMaterialRef.current) {
      pulseMeshRef.current.scale.setScalar(THREE.MathUtils.lerp(PULSE_SCALE_FROM, PULSE_SCALE_TO, pulseT) * categoryScale);
      pulseMaterialRef.current.opacity = (1 - pulseT) * 0.85;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <ConstellationLine
        targetPosition={position}
        color={color}
        opacity={(isHovered || isActive ? 0.65 : 0.3) * (1 - (reduced ? 0 : scrollProgress))}
      />
      <pointLight
        ref={pointLightRef}
        color={color}
        intensity={(isHovered ? 1.6 : 0) + (isActive ? 1.0 : 0)}
        distance={2.6}
        position={[0.3, 0.25, 0.8]}
      />
      {/* The click-confirmation pulse — a thin ring expanding outward and
          fading over the same CLICK_PUNCH_DURATION window as the scale
          punch, giving activation a clear "confirmed, launching" signal
          distinct from the punch alone. Opacity-driven (never unmounted),
          so it costs nothing extra when idle beyond the one draw call. */}
      <mesh ref={pulseMeshRef} geometry={pulseRingGeometry}>
        <meshBasicMaterial ref={pulseMaterialRef} color={pulseColor} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <group ref={spinRef} onPointerEnter={(e) => { e.stopPropagation(); onHoverChange(true); }} onPointerLeave={(e) => { e.stopPropagation(); onHoverChange(false); }}>
        <OrbitalLens color={color} config={orbitalConfig} proximityRef={proximityRef} reduced={reduced} />
      </group>
    </group>
  );
}

function useDisposable<T extends { dispose: () => void }>(value: T) {
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

const GRADIENT_CORE_VERTEX = `
  uniform float uTime;
  uniform vec3 uPointerDir;
  uniform float uAmbientAmount;
  uniform float uBulgeAmount;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  ${SIMPLEX_NOISE_GLSL}

  void main() {
    vec3 n = normalize(normal);
    // Bulge test uses the view-space-transformed normal, not the raw local
    // one — this core spins continuously inside SatelliteNode's spinRef
    // group, and a local-space dot product would anchor the "facing the
    // cursor" patch to a fixed set of vertices that rotates away with it
    // instead of tracking the cursor (same fix applied to CelestialBody's
    // moon/sun core this session — see injectReactiveDisplacement in
    // glass.tsx for the full explanation).
    vec3 viewNormal = normalize(normalMatrix * normal);
    float ambientDisp = snoise(n * 2.4 + vec3(0.0, 0.0, uTime * 0.12)) * uAmbientAmount;
    float bulgeDisp = pow(max(dot(viewNormal, uPointerDir), 0.0), 3.0) * uBulgeAmount;
    vec3 pos = position + n * (ambientDisp + bulgeDisp);
    vNormal = viewNormal;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const GRADIENT_CORE_FRAGMENT = `
  uniform vec3 colorA;
  uniform vec3 colorB;
  uniform vec3 colorC;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vec3 n = normalize(vNormal);
    float t = n.y * 0.5 + 0.5;
    vec3 base = t < 0.5 ? mix(colorA, colorB, t * 2.0) : mix(colorB, colorC, (t - 0.5) * 2.0);
    float fresnel = pow(1.0 - max(dot(n, normalize(vViewDir)), 0.0), 2.2);
    vec3 col = base + fresnel * 0.4;
    gl_FragColor = vec4(col, 1.0);
  }
`;

/** The satellites' gradient-mesh core — a three-stop gradient (dark/base/
 * light, derived from the category's own resolved color so it follows the
 * dark/light theme automatically) plus a glass fresnel rim, and the same
 * cursor-reactive displacement the centerpiece's moon/sun core uses.
 * Prototyped as "Gradient mesh orbs" at app/satellite-lab (now removed). */
function GradientCore({
  color,
  radius,
  proximityRef,
  reduced,
}: {
  color: string;
  radius: number;
  proximityRef: FadeRef;
  reduced: boolean;
}) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const gradientColors = useMemo<[string, string, string]>(() => [darken(color, 0.45), color, lighten(color, 0.55)], [color]);
  const uniforms = useMemo(
    () => ({
      colorA: { value: new THREE.Color(gradientColors[0]) },
      colorB: { value: new THREE.Color(gradientColors[1]) },
      colorC: { value: new THREE.Color(gradientColors[2]) },
      uTime: { value: 0 },
      uPointerDir: { value: new THREE.Vector3(0, 0, 1) },
      uAmbientAmount: { value: radius * 0.14 },
      uBulgeAmount: { value: radius * 0.4 },
    }),
    [gradientColors, radius]
  );
  useFrame((state) => {
    if (reduced || !matRef.current) return;
    matRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    (matRef.current.uniforms.uPointerDir.value as THREE.Vector3).set(state.pointer.x, state.pointer.y, 0.6).normalize();
    // Proximity gates the ambient term's effective amplitude, same pattern
    // as the moon/sun core — an idle satellite stays calmer than one
    // actively being approached, rather than every satellite reacting
    // equally regardless of cursor distance.
    matRef.current.uniforms.uAmbientAmount.value = radius * 0.14 * (0.35 + proximityRef.current * 0.65);
  });
  return (
    <mesh>
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial ref={matRef} uniforms={uniforms} vertexShader={GRADIENT_CORE_VERTEX} fragmentShader={GRADIENT_CORE_FRAGMENT} />
    </mesh>
  );
}

/** Renders one category's gradient core plus its ring(s) or moons, per
 * ORBITAL_CONFIG. Rings and moons stay a plain lit material — only the core
 * carries the gradient, per "keep the shape of the orbital rings, just add
 * the gradient." */
function OrbitalLens({
  color,
  config,
  proximityRef,
  reduced,
}: {
  color: string;
  config: OrbitalConfig;
  proximityRef: FadeRef;
  reduced: boolean;
}) {
  return (
    <group rotation={config.groupRotation}>
      <GradientCore color={color} radius={config.coreRadius} proximityRef={proximityRef} reduced={reduced} />
      {config.rings.map((ring, i) => (
        <mesh key={i} rotation={ring.rotation}>
          <torusGeometry args={[ring.radius, ring.tube, ring.faceted ? 6 : 8, ring.faceted ? 6 : 48]} />
          <meshStandardMaterial color={color} roughness={ring.faceted ? 0.2 : 0.25} metalness={ring.faceted ? 0.35 : 0.3} flatShading={ring.faceted} />
        </mesh>
      ))}
      {config.moons?.map((moon, i) => (
        <mesh key={i} position={[Math.cos(moon.angle) * moon.distance, 0, Math.sin(moon.angle) * moon.distance]}>
          <sphereGeometry args={[moon.radius, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.35} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}
