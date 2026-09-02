import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FieldMapCategory } from "@/lib/data/field-map-categories";
import { RimGlow } from "./procedural";
import { GlassShell, petalGeometry, pleatedGeometry } from "./glass";
import { entranceProgress, clickPunchScale } from "./motion-utils";
import { ConstellationLine } from "./ConstellationLine";
import type { ThemeMorphState } from "./useThemeMorph";

/**
 * One of the four category forms, in the Glass Instruments material
 * language throughout (see GlassShell: two coincident transparent passes,
 * no real transmission) — but not the same silhouette repeated four times.
 * Two of the four silhouettes are the Phase 2B exploration's own Glass
 * forms (kept because they already read as "layered optical form" and
 * "shared lens system"); the other two are geometry borrowed from the
 * Crafted exploration and re-rendered in glass, because their silhouettes
 * were more legible than Glass's own attempt at those two categories:
 *
 *   Practice   -> petal shells (Glass's own — already "folded/layered")
 *   Experience -> pleated column (borrowed from Crafted's ceramic version)
 *   Work       -> nested hex-prism (borrowed from Crafted's hex prism,
 *                 given an inner core so it reads as "nested/engineered"
 *                 rather than a single solid)
 *   Community  -> ring + orbiting lens cluster (Glass's own)
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

  useFrame((state, delta) => {
    const intro = entranceProgress(introStart, state.clock.elapsedTime, 0.3 + index * 0.15, 1.1, reduced);
    const punch = clickPunchScale(punchStart, state.clock.elapsedTime, isActive);
    if (groupRef.current) {
      const bob = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.7 + bobSeed) * 0.08 * intro;
      const start = position.clone().add(new THREE.Vector3(0, -5, 0));
      groupRef.current.position.lerpVectors(start, position, intro).add(new THREE.Vector3(0, bob, 0));
      const hoverScale = isHovered ? 1.12 : 1;
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, intro) * punch * hoverScale);
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
        {category.id === "experience" ? <PleatedColumnLens color={color} theme={theme} highlighted={isHovered || isActive} /> : null}
        {category.id === "projects" ? <NestedHexLens color={color} theme={theme} highlighted={isHovered || isActive} /> : null}
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
 * shared by every satellite form, anchoring the glass shells around it so
 * they never read as hollow/empty. */
function LensCore({ color, radius = 0.11 }: { color: string; radius?: number }) {
  return (
    <mesh>
      <sphereGeometry args={[radius, 20, 20]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.42} roughness={0.4} />
    </mesh>
  );
}

/** Practice — two to three overlapping petal shells around a core, kept
 * from Glass's own exploration (it already read as "folded/layered optical
 * form" without needing Crafted's geometry). */
function PetalLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const geo = useDisposable(useMemo(() => petalGeometry(0.6, 0.29, 0.045), []));
  const opacity = highlighted ? 0.5 : 0.4;
  return (
    <group scale={1.05}>
      <LensCore color={color} />
      <group rotation={[0.1, 0, 0]}>
        <GlassShell geometry={geo} frontColor={color} backColor={color} opacity={opacity} />
      </group>
      <group rotation={[-0.15, 0, 2.1]} scale={0.8}>
        <GlassShell geometry={geo} frontColor={color} backColor={color} opacity={opacity} />
      </group>
      <SatelliteRim color={color} theme={theme} />
    </group>
  );
}

/** Experience — an accumulated stack of pleated glass plates. The pleated
 * profile is borrowed from the Crafted exploration's ceramic "Experience"
 * form; only the material changed (GlassShell instead of matte ceramic) —
 * the silhouette read as "accumulated vertical structure" regardless of
 * which material wrapped it, which is why it survived the direction pick
 * even though Crafted itself didn't. */
function PleatedColumnLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const geo = useDisposable(useMemo(() => pleatedGeometry(5, 0.46, 0.08, 0.08), []));
  const opacity = highlighted ? 0.52 : 0.42;
  return (
    <group rotation={[0.08, 0.35, 0]}>
      <LensCore color={color} />
      <GlassShell geometry={geo} frontColor={color} backColor={color} opacity={opacity} />
      <SatelliteRim color={color} theme={theme} />
    </group>
  );
}

/** Work — a hex-prism shell with a smaller hex-prism core nested directly
 * inside it, borrowed from Crafted's "engineered" hex prism but made
 * literally nested (an instrument within an instrument) so it earns the
 * "precise nested hex-prism" brief rather than just reusing Crafted's
 * single solid form. */
function NestedHexLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const outerGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.32, 0.29, 0.4, 6, 1), []));
  const innerGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.16, 0.14, 0.42, 6, 1), []));
  const opacity = highlighted ? 0.5 : 0.4;
  return (
    <group rotation={[0.2, 0.4, 0.05]}>
      <mesh geometry={innerGeo}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.35} roughness={0.35} />
      </mesh>
      <GlassShell geometry={outerGeo} frontColor={color} backColor={color} opacity={opacity} />
      <SatelliteRim color={color} theme={theme} />
    </group>
  );
}

/** Community — a shared ring with small glass "lens" satellites orbiting
 * it, kept from Glass's own exploration (already a literal "shared lens
 * system / linked orbital structure"). */
function ClusterLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const nodeGeo = useDisposable(useMemo(() => new THREE.SphereGeometry(0.12, 18, 18), []));
  const opacity = highlighted ? 0.5 : 0.4;
  const nodeCount = 3;
  const nodes = Array.from({ length: nodeCount }, (_, i) => {
    const a = (i / nodeCount) * Math.PI * 2;
    return { x: Math.cos(a) * 0.38, z: Math.sin(a) * 0.38 };
  });
  return (
    <group>
      <LensCore color={color} radius={0.14} />
      <mesh rotation={[Math.PI / 2.3, 0, 0]}>
        <torusGeometry args={[0.38, 0.013, 8, 40]} />
        <meshStandardMaterial color={color} transparent opacity={0.5} roughness={0.3} />
      </mesh>
      {nodes.map((n, i) => (
        <group key={i} position={[n.x, 0, n.z]}>
          <GlassShell geometry={nodeGeo} frontColor={color} backColor={color} opacity={opacity} />
        </group>
      ))}
      <SatelliteRim color={color} theme={theme} />
    </group>
  );
}

/** Restrained rim lighting — dark mode only. Additive blending washes out
 * to a flat white disc against the light theme's pale background (verified
 * during the Phase 2B exploration), and the fix there was to drop it
 * entirely for light mode rather than retune it; light mode's edge
 * definition comes from GlassShell's own front/back tint contrast instead.
 * Exported so each *Lens component above can opt in without duplicating
 * the theme check. */
export function SatelliteRim({ color, theme, radius = 0.24 }: { color: string; theme: ThemeMorphState; radius?: number }) {
  if (theme !== "dark") return null;
  return <RimGlow color={color} radius={radius} power={2.6} glowIntensity={0.4} />;
}
