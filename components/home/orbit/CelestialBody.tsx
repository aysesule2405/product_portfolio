import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RimGlow, useCraterTerrainTextures } from "./procedural";
import {
  Corona,
  RippleShell,
  injectReactiveDisplacement,
  updateReactiveDisplacement,
  SIMPLEX_NOISE_GLSL,
  type ReactiveShaderHandle,
} from "./glass";
import { entranceProgress, type FadeRef } from "./motion-utils";
import { CENTERPIECE_RADIUS, CENTERPIECE_TONE } from "./config";

// Equivalent settle feel to the previous fixed 0.04-per-frame lerp at 60fps,
// but frame-rate-independent — see CameraRig's identical CAMERA_DAMP_LAMBDA
// for the derivation.
const TILT_DAMP_LAMBDA = 2.5;

/**
 * The scene's one centerpiece — Glass Instruments' material language (a
 * small emissive core wrapped in a nested translucent shell) built around a
 * real spherical moon/sun. Phase 2C thinned and softened the outer shell
 * (Phase 2B's version read as "a thick blue ring/porthole" rather than an
 * optical layer around the moon), gave the moon a fill light so its
 * terminator shadow no longer crushes to pure black, and gave the sun a
 * multi-frequency shader pass plus an off-axis hotspot so it reads as a
 * dimensional sphere rather than a flat gradient disc.
 *
 * Phase 3 replaced the old `theme === "dark"` branch (two mutually exclusive
 * JSX subtrees) with both subtrees always mounted side by side, crossfaded
 * by `morphRef` (see useThemeMorph) — a live theme toggle needs to animate
 * every layer together rather than pop from one static tree to the other,
 * and "avoid unmounting or recreating the scene" ruled out conditional
 * rendering outright. Each subtree drives its own children's opacity via a
 * small FadeRef (moonFadeRef/sunFadeRef) rather than each layer reading
 * `morphRef` directly, so nothing but this component needs to know which
 * value maps to which theme. Once a fade reaches exactly 0 its whole group
 * is set `.visible = false`, so steady state (no transition in progress)
 * still only draws one subtree — the Phase 2C.1 draw-call baseline holds
 * except during the ~800ms transition window itself.
 */
