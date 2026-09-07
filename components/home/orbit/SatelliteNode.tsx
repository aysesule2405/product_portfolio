import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FieldMapCategory } from "@/lib/data/field-map-categories";
import { darken, lighten } from "./procedural";
import { InstancedGlassShell, petalGeometry, type InstanceTransform } from "./glass";
import { entranceProgress, clickPunchScale } from "./motion-utils";
import { ConstellationLine } from "./ConstellationLine";
import { SATELLITE_SCALE } from "./config";
import type { ThemeMorphState } from "./useThemeMorph";

/**
 * One of the four category forms, in the Glass Instruments material
 * language throughout. Phase 2C.1 is a bounded correction on top of Phase
 * 2C, not another redesign: Experience and Work keep their concepts
 * (a graduated accumulated stack; a nested engineered frame) but were
 * rebuilt after review found the results reading as "an abacus" and "a
 * cage around a cylinder" rather than optical instruments. Community and
 * Practice keep their Phase 2C forms with targeted fixes — Community's
 * RimGlow had grown large enough (to match its Phase 2C size increase) to
 * read as its own "circular backdrop," the exact halo problem solved once
 * already for the centerpiece back in the Phase 2B exploration and
 * apparently not re-checked here when satellite radii grew.
 *
 *   Practice   -> petal shells (unchanged concept — more depth separation)
 *   Experience -> graduated lens stack on a segmented spine (rebuilt)
 *   Work       -> open hex frame, fewer struts, offset faceted core (rebuilt)
 *   Community  -> ring + orbiting lens cluster (unchanged concept — shrunk
 *                 rim glow, instanced companions/rails)
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

/** Light mode's shells read as "opaque and plastic" at their Phase 2C
 * opacity values — this scales every satellite's base opacity down a bit
 * further specifically in light mode, on top of the darker back-face tint
 * and softer clearcoat already applied globally in GlassShell. */
function shellOpacity(theme: ThemeMorphState, highlighted: boolean, base: number, highlightBoost: number) {
  const value = highlighted ? base + highlightBoost : base;
  return theme === "light" ? value * 0.8 : value;
}

/** Builds a from->to instance transform (position, quaternion, y-scale) for
 * a unit-height cylinder so it exactly spans two points — used for the
 * segmented spine, the frame struts/connector, and the cluster rails.
 * Deliberately uses setFromUnitVectors rather than manual axis-angle
 * composition: the latter is easy to get a sign convention wrong on (a real
 * bug caught while building this — a hand-composed rail rotation pointed
 * opposite the actual companion position). */
function spanTransform(from: THREE.Vector3, to: THREE.Vector3) {
  const dir = new THREE.Vector3().subVectors(to, from);
  const length = dir.length();
  const position = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  return { position, quaternion, length };
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

/** Practice — two overlapping petal shells around a suspended core.
 * Phase 2C.1's first pass only offset the two shells in Z (depth) — a
 * screenshot check showed that reads as one solid leaf, not two separated
 * layers, since a pure depth offset barely changes the projected silhouette
 * at this camera distance. This adds a real X/Y offset between the two so
 * they're visibly apart on screen, not just at different depths, and lowers
 * opacity further so overlap reads as translucent layering rather than one
 * opaque shape. */
function PetalLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const geo = useDisposable(useMemo(() => petalGeometry(0.6, 0.29, 0.045), []));
  const backColor = useMemo(() => darken(color, 0.32), [color]);
  const opacity = shellOpacity(theme, highlighted, 0.32, 0.1);
  const transforms = useMemo<InstanceTransform[]>(
    () => [
      { position: new THREE.Vector3(0.04, 0.05, 0.09), rotation: new THREE.Euler(0.14, 0.2, 0) },
      { position: new THREE.Vector3(-0.09, -0.08, -0.16), rotation: new THREE.Euler(-0.3, -0.5, 2.15), scale: 0.8 },
    ],
    []
  );
  return (
    <group scale={1.05}>
      <group position={[0, 0, 0.13]}>
        <LensCore color={color} radius={0.13} />
      </group>
      <InstancedGlassShell geometry={geo} frontColor={color} backColor={backColor} opacity={opacity} transforms={transforms} />
      {/* No SatelliteRim: getting it to peek out past LensCore's edge
          without exposing the shell's unoccluded far side (see the
          root-cause note on SatelliteRim below) needs a margin thin enough
          that it stopped being worth the extra draw call — GlassShell's own
          clearcoat/fresnel response already carries edge definition. */}
    </group>
  );
}

