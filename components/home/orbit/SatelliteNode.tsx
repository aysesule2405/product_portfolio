import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FieldMapCategory } from "@/lib/data/field-map-categories";
import { RimGlow, darken, lighten } from "./procedural";
import { GlassShell, petalGeometry } from "./glass";
import { entranceProgress, clickPunchScale } from "./motion-utils";
import { ConstellationLine } from "./ConstellationLine";
import { SATELLITE_SCALE } from "./config";
import type { ThemeMorphState } from "./useThemeMorph";

/**
 * One of the four category forms, in the Glass Instruments material
 * language throughout (see GlassShell: two coincident transparent passes,
 * no real transmission) — but not the same silhouette repeated four times.
 * Phase 2C rebuilt Experience and Work after review found them unreadable
 * at the hero's actual on-screen size (a "purple bow" and "a gold
 * cylinder"), enlarged all four via SATELLITE_SCALE, and gave every shell a
 * genuinely darker back-face tint (previously front and back were the same
 * color, which meant no real depth contrast, especially in light mode):
 *
 *   Practice   -> petal shells (Glass's own — kept, minor depth refinement)
 *   Experience -> a vertical stack of lens segments threaded on a luminous
 *                 spine (rebuilt — the old flat pleated plate read as a bow)
 *   Work       -> an open hex-frame around a rotated, offset inner core
 *                 (rebuilt — the old solid shell hid the nesting entirely)
 *   Community  -> ring + orbiting lens cluster (Glass's own — enlarged,
 *                 given connecting rails and a heavier central lens)
 */
export function SatelliteNode({
  category,
  theme,
  reduced,
  index,
  position,
  isHovered,
  isActive,
  onHoverChange,
}: {
  category: FieldMapCategory;
  theme: ThemeMorphState;
  reduced: boolean;
  index: number;
  position: THREE.Vector3;
  isHovered: boolean;
  isActive: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const spinRef = useRef<THREE.Group>(null);
  const introStart = useRef<number | null>(null);
  const punchStart = useRef<number | null>(null);

  const color = theme === "light" ? category.colorLight : category.colorDark;
  const bobSeed = useMemo(() => (category.id.charCodeAt(0) % 7) * 0.9, [category.id]);
  const spinSpeed = useMemo(() => 0.06 + (category.id.charCodeAt(1) % 5) * 0.02, [category.id]);
  const categoryScale = SATELLITE_SCALE[category.id];

  useFrame((state, delta) => {
    const intro = entranceProgress(introStart, state.clock.elapsedTime, 0.3 + index * 0.15, 1.1, reduced);
    const punch = clickPunchScale(punchStart, state.clock.elapsedTime, isActive);
    if (groupRef.current) {
      const bob = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.7 + bobSeed) * 0.08 * intro;
      const start = position.clone().add(new THREE.Vector3(0, -5, 0));
      groupRef.current.position.lerpVectors(start, position, intro).add(new THREE.Vector3(0, bob, 0));
      const hoverScale = isHovered ? 1.12 : 1;
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, intro) * punch * hoverScale * categoryScale);
    }
    if (spinRef.current && !reduced) {
      // Minimal static rotation for evaluating the form, not Phase 3
      // ambient motion — slow enough that it reads as "settled," not
      // spinning.
      spinRef.current.rotation.y += delta * spinSpeed;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <ConstellationLine targetPosition={position} color={color} opacity={isHovered || isActive ? 0.65 : 0.3} />
      <pointLight
        color={color}
        intensity={(isHovered ? 1.6 : 0) + (isActive ? 1.0 : 0)}
        distance={2.2}
        position={[0.3, 0.25, 0.8]}
      />
      <group ref={spinRef} onPointerEnter={(e) => { e.stopPropagation(); onHoverChange(true); }} onPointerLeave={(e) => { e.stopPropagation(); onHoverChange(false); }}>
        {category.id === "roots" ? <PetalLens color={color} theme={theme} highlighted={isHovered || isActive} /> : null}
        {category.id === "experience" ? <ColumnLens color={color} theme={theme} highlighted={isHovered || isActive} /> : null}
        {category.id === "projects" ? <FrameLens color={color} theme={theme} highlighted={isHovered || isActive} /> : null}
        {category.id === "community" ? <ClusterLens color={color} theme={theme} highlighted={isHovered || isActive} /> : null}
      </group>
    </group>
  );
}