export function CelestialBody({
  reduced,
  morphRef,
  craterTextureWidth = 1024,
}: {
  reduced: boolean;
  morphRef: FadeRef;
  /** Passed down from HeroOrbitScene's quality tier — see CRATER_TEXTURE_WIDTH
   * in quality.ts. Defaults to the previous fixed value so this component
   * still works if ever rendered without a quality-tier owner. */
  craterTextureWidth?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const moonGroupRef = useRef<THREE.Group>(null);
  const sunGroupRef = useRef<THREE.Group>(null);
  const moonSurfaceRef = useRef<THREE.Mesh>(null);
  const sunSurfaceRef = useRef<THREE.Mesh>(null);
  const moonCoreRef = useRef<THREE.Mesh>(null);
  const sunCoreRef = useRef<THREE.Mesh>(null);
  const moonFadeRef = useRef(1);
  const sunFadeRef = useRef(0);
  // 0 at rest, peaking at the transition's midpoint — drives RippleShell's
  // extra morph-distortion term (see glass.tsx) so the crossfade itself
  // reads as the shell convulsing through a transformation, not just fading
  // opacity while a separate ripple idles underneath.
  const morphBoostRef = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  const introStart = useRef<number | null>(null);
  const radius = CENTERPIECE_RADIUS;
  // Populated once, asynchronously, the first time the moon's surface
  // material actually compiles (see injectReactiveDisplacement in
  // glass.tsx) — never read during render, only inside useFrame below. The
  // sun doesn't need this: its surface is already a fully custom shader
  // (SUN_VERTEX/SUN_FRAGMENT below), so displacement is added directly
  // there instead of grafted on via onBeforeCompile.
  const moonShaderRef = useRef<ReactiveShaderHandle | null>(null);

  // Always enabled now — both the moon and sun subtrees stay mounted
  // regardless of the live morph value, so the crater texture is always
  // needed, not just when theme === "dark".
  const { colorTexture, normalTexture } = useCraterTerrainTextures(
    CENTERPIECE_TONE.dark.body,
    true,
    "centerpiece-moon",
    craterTextureWidth
  );

  const surfaceGeometry = useMemo(() => new THREE.SphereGeometry(radius, 64, 64), [radius]);
  useEffect(() => () => surfaceGeometry.dispose(), [surfaceGeometry]);
  const coreGeometry = useMemo(() => new THREE.SphereGeometry(radius * 0.6, 32, 32), [radius]);
  useEffect(() => () => coreGeometry.dispose(), [coreGeometry]);

  const moonSurfaceMaterial = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      map: colorTexture,
      normalMap: normalTexture,
      normalScale: new THREE.Vector2(0.85, 0.85),
      roughness: 0.64,
      metalness: 0.04,
      // Reduced from 0.35/0.3 (Phase 2B) — the clearcoat highlight was
      // large and smooth enough to wash out maria detail underneath it.
      clearcoat: 0.2,
      clearcoatRoughness: 0.5,
      // A low emissive floor, not scene lighting — keeps the shadow side
      // of the terminator from crushing to pure black regardless of
      // camera/light angle, without brightening the lit side (which stays
      // ~10x stronger from the key light and would swamp anything this
      // subtle).
      emissive: CENTERPIECE_TONE.dark.core,
      emissiveIntensity: 0.05,
      transparent: true,
      // The sun's surface mesh now shares this exact sphere geometry at
      // the same transform during the crossfade — two coincident opaque-
      // depth writers z-fight against each other. Disabling depth writes
      // here avoids that; the small solid core sphere still anchors
      // correct occlusion for anything genuinely behind the centerpiece.
      depthWrite: false,
      opacity: 0.95,
    });
    // Grafted on right after construction, before this material is ever
    // handed to three.js for compilation — see injectReactiveDisplacement's
    // doc comment in glass.tsx. Heavy, by design: "go with direction 1
    // heavily... re-model the 3D objects to be morphing upon interaction."
    // The crater surface itself now genuinely deforms toward the cursor, not
    // just the glass coating around it — a much bigger, more obvious bulge
    // than the shell's own (radius * 0.11), since this is the object the
    // whole redo is about.
    // The linter can't see that three.js invokes onBeforeCompile
    // asynchronously (at first actual GPU compile, inside the render loop,
    // never synchronously here) — this ref write never happens during this
    // render.
    // eslint-disable-next-line react-hooks/refs
    injectReactiveDisplacement(material, radius * 0.12, radius * 0.32, (shader) => {
      moonShaderRef.current = shader;
    });
    return material;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorTexture, normalTexture]);
  useEffect(() => () => moonSurfaceMaterial.dispose(), [moonSurfaceMaterial]);

  const moonCoreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: CENTERPIECE_TONE.dark.core,
        emissive: CENTERPIECE_TONE.dark.core,
        emissiveIntensity: 0.4,
        roughness: 0.4,
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => moonCoreMaterial.dispose(), [moonCoreMaterial]);

  const sunCoreMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: CENTERPIECE_TONE.light.core,
        emissive: CENTERPIECE_TONE.light.mid,
        emissiveIntensity: 0.6,
        roughness: 0.35,
        transparent: true,
        depthWrite: false,
      }),
    []
  );
  useEffect(() => () => sunCoreMaterial.dispose(), [sunCoreMaterial]);

  const sunUniforms = useMemo(
    () => ({
      core: { value: new THREE.Color(CENTERPIECE_TONE.light.core) },
      mid: { value: new THREE.Color(CENTERPIECE_TONE.light.mid) },
      edge: { value: new THREE.Color(CENTERPIECE_TONE.light.edge) },
      hotspot: { value: new THREE.Color(CENTERPIECE_TONE.light.hotspot) },
      opacity: { value: 0 },
      // Same displacement amplitude as the moon's — already a fully custom
      // shader, so no onBeforeCompile graft needed here, just the same
      // ambient-ripple + cursor-bulge terms added directly to SUN_VERTEX
      // below.
      uTime: { value: 0 },
      uPointerDir: { value: new THREE.Vector3(0, 0, 1) },
      uAmbientAmount: { value: radius * 0.12 },
      uBulgeAmount: { value: radius * 0.32 },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useFrame((state, delta) => {
    if (!reduced) {
      // Minimal static rotation, per Phase 2B/2C scope — enough to evaluate
      // the craters/gradient from more than one angle, not ambient Phase 3
      // motion. Both surfaces accumulate the identical delta from the same
      // starting rotation, so they stay visually in sync through a crossfade
      // instead of drifting apart.
      if (moonSurfaceRef.current) moonSurfaceRef.current.rotation.y += delta * 0.045;
      if (sunSurfaceRef.current) sunSurfaceRef.current.rotation.y += delta * 0.045;
    }
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    if (!reduced) {
      updateReactiveDisplacement(moonShaderRef.current, state.clock.elapsedTime, pointer.current.x, pointer.current.y);
    }
    if (groupRef.current) {
      const targetX = reduced ? 0 : pointer.current.y * 0.14;
      const targetY = reduced ? 0 : pointer.current.x * 0.18;
      // Frame-rate-independent damping (see CameraRig's identical fix) rather
      // than a fixed per-frame lerp factor, which would settle roughly twice
      // as fast in wall-clock time on a 120Hz display as on 60Hz.
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetX, TILT_DAMP_LAMBDA, delta);
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetY, TILT_DAMP_LAMBDA, delta);
      const intro = entranceProgress(introStart, state.clock.elapsedTime, 0, 1.8, reduced);
      groupRef.current.position.y = THREE.MathUtils.lerp(-4.5, 0, intro);
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.45, 1, intro));
    }

    const morph = morphRef.current;
    const moonFade = 1 - morph;
    const sunFade = morph;
    moonFadeRef.current = moonFade;
    sunFadeRef.current = sunFade;
    // A parabola in morph — 0 at either settled end (morph=0 or 1), peaking
    // at exactly 1 halfway through the crossfade (morph=0.5) — rather than
    // just tracking "is a transition in progress" as a flat boolean, so the
    // extra distortion ramps in and back out smoothly with the transition
    // itself instead of snapping on and off.
    morphBoostRef.current = 4 * morph * (1 - morph);
    // Mutated only through these mesh refs, never through the memoized
    // moonSurfaceMaterial/moonCoreMaterial/sunCoreMaterial/sunUniforms
    // variables directly — the project's react-hooks/immutability rule
    // treats a useMemo's return value as frozen once rendered. Each ref's
    // `.current.material` is the live THREE.js instance the renderer
    // created from the JSX below (the same object useMemo produced), so
    // this is the same ref-mutation pattern as groupRef.current.position.
    if (moonSurfaceRef.current) (moonSurfaceRef.current.material as THREE.MeshPhysicalMaterial).opacity = 0.95 * moonFade;
    if (moonCoreRef.current) (moonCoreRef.current.material as THREE.MeshStandardMaterial).opacity = moonFade;
    if (sunCoreRef.current) (sunCoreRef.current.material as THREE.MeshStandardMaterial).opacity = sunFade;
    if (sunSurfaceRef.current) {
      const sunMaterial = sunSurfaceRef.current.material as THREE.ShaderMaterial;
      sunMaterial.uniforms.opacity.value = sunFade;
      if (!reduced) {
        sunMaterial.uniforms.uTime.value = state.clock.elapsedTime;
        (sunMaterial.uniforms.uPointerDir.value as THREE.Vector3).set(pointer.current.x, pointer.current.y, 0.6).normalize();
      }
    }
    if (moonGroupRef.current) moonGroupRef.current.visible = moonFade > 0.001;
    if (sunGroupRef.current) sunGroupRef.current.visible = sunFade > 0.001;
    if (moonSurfaceRef.current) moonSurfaceRef.current.visible = moonFade > 0.001;
    if (sunSurfaceRef.current) sunSurfaceRef.current.visible = sunFade > 0.001;
  });

  return (
    <group ref={groupRef}>
      <group ref={moonGroupRef}>
        <Corona color={CENTERPIECE_TONE.dark.rim} radius={radius * 1.7} opacity={0.13} fadeRef={moonFadeRef} />
        {/* Inner core: the "cool internal glass layer" beneath the tactile
            crater surface — visible as a faint cool glow through the
            surface material's own slight translucency (opacity 0.95, not
            1), not meant to be a distinct visible shape on its own. */}
        <mesh ref={moonCoreRef} geometry={coreGeometry} material={moonCoreMaterial} />
        <mesh ref={moonSurfaceRef} geometry={surfaceGeometry} material={moonSurfaceMaterial} />
        {/* Phase 2C's uniform-opacity shell read as "a visible blue ring"
            regardless of viewing angle — a flat-opacity shell can't help but
            trace an even circumference. This view-dependent shell instead
            rises only near the true grazing edge and dims on the side
            facing away from the key light, so it reads as a coating that
            reveals itself on inspection rather than a frame that's always
            fully visible. Its surface now also ripples continuously and
            bulges toward the cursor (RippleShell, glass.tsx) — the direct
            response to "not eye-catching, not interactive" feedback on the
            whole scene. */}
        <RippleShell
          radius={radius * 1.03}
          color={CENTERPIECE_TONE.dark.shellFront}
          highlightColor={CENTERPIECE_TONE.dark.rim}
          opacity={0.24}
          fadeRef={moonFadeRef}
          morphBoostRef={morphBoostRef}
          reduced={reduced}
        />
        <RimGlow color={CENTERPIECE_TONE.dark.rim} radius={radius} power={3.6} glowIntensity={0.22} fadeRef={moonFadeRef} />
      </group>

      <group ref={sunGroupRef}>
        <Corona color={CENTERPIECE_TONE.light.edge} radius={radius * 1.75} opacity={0.1} irregular seed="sun-corona" fadeRef={sunFadeRef} />
        <Corona color={CENTERPIECE_TONE.light.core} radius={radius * 1.22} opacity={0.16} fadeRef={sunFadeRef} />
        <mesh ref={sunCoreRef} geometry={coreGeometry} material={sunCoreMaterial} />
        <mesh ref={sunSurfaceRef} geometry={surfaceGeometry}>
          <shaderMaterial uniforms={sunUniforms} vertexShader={SUN_VERTEX} fragmentShader={SUN_FRAGMENT} transparent depthWrite={false} />
        </mesh>
        {/* Same reactive RippleShell as the moon, themed with the sun's own
            tone — sharing one mechanism rather than the moon alone feeling
            upgraded when the theme toggles. Previously a two-pass GlassShell
            (front+back tint); this is a single custom-shader pass, so the
            sun's subtree also loses a draw call in the swap. */}
        <RippleShell
          radius={radius * 1.045}
          color={CENTERPIECE_TONE.light.shellFront}
          highlightColor={CENTERPIECE_TONE.light.hotspot}
          opacity={0.22}
          fadeRef={sunFadeRef}
          morphBoostRef={morphBoostRef}
          reduced={reduced}
        />
      </group>
    </group>
  );
}