const COLUMN_SEGMENT_COUNT = 6;

/** Six segment centers along a gentle, monotonic ascending arc (a quadratic
 * curve, not a straight line and not a symmetric bow), with progressively
 * growing scale and a steady rotational twist rather than Phase 2C's
 * alternating +/- rotation — the alternation was a big part of why it read
 * as a mechanically-repeated abacus rather than a calibrated progression.
 * The spine is built from the same centers as short segments rather than
 * one long rod, so it starts and ends exactly at the first/last lens
 * instead of visibly overshooting either end. */
function useColumnLayout() {
  return useMemo(() => {
    const centers: THREE.Vector3[] = [];
    const lensTransforms: InstanceTransform[] = [];
    for (let i = 0; i < COLUMN_SEGMENT_COUNT; i++) {
      const t = i / (COLUMN_SEGMENT_COUNT - 1);
      const y = (t - 0.5) * 1.0;
      const x = t * t * 0.26; // monotonic accelerating arc, not a symmetric bow
      const s = 0.48 + t * 0.58; // graduated growth: 0.48 -> 1.06
      const flatten = 0.3 + t * 0.14; // graduated lens proportion, not identical discs
      const rot = 0.08 + i * 0.17; // steady progression, not alternating
      const position = new THREE.Vector3(x, y, 0);
      centers.push(position);
      lensTransforms.push({
        position,
        rotation: new THREE.Euler(0.16, 0, rot),
        scale: new THREE.Vector3(s, s * flatten, s),
      });
    }
    const spineTransforms = centers.slice(0, -1).map((p0, i) => spanTransform(p0, centers[i + 1]));
    return { lensTransforms, spineTransforms };
  }, []);
}

/** Experience — rebuilt after review: Phase 2C's evenly-spaced, identically-
 * sized, alternating-rotation discs on a straight overshooting rod read as
 * "an abacus" or "a kebab skewer." This keeps the six-lens-on-a-spine
 * concept but makes every parameter a genuine progression (size, lens
 * proportion, rotation, position along a curved path) and rebuilds the
 * spine as segments between lens centers instead of one straight overhang. */
function ColumnLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const { lensTransforms, spineTransforms } = useColumnLayout();
  const lensGeo = useDisposable(useMemo(() => new THREE.SphereGeometry(0.24, 16, 16), []));
  const spineGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.019, 0.019, 1, 8), []));
  const backColor = useMemo(() => darken(color, 0.32), [color]);
  const opacity = shellOpacity(theme, highlighted, 0.42, 0.1);

  const spineRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = spineRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    spineTransforms.forEach((s, i) => {
      matrix.compose(s.position, s.quaternion, new THREE.Vector3(1, s.length, 1));
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [spineTransforms]);

  return (
    <group rotation={[0.05, 0.32, 0.1]}>
      {/* The spine is the "internal core integrated into the column" —
          Phase 2C's separate floating LensCore read as "pasted between two
          wings"; a continuous glowing thread through every lens center
          replaces it rather than sitting alongside it. */}
      <instancedMesh ref={spineRef} args={[spineGeo, undefined, spineTransforms.length]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.55} roughness={0.4} transparent opacity={0.72} />
      </instancedMesh>
      <InstancedGlassShell geometry={lensGeo} frontColor={color} backColor={backColor} opacity={opacity} transforms={lensTransforms} />
      {/* No solid, depth-writing occluder runs the length of this stack (the
          spine is thin and the lenses are non-opaque glass shells with
          depthWrite disabled) — a rim shell here would show the same
          "unoccluded backside" field Work and Community hit below, just
          elongated. Left off rather than tuned to a radius that would only
          approximate correct at one point along the stack. */}
    </group>
  );
}

/** Work — rebuilt after review: Phase 2C's six-strut, two-ring cage around
 * a plain-shaded cylinder read as "a wire cage around a cylinder," not an
 * engineered instrument. Fewer struts (3, instanced into one draw call),
 * top and bottom rings at different radii (a tapered frustum, not a
 * uniform box), flat-shaded facets on the core so it reads as cut rather
 * than turned, a 30°Y rotation offset between core and frame, and one
 * deliberately asymmetric diagonal connector bracing a strut to the core —
 * a single "meaningful internal connector" rather than one more symmetric
 * structural member. */
function FrameLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const hexRadiusBottom = 0.32;
  const hexRadiusTop = 0.21;
  const strutHeight = 0.46;
  const strutCount = 3;

  const strutGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.016, 0.016, 1, 6), []));
  const topRingGeo = useDisposable(useMemo(() => new THREE.TorusGeometry(hexRadiusTop, 0.012, 6, 6), [hexRadiusTop]));
  const bottomRingGeo = useDisposable(useMemo(() => new THREE.TorusGeometry(hexRadiusBottom, 0.013, 6, 6), [hexRadiusBottom]));
  const innerGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.15, 0.13, 0.36, 6, 1), []));
  const connectorGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.008, 0.008, 1, 6), []));

  const frameColor = useMemo(() => lighten(color, 0.22), [color]);
  const frameMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: frameColor,
        transparent: true,
        opacity: (highlighted ? 0.6 : 0.46) * (theme === "light" ? 0.85 : 1),
        roughness: 0.26,
        clearcoat: 0.35,
        clearcoatRoughness: 0.35,
      }),
    [frameColor, highlighted, theme]
  );
  useEffect(() => () => frameMaterial.dispose(), [frameMaterial]);

  const strutAngles = useMemo(() => Array.from({ length: strutCount }, (_, i) => (i / strutCount) * Math.PI * 2), []);
  const strutTransforms = useMemo(
    () =>
      strutAngles.map((a) => {
        const bottom = new THREE.Vector3(Math.cos(a) * hexRadiusBottom, -strutHeight / 2, Math.sin(a) * hexRadiusBottom);
        const top = new THREE.Vector3(Math.cos(a) * hexRadiusTop, strutHeight / 2, Math.sin(a) * hexRadiusTop);
        return spanTransform(bottom, top);
      }),
    [strutAngles]
  );
  const strutRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = strutRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    strutTransforms.forEach((s, i) => {
      matrix.compose(s.position, s.quaternion, new THREE.Vector3(1, s.length, 1));
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [strutTransforms]);

  const connector = useMemo(() => {
    const from = new THREE.Vector3(Math.cos(strutAngles[0]) * hexRadiusTop, strutHeight / 2, Math.sin(strutAngles[0]) * hexRadiusTop);
    const to = new THREE.Vector3(0, 0.04, 0);
    return spanTransform(from, to);
  }, [strutAngles]);

  return (
    <group rotation={[0.2, 0.5, 0.06]}>
      <mesh geometry={innerGeo} rotation={[0, Math.PI / 6, 0]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.32} flatShading />
      </mesh>
      <instancedMesh ref={strutRef} args={[strutGeo, undefined, strutCount]} material={frameMaterial} />
      <mesh geometry={topRingGeo} material={frameMaterial} position={[0, strutHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={bottomRingGeo} material={frameMaterial} position={[0, -strutHeight / 2, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={connectorGeo} material={frameMaterial} position={connector.position} quaternion={connector.quaternion} scale={[1, connector.length, 1]} />
      {/* No SatelliteRim — the open frame's struts don't write depth (see
          the root-cause note on SatelliteRim below), so any rim radius
          large enough to peek past the core also exposed the shell's
          unoccluded far side as a small disc. The frame's own clearcoat and
          the core's flat-shaded facets already carry edge definition. */}
    </group>
  );
}

const CLUSTER_NODE_SCALES = [1, 0.78, 1.18] as const;

/** Community — ring + orbiting lens cluster, unchanged in concept. Phase
 * 2C.1's fix is narrower than it looks: the "large teal circular backdrop"
 * review flagged wasn't a separate background pass at all — it was
 * SatelliteRim's fresnel shell, sized to the Phase 2C cluster's full 0.62
 * radius. A fresnel shell's opacity depends only on viewing angle, not
 * size, so a *bigger* shell at a fixed camera distance shows more of its
 * surface within the visible-opacity range — the same mechanism the
 * centerpiece's halo hit during the Phase 2B exploration, just re-triggered
 * here by Community's Phase 2C size increase without re-checking the rim
 * radius against it. Shrunk to hug just the central lens instead. The three
 * companions and their rails are also now instanced (5 draws -> 2). */
function ClusterLens({ color, theme, highlighted }: { color: string; theme: ThemeMorphState; highlighted: boolean }) {
  const orbitRadius = 0.56;
  const nodeGeo = useDisposable(useMemo(() => new THREE.SphereGeometry(0.15, 18, 18), []));
  const railGeo = useDisposable(useMemo(() => new THREE.CylinderGeometry(0.007, 0.007, 1, 6), []));
  const backColor = useMemo(() => darken(color, 0.32), [color]);
  const opacity = shellOpacity(theme, highlighted, 0.44, 0.11);
  const nodeCount = CLUSTER_NODE_SCALES.length;

  const nodes = useMemo(
    () =>
      Array.from({ length: nodeCount }, (_, i) => {
        const a = (i / nodeCount) * Math.PI * 2 + 0.3;
        return { position: new THREE.Vector3(Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius), a, scale: CLUSTER_NODE_SCALES[i] };
      }),
    [orbitRadius, nodeCount]
  );
  const nodeTransforms = useMemo<InstanceTransform[]>(() => nodes.map((n) => ({ position: n.position, scale: n.scale })), [nodes]);

  const railRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const mesh = railRef.current;
    if (!mesh) return;
    const matrix = new THREE.Matrix4();
    nodes.forEach((n, i) => {
      // Rails run from just outside the core to just inside each companion
      // — "integrated into the system" rather than crossing through it
      // like an unrelated stick with no visible anchor at either end.
      const from = n.position.clone().multiplyScalar(0.12);
      const to = n.position.clone().multiplyScalar(0.88);
      const span = spanTransform(from, to);
      matrix.compose(span.position, span.quaternion, new THREE.Vector3(1, span.length, 1));
      mesh.setMatrixAt(i, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [nodes]);

  return (
    <group rotation={[0.1, 0.25, 0.08]}>
      <LensCore color={color} radius={0.2} />
      <mesh rotation={[Math.PI / 2.6, 0.1, 0]}>
        <torusGeometry args={[orbitRadius, 0.02, 8, 44]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} roughness={0.3} />
      </mesh>
      {/* Lit (not meshBasicMaterial) and lower-opacity than the rest of the
          form, so the rails visually respond to the same lighting as the
          glass shells around them instead of reading as flat unlit props. */}
      <instancedMesh ref={railRef} args={[railGeo, undefined, nodeCount]}>
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.18} transparent opacity={0.4} roughness={0.5} />
      </instancedMesh>
      <InstancedGlassShell geometry={nodeGeo} frontColor={color} backColor={backColor} opacity={opacity} transforms={nodeTransforms} />
      {/* No SatelliteRim — see the component doc comment above: this is
          the satellite whose Phase 2C.1 "hug the core instead of the whole
          cluster" fix (radius 0.62 -> 0.26) still left a small visible
          disc, and a margin thin enough to avoid that stopped being worth
          the draw call. The core's own emissive glow and the ring/rails
          already carry the cluster's presence. */}
    </group>
  );
}

/**
 * No satellite uses RimGlow (dark-mode rim lighting) as of Phase 2C.1 — the
 * centerpiece still does (see CelestialBody), because the moon/sun's own
 * surface is a single solid, depth-writing mesh that actually occludes the
 * fresnel shell the way the technique requires.
 *
 * The real root cause of the "large circular backdrop" bug review flagged
 * on Community (and, on closer inspection, Work and Practice too): RimGlow's
 * BackSide fresnel shell is *designed* to be almost entirely hidden behind a
 * solid, depth-writing object, with only the true silhouette edge peeking
 * out — that's what makes it read as a thin rim rather than a filled disc.
 * But every glass shell in this file sets `depthWrite: false` (required for
 * correct front/back transparency sorting), so it never occludes anything.
 * Sizing the rim radius to a satellite's whole *visual* footprint (Phase 2C)
 * left the entire "wrong side" of the fresnel shell exposed with nothing
 * solid behind it. Raising the shader's power exponent doesn't fix this
 * either — the far side of a BackSide sphere reads as fully-lit fresnel
 * (facing away from camera, its dot product clamps to zero) regardless of
 * exponent. Shrinking the radius to fit *inside* each satellite's own solid
 * core (LensCore, or Work's inner mesh) does work, but the margin left over
 * for an actual visible rim is thin enough, on these particular shapes, that
 * it stopped being worth a whole extra draw call per satellite — the glass
 * shells' own clearcoat/fresnel response already carries edge definition,
 * which is exactly what light mode has relied on for this all along.
 */