function useDisposable<T extends { dispose: () => void }>(value: T) {
  useEffect(() => () => value.dispose(), [value]);
  return value;
}

/** A small solid, softly emissive sphere — the "internal emissive core"
 * shared by Practice/Community, anchoring the glass shells around it so
 * they never read as hollow/empty. */
function LensCore({ color, radius = 0.11 }: { color: string; radius?: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 14, 14]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.42} roughness={0.4} />
    </mesh>
  );
}

/** Practice — two overlapping petal shells around a suspended core. Kept
 * from Glass's own exploration; Phase 2C only deepened the layering (a real
 * Z offset between the two shells and the core, not just an in-plane
 * rotation) since review found it collapsing toward "a flat eye icon" when
 * both shells sat in nearly the same plane. */
function PetalLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const geo = useDisposable(useMemo(() => petalGeometry(0.6, 0.29, 0.045), []));
  const backColor = useMemo(() => darken(color, 0.32), [color]);
  const opacity = highlighted ? 0.5 : 0.4;
  return (
    <group scale={1.05}>
      <group position={[0, 0, 0.1]}>
        <LensCore color={color} radius={0.13} />
      </group>
      <group rotation={[0.12, 0.18, 0]} position={[0, 0, 0.05]}>
        <GlassShell geometry={geo} frontColor={color} backColor={backColor} opacity={opacity} />
      </group>
      <group rotation={[-0.22, -0.4, 2.15]} position={[0, 0, -0.09]} scale={0.82}>
        <GlassShell geometry={geo} frontColor={color} backColor={backColor} opacity={opacity} />
      </group>
      <SatelliteRim color={color} theme={theme} radius={0.32} />
    </group>
  );
}

/** Experience — rebuilt from a flat pleated plate (which read as a bow —
 * a thin 2D shape lying mostly in one plane) into a vertical stack of six
 * lens-shaped glass segments threaded on a continuous luminous spine. The
 * spine replaces the old separate floating core: it *is* the "internal
 * core integrated into the column" the brief asked for, not a ball pasted
 * between two wings. Segments taper at both ends and alternate a slight
 * rotation for rhythm, and the whole stack leans along a shared diagonal
 * axis rather than standing perfectly vertical — "accumulated," not a
 * literal drawn column. */
function ColumnLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const lensGeo = useDisposable(useMemo(() => new THREE.SphereGeometry(0.24, 16, 16), []));
  const spineGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.02, 0.02, 1.3, 8), []));
  const backColor = useMemo(() => darken(color, 0.32), [color]);
  const opacity = highlighted ? 0.52 : 0.42;
  const segmentCount = 6;
  const segments = useMemo(
    () =>
      Array.from({ length: segmentCount }, (_, i) => {
        const t = i / (segmentCount - 1);
        const y = (t - 0.5) * 1.05;
        const x = (t - 0.5) * 0.3;
        const rot = (i % 2 === 0 ? 1 : -1) * 0.2 + i * 0.06;
        const size = 0.62 + Math.sin(t * Math.PI) * 0.4;
        return { x, y, rot, size };
      }),
    []
  );
  return (
    <group rotation={[0.05, 0.32, 0.14]}>
      <mesh geometry={spineGeo} rotation={[0, 0, 0.24]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.4} transparent opacity={0.72} />
      </mesh>
      {segments.map((s, i) => (
        <group key={i} position={[s.x, s.y, 0]} rotation={[0.16, 0, s.rot]} scale={[s.size, s.size * 0.4, s.size]}>
          <GlassShell geometry={lensGeo} frontColor={color} backColor={backColor} opacity={opacity} />
        </group>
      ))}
      <SatelliteRim color={color} theme={theme} radius={0.55} />
    </group>
  );
}

/** Work — rebuilt from a solid two-pass shell (which read as "a gold
 * cylinder" — the nested core was fully hidden behind it) into an open hex
 * frame: six struts plus top/bottom hex rings, all sharing one frame
 * material, wrapped around an inner hex-prism core rotated 30° out of
 * phase with the frame. The offset rotation is what actually reads as
 * "nested," not just "smaller" — an aligned inner/outer hex would look like
 * one shape from most angles. */
function FrameLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const hexRadius = 0.32;
  const strutHeight = 0.46;
  const strutGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.014, 0.014, strutHeight, 6), [strutHeight]));
  const ringGeo = useDisposable(useMemo(() => new THREE.TorusGeometry(hexRadius, 0.013, 6, 6), [hexRadius]));
  const innerGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.15, 0.13, 0.36, 6, 1), []));
  const frameColor = useMemo(() => lighten(color, 0.22), [color]);
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: frameColor,
        transparent: true,
        opacity: highlighted ? 0.62 : 0.48,
        roughness: 0.22,
        clearcoat: 0.55,
        clearcoatRoughness: 0.2,
      }),
    [frameColor, highlighted]
  );
  useEffect(() => () => frameMaterial.dispose(), [frameMaterial]);
  const struts = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return { x: Math.cos(a) * hexRadius, z: Math.sin(a) * hexRadius };
      }),
    [hexRadius]
  );
  return (
    <group rotation={[0.2, 0.5, 0.06]}>
      <mesh geometry={innerGeo} rotation={[0, Math.PI / 6, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.3} />
      </mesh>
      <mesh geometry={ringGeo} material={frameMaterial} position={[0, strutHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={ringGeo} material={frameMaterial} position={[0, -strutHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} />
      {struts.map((s, i) => (
        <mesh key={i} geometry={strutGeo} material={frameMaterial} position={[s.x, 0, s.z]} />
      ))}
      <SatelliteRim color={color} theme={theme} radius={0.38} />
    </group>
  );
}

/** Community — a shared ring with orbiting glass lenses, kept from Glass's
 * own exploration (already a literal "shared lens system / linked orbital
 * structure"). Phase 2C enlarged the central lens and the ring, spaced the
 * three companions further apart with slightly varied scale, added thin
 * connecting rails so the relationship reads at a glance, and tilted the
 * ring off pure edge-on so it can't flatten into a line at rest. */
const CLUSTER_NODE_SCALES = [1, 0.78, 1.18] as const;

function ClusterLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const orbitRadius = 0.56;
  const nodeGeo = useDisposable(useMemo(() => new THREE.SphereGeometry(0.15, 18, 18), []));
  const backColor = useMemo(() => darken(color, 0.32), [color]);
  const opacity = highlighted ? 0.55 : 0.44;
  const nodeCount = CLUSTER_NODE_SCALES.length;
  const nodes = useMemo(
    () =>
      Array.from({ length: nodeCount }, (_, i) => {
        const a = (i / nodeCount) * Math.PI * 2 + 0.3;
        return { x: Math.cos(a) * orbitRadius, z: Math.sin(a) * orbitRadius, a, scale: CLUSTER_NODE_SCALES[i] };
      }),
    [orbitRadius, nodeCount]
  );
  return (
    <group rotation={[0.1, 0.25, 0.08]}>
      <LensCore color={color} radius={0.2} />
      <mesh rotation={[Math.PI / 2.6, 0.1, 0]}>
        <torusGeometry args={[orbitRadius, 0.02, 8, 44]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} roughness={0.3} />
      </mesh>
      {nodes.map((n, i) => (
        <group key={`rail-${i}`} rotation={[0, n.a, 0]}>
          <mesh position={[orbitRadius / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.007, 0.007, orbitRadius * 0.82, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.32} />
          </mesh>
        </group>
      ))}
      {nodes.map((n, i) => (
        <group key={i} position={[n.x, 0, n.z]} scale={n.scale}>
          <GlassShell geometry={nodeGeo} frontColor={color} backColor={backColor} opacity={opacity} />
        </group>
      ))}
      <SatelliteRim color={color} theme={theme} radius={0.62} />
    </group>
  );
}

/** Restrained rim lighting — dark mode only. Additive blending washes out
 * to a flat white disc against the light theme's pale background (verified
 * during the Phase 2B exploration), and the fix there was to drop it
 * entirely for light mode rather than retune it; light mode's edge
 * definition comes from GlassShell's own front/back tint contrast instead
 * — Phase 2C made that contrast real (darken(color, 0.32) for every
 * satellite's back pass, not the same color as the front). */
export function SatelliteRim({ color, theme, radius = 0.24 }: { color: string; theme: ThemeMorphState; radius?: number }) {
  if (theme !== "dark") return null;
  return <RimGlow color={color} radius={radius} power={2.6} glowIntensity={0.4} />;
}
