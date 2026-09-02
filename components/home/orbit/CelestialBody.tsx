import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RimGlow, useCraterTerrainTextures } from "./procedural";
import { Corona, GlassShell } from "./glass";
import { entranceProgress } from "./motion-utils";
import { CENTERPIECE_RADIUS, CENTERPIECE_TONE } from "./config";
import type { ThemeMorphState } from "./useThemeMorph";

/**
 * The scene's one centerpiece — Glass Instruments' material language (a
 * small emissive core wrapped in a nested translucent shell) built around a
 * real spherical moon/sun rather than an abstract orb, per the Phase 2B
 * direction: pure glass read as "an elegant lit sphere," not specifically a
 * moon or sun, so the crater/maria surface and the layered warm gradient
 * were folded back in as the outer, "tactile" layer — the glass shell now
 * wraps *around* a recognizable celestial surface instead of standing in
 * for it. Same silhouette (a plain sphere, not a faceted gem) in both
 * themes, so the object still reads as one instrument changing state.
 */
export function CelestialBody({ theme, reduced }: { theme: ThemeMorphState; reduced: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const introStart = useRef<number | null>(null);
  const radius = CENTERPIECE_RADIUS;

  // Both branches' work runs unconditionally — `theme` can change while this
  // component stays mounted (a live theme toggle), and conditionally calling
  // hooks on only one branch would change the hook count between renders.
  const { colorTexture, normalTexture } = useCraterTerrainTextures(CENTERPIECE_TONE.dark.body, theme === "dark", "centerpiece-moon");

  const surfaceGeometry = useMemo(() => new THREE.SphereGeometry(radius, 64, 64), [radius]);
  useEffect(() => () => surfaceGeometry.dispose(), [surfaceGeometry]);
  const shellGeometry = useMemo(() => new THREE.SphereGeometry(radius * 1.06, 48, 48), [radius]);
  useEffect(() => () => shellGeometry.dispose(), [shellGeometry]);
  const coreGeometry = useMemo(() => new THREE.SphereGeometry(radius * 0.55, 32, 32), [radius]);
  useEffect(() => () => coreGeometry.dispose(), [coreGeometry]);

  const moonSurfaceMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: colorTexture,
        normalMap: normalTexture,
        normalScale: new THREE.Vector2(0.85, 0.85),
        roughness: 0.6,
        metalness: 0.04,
        clearcoat: 0.35,
        clearcoatRoughness: 0.3,
        transparent: true,
        opacity: 0.95,
      }),
    [colorTexture, normalTexture]
  );
  useEffect(() => () => moonSurfaceMaterial.dispose(), [moonSurfaceMaterial]);

  const sunUniforms = useMemo(
    () => ({
      core: { value: new THREE.Color(CENTERPIECE_TONE.light.core) },
      mid: { value: new THREE.Color(CENTERPIECE_TONE.light.mid) },
      edge: { value: new THREE.Color(CENTERPIECE_TONE.light.edge) },
    }),
    []
  );

  useFrame((state, delta) => {
    if (meshRef.current && !reduced) {
      // Minimal static rotation, per Phase 2B scope — enough to evaluate the
      // craters/gradient from more than one angle, not ambient Phase 3 motion.
      meshRef.current.rotation.y += delta * 0.045;
    }
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    if (groupRef.current) {
      const targetX = reduced ? 0 : pointer.current.y * 0.14;
      const targetY = reduced ? 0 : pointer.current.x * 0.18;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.04);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.04);
      const intro = entranceProgress(introStart, state.clock.elapsedTime, 0, 1.8, reduced);
      groupRef.current.position.y = THREE.MathUtils.lerp(-4.5, 0, intro);
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.45, 1, intro));
    }
  });

  if (theme === "dark") {
    return (
      <group ref={groupRef}>
        <Corona color={CENTERPIECE_TONE.dark.rim} radius={radius * 1.7} opacity={0.14} />
        {/* Inner core: the "cool internal glass layer" beneath the tactile
            crater surface — visible as a faint cool glow through the
            surface material's own slight translucency (opacity 0.95, not
            1), not meant to be a distinct visible shape on its own. */}
        <mesh geometry={coreGeometry}>
          <meshStandardMaterial color={CENTERPIECE_TONE.dark.core} emissive={CENTERPIECE_TONE.dark.core} emissiveIntensity={0.4} roughness={0.4} />
        </mesh>
        <mesh ref={meshRef} geometry={surfaceGeometry} material={moonSurfaceMaterial} />
        {/* Outer nested shell — the Glass Instruments signature (see
            GlassShell) applied to a real sphere instead of a gem, giving the
            moon its "thin luminous edge" without a separate additive rim. */}
        <GlassShell geometry={shellGeometry} frontColor={CENTERPIECE_TONE.dark.shellFront} backColor={CENTERPIECE_TONE.dark.shellBack} opacity={0.16} />
        <RimGlow color={CENTERPIECE_TONE.dark.rim} radius={radius} power={2.8} glowIntensity={0.5} />
      </group>
    );
  }

  return (
    <group ref={groupRef}>
      <Corona color={CENTERPIECE_TONE.light.edge} radius={radius * 2.0} opacity={0.12} />
      <Corona color={CENTERPIECE_TONE.light.core} radius={radius * 1.3} opacity={0.18} />
      <mesh geometry={coreGeometry}>
        <meshStandardMaterial color={CENTERPIECE_TONE.light.core} emissive={CENTERPIECE_TONE.light.mid} emissiveIntensity={0.5} roughness={0.35} />
      </mesh>
      <mesh ref={meshRef} geometry={surfaceGeometry}>
        <shaderMaterial uniforms={sunUniforms} vertexShader={SUN_VERTEX} fragmentShader={SUN_FRAGMENT} />
      </mesh>
      <GlassShell geometry={shellGeometry} frontColor={CENTERPIECE_TONE.light.shellFront} backColor={CENTERPIECE_TONE.light.shellBack} opacity={0.22} />
    </group>
  );
}

const SUN_VERTEX = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Three-stop gradient (core -> mid -> edge) rather than a single lerp, so
// the sun keeps visible tonal definition across its whole visible disc
// instead of flattening into two flat bands — "enough tonal definition
// that the sun remains a sphere rather than becoming a flat white or
// yellow disc."
const SUN_FRAGMENT = `
  uniform vec3 core;
  uniform vec3 mid;
  uniform vec3 edge;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 45.164))) * 43758.5453); }
  void main() {
    float facing = max(dot(normalize(vNormal), normalize(vViewDir)), 0.0);
    float t = pow(1.0 - facing, 1.5);
    vec3 base = t < 0.5 ? mix(core, mid, t * 2.0) : mix(mid, edge, (t - 0.5) * 2.0);
    float grain = (hash(floor(vNormal * 60.0)) - 0.5) * 0.035;
    gl_FragColor = vec4(base + grain, 1.0);
  }
`;