const SUN_VERTEX = `
  uniform float uTime;
  uniform vec3 uPointerDir;
  uniform float uAmbientAmount;
  uniform float uBulgeAmount;
  varying vec3 vViewNormal;
  varying vec3 vObjectNormal;
  varying vec3 vViewDir;

  ${SIMPLEX_NOISE_GLSL}

  void main() {
    // Deliberately NOT multiplied by any matrix — this stays in the mesh's
    // own local space, so the hotspot/grain below are painted onto the
    // sphere's surface and rotate together with it (see meshRef's rotation
    // in useFrame), unlike vViewNormal which is used for the view-facing
    // gradient and should NOT rotate with the mesh. The same local normal
    // also drives displacement below, for the same reason: the bulge should
    // stay fixed on the sun's own rotating surface, not slide around in
    // view space.
    vObjectNormal = normalize(normal);

    float ambientDisp = snoise(vObjectNormal * 2.1 + vec3(0.0, 0.0, uTime * 0.1)) * uAmbientAmount;
    float bulgeDisp = pow(max(dot(vObjectNormal, uPointerDir), 0.0), 3.0) * uBulgeAmount;
    vec3 displacedPosition = position + vObjectNormal * (ambientDisp + bulgeDisp);

    vViewNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(displacedPosition, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

// Three-stop gradient (core -> mid -> edge) rather than a single lerp, so
// the sun keeps visible tonal definition across its whole visible disc
// instead of flattening into two flat bands. Layered with a fixed off-axis
// "hotspot" (brighter patch not centered on the sphere) and two octaves of
// coarse/fine surface grain — together these are what keep the surface
// from reading as a flat gradient disc at normal viewing distance.
const SUN_FRAGMENT = `
  uniform vec3 core;
  uniform vec3 mid;
  uniform vec3 edge;
  uniform vec3 hotspot;
  uniform float opacity;
  varying vec3 vViewNormal;
  varying vec3 vObjectNormal;
  varying vec3 vViewDir;

  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }

  // Smooth (trilinearly-interpolated) value noise — a first attempt used
  // hash(floor(p)) directly, which quantizes the sphere's normal onto a
  // hard lattice and reads as a visible checkerboard/graph-paper grid
  // rather than organic grain. Interpolating between the 8 lattice corners
  // with a smoothstep curve removes the hard edges between cells.
  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i + vec3(0.0, 0.0, 0.0));
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    return mix(nxy0, nxy1, f.z);
  }

  void main() {
    float facing = max(dot(normalize(vViewNormal), normalize(vViewDir)), 0.0);
    float t = pow(1.0 - facing, 1.7);
    vec3 base = t < 0.5 ? mix(core, mid, t * 2.0) : mix(mid, edge, (t - 0.5) * 2.0);

    vec3 n = normalize(vObjectNormal);
    vec3 hotspotDir = normalize(vec3(0.4, 0.5, 0.6));
    float spot = pow(max(dot(n, hotspotDir), 0.0), 5.0);
    base = mix(base, hotspot, spot * 0.55);

    // Two octaves — a slow, broad "cellular" swell and a finer granular
    // layer — rather than one frequency, which reads flatter and more
    // uniform than real granular/cellular surface variation.
    float grainCoarse = (noise3(n * 6.0) - 0.5) * 0.06;
    float grainFine = (noise3(n * 22.0) - 0.5) * 0.045;
    base += grainCoarse + grainFine;

    gl_FragColor = vec4(base, opacity);
  }
`;
