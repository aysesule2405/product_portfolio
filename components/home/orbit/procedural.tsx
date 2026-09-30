import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FadeRef } from "./motion-utils";

export function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Lightens toward white by `amount` (0–1). */
export function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + (255 - r) * amount, g: g + (255 - g) * amount, b: b + (255 - b) * amount });
}

/** Darkens toward black by `amount` (0–1) — used for the per-facet color
 * jitter on the low-poly bodies (see faceColorAttribute). */
export function darken(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r * (1 - amount), g: g * (1 - amount), b: b * (1 - amount) });
}

const RIM_VERTEX_SHADER = `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const RIM_FRAGMENT_SHADER = `
  uniform vec3 color;
  uniform float power;
  uniform float glowIntensity;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    float fresnel = pow(1.0 - max(dot(normalize(vNormal), normalize(vViewDir)), 0.0), power);
    gl_FragColor = vec4(color, fresnel * glowIntensity);
  }
`;

/** A slightly-larger backside-only shell, lit only at grazing viewing angles
 * (a fresnel term) — restrained rim lighting on the object's own silhouette,
 * distinct from the flat camera-facing Glow sprite behind it. */
export function RimGlow({
  color,
  radius,
  power = 2.4,
  glowIntensity = 1.3,
  fadeRef,
}: {
  color: string;
  radius: number;
  power?: number;
  glowIntensity?: number;
  /** Optional per-frame multiplier (see FadeRef) — crossfades this rim with
   * the rest of its subtree during the theme morph. */
  fadeRef?: FadeRef;
}) {
  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(color) },
      power: { value: power },
      glowIntensity: { value: glowIntensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color]
  );
  // Mutated only through this ref, only inside useFrame below — see
  // MoonShell's identical pattern/note in glass.tsx.
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    if (materialRef.current && fadeRef) materialRef.current.uniforms.glowIntensity.value = glowIntensity * fadeRef.current;
  });

  return (
    <mesh scale={1.22}>
      <sphereGeometry args={[radius, 24, 24]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={RIM_VERTEX_SHADER}
        fragmentShader={RIM_FRAGMENT_SHADER}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

function useDustTexture() {
  return useMemo(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(0.4, "rgba(255,255,255,0.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function useDustLayout(seed: string, count: number) {
  return useMemo(() => {
    const rand = mulberry32(hashString(seed));
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (rand() - 0.5) * 17;
      positions[i * 3 + 1] = (rand() - 0.5) * 11;
      positions[i * 3 + 2] = (rand() - 0.5) * 9 + 1.5;
      seeds[i] = rand() * 10;
    }
    return { positions, seeds };
  }, [seed, count]);
}

/** Slow-drifting sparkle motes filling the space between the centerpiece and
 * its satellites — a single THREE.Points draw call (not per-particle
 * sprites), so ambient depth is effectively free regardless of `count`. */
export function AtmosphereDust({
  color,
  seed,
  size,
  opacity,
  count,
  reduced,
}: {
  color: string;
  seed: string;
  size: number;
  opacity: number;
  count: number;
  reduced: boolean;
}) {
  const texture = useDustTexture();
  const { positions, seeds } = useDustLayout(seed, count);
  const basePositions = useMemo(() => Float32Array.from(positions), [positions]);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame((state) => {
    if (reduced || !geometryRef.current) return;
    const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const x = basePositions[i * 3] + Math.cos(t * 0.06 + s) * 0.5;
      const y = basePositions[i * 3 + 1] + Math.sin(t * 0.08 + s) * 0.7;
      const z = basePositions[i * 3 + 2];
      posAttr.setXYZ(i, x, y, z);
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        color={color}
        size={size}
        sizeAttenuation
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/** Builds a hard, per-facet vertex-color attribute for a low-poly geometry —
 * each face gets one flat, slightly jittered shade of `baseColor` rather than
 * a smoothly interpolated gradient, which is what actually reads as "cut
 * facets" instead of a lumpy sphere. Requires a non-indexed geometry (each
 * face owns its own unshared vertices) or the jitter blends across shared
 * corners instead of stopping at the edge. Seeded so a given body's facet
 * pattern is stable across re-renders (theme/hover changes) rather than
 * reshuffling every time the material updates. */
export function faceColorAttribute(geometry: THREE.BufferGeometry, baseColor: string, seed: string, jitter = 0.12) {
  const nonIndexed = geometry.index ? geometry.toNonIndexed() : geometry;
  const position = nonIndexed.attributes.position;
  const faceCount = position.count / 3;
  const rand = mulberry32(hashString(seed));
  const colors = new Float32Array(position.count * 3);
  const base = new THREE.Color(baseColor);

  for (let f = 0; f < faceCount; f++) {
    const amount = (rand() - 0.5) * jitter;
    const shade = base.clone();
    if (amount >= 0) shade.lerp(new THREE.Color("#ffffff"), amount);
    else shade.lerp(new THREE.Color("#000000"), -amount);
    for (let v = 0; v < 3; v++) {
      const idx = (f * 3 + v) * 3;
      colors[idx] = shade.r;
      colors[idx + 1] = shade.g;
      colors[idx + 2] = shade.b;
    }
  }

  nonIndexed.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return nonIndexed;
}

function drawCraters(
  cctx: CanvasRenderingContext2D,
  bctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: () => number,
  count: number,
  minRadius: number,
  maxRadius: number,
  highlightHex: string,
  floorHex: string,
  floorAlpha: number
) {
  const hi = hexToRgb(highlightHex);
  const fl = hexToRgb(floorHex);
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = height * 0.08 + rand() * height * 0.84;
    const r = minRadius + rand() * (maxRadius - minRadius);

    const cGrad = cctx.createRadialGradient(x, y, 0, x, y, r);
    cGrad.addColorStop(0, `rgba(${fl.r},${fl.g},${fl.b},${floorAlpha})`);
    cGrad.addColorStop(0.7, `rgba(${fl.r},${fl.g},${fl.b},${floorAlpha * 0.44})`);
    cGrad.addColorStop(0.82, `rgba(${hi.r},${hi.g},${hi.b},0.24)`);
    cGrad.addColorStop(1, "rgba(0,0,0,0)");
    cctx.fillStyle = cGrad;
    cctx.beginPath();
    cctx.arc(x, y, r, 0, Math.PI * 2);
    cctx.fill();

    const bGrad = bctx.createRadialGradient(x, y, 0, x, y, r);
    bGrad.addColorStop(0, "rgba(0,0,0,0.62)");
    bGrad.addColorStop(0.68, "rgba(0,0,0,0.3)");
    bGrad.addColorStop(0.82, "rgba(255,255,255,0.65)");
    bGrad.addColorStop(1, "rgba(128,128,128,0)");
    bctx.fillStyle = bGrad;
    bctx.beginPath();
    bctx.arc(x, y, r, 0, Math.PI * 2);
    bctx.fill();
  }
}

function drawMaria(cctx: CanvasRenderingContext2D, width: number, height: number, rand: () => number, count: number, floorHex: string, alpha: number) {
  const fl = hexToRgb(floorHex);
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = height * 0.15 + rand() * height * 0.7;
    const r = width * 0.08 + rand() * width * 0.07;
    const grad = cctx.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${fl.r},${fl.g},${fl.b},${alpha})`);
    grad.addColorStop(1, `rgba(${fl.r},${fl.g},${fl.b},0)`);
    cctx.fillStyle = grad;
    cctx.beginPath();
    cctx.arc(x, y, r, 0, Math.PI * 2);
    cctx.fill();
  }
}

function heightCanvasToNormalCanvas(heightCanvas: HTMLCanvasElement, strength: number) {
  const w = heightCanvas.width;
  const h = heightCanvas.height;
  const src = heightCanvas.getContext("2d")!.getImageData(0, 0, w, h).data;
  const heightAt = (x: number, y: number) => {
    const xi = ((x % w) + w) % w;
    const yi = Math.max(0, Math.min(h - 1, y));
    return src[(yi * w + xi) * 4] / 255;
  };
  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = w;
  normalCanvas.height = h;
  const nctx = normalCanvas.getContext("2d")!;
  const out = nctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = (heightAt(x - 1, y) - heightAt(x + 1, y)) * strength;
      const dy = (heightAt(x, y - 1) - heightAt(x, y + 1)) * strength;
      const len = Math.sqrt(dx * dx + dy * dy + 1);
      const idx = (y * w + x) * 4;
      out.data[idx] = Math.round((dx / len) * 0.5 * 255 + 127);
      out.data[idx + 1] = Math.round((dy / len) * 0.5 * 255 + 127);
      out.data[idx + 2] = Math.round((1 / len) * 0.5 * 255 + 127);
      out.data[idx + 3] = 255;
    }
  }
  nctx.putImageData(out, 0, 0);
  return normalCanvas;
}

/** The lunar crater/maria color+normal-map generator — the original
 * pre-Phase-2 technique, ported forward through the Phase 2B exploration
 * (where it won out over a smooth glass shell and a ceramic vertex-noise
 * surface for "reads unmistakably as a moon") and now shared by production
 * CelestialBody. A real generated normal map, not a flat texture — this is
 * what makes the crater relief actually catch the key light's terminator
 * instead of looking painted on. Skipped entirely when `enabled` is false
 * (the sun doesn't need it) so the per-pixel normal pass never runs for
 * nothing. */
export function useCraterTerrainTextures(baseColor: string, enabled: boolean, seed = "moon", resolutionWidth = 1024) {
  return useMemo(() => {
    if (!enabled) return { colorTexture: null, normalTexture: null };
    // Kept at a fixed 2:1 aspect ratio; only the absolute resolution scales
    // by quality tier. The normal-map pass below is a per-pixel loop
    // (heightCanvasToNormalCanvas), so this is the one place in the scene
    // where texture size is a real, if one-time, CPU cost — worth scaling
    // down on `low` tier rather than paying the same generation cost as
    // `high` regardless of device.
    const width = resolutionWidth;
    const height = Math.round(resolutionWidth / 2);
    const rand = mulberry32(hashString(seed));

    const colorCanvas = document.createElement("canvas");
    colorCanvas.width = width;
    colorCanvas.height = height;
    const cctx = colorCanvas.getContext("2d")!;
    cctx.fillStyle = baseColor;
    cctx.fillRect(0, 0, width, height);

    const heightCanvas = document.createElement("canvas");
    heightCanvas.width = width;
    heightCanvas.height = height;
    const hctx = heightCanvas.getContext("2d")!;
    hctx.fillStyle = "#808080";
    hctx.fillRect(0, 0, width, height);

    // Two crater passes at different scales (large-sparse + small-numerous)
    // rather than one uniform distribution — real maria are patchy at
    // multiple scales, and a single pass reads as more uniform/artificial
    // than layering two does.
    drawMaria(cctx, width, height, rand, 6, darken(baseColor, 0.35), 0.2);
    drawCraters(cctx, hctx, width, height, rand, 34, 8, 40, lighten(baseColor, 0.5), darken(baseColor, 0.45), 0.26);
    drawCraters(cctx, hctx, width, height, rand, 26, 3, 9, lighten(baseColor, 0.45), darken(baseColor, 0.4), 0.22);

    const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, 2.1);

    const colorTexture = new THREE.CanvasTexture(colorCanvas);
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.needsUpdate = true;
    const normalTexture = new THREE.CanvasTexture(normalCanvas);
    normalTexture.needsUpdate = true;
    return { colorTexture, normalTexture };
  }, [baseColor, enabled, seed, resolutionWidth]);
}

const COMET_TRAIL_LENGTH = 10;
// In front of every satellite and the centerpiece (the furthest satellite
// sits around z=2.35 — see config.ts) so the trail never gets clipped behind
// something it's meant to float above.
const COMET_DEPTH = 3.4;
const COMET_HEAD_LERP = 0.55;
const COMET_CHAIN_LERP = 0.5;
// Hue cycles within this band (0–1 hue space) rather than the full color
// wheel — deliberately never visits the duller yellow/green/red range, so it
// always reads as the same "iridescent plasma" family Direction 1's
// exploration prototype used, cycling continuously rather than sitting on
// one fixed tone.
const COMET_HUE_CENTER = 0.78;
const COMET_HUE_SPREAD = 0.22;

interface CometState {
  links: THREE.Vector3[];
  matrix: THREE.Matrix4;
  quaternion: THREE.Quaternion;
  scaleVec: THREE.Vector3;
  instanceColor: THREE.Color;
  targetWorld: THREE.Vector3;
}

/** A glowing trail of shrinking dots chasing the cursor — Direction 3 of the
 * user's requested redo ("bolder celestial," reacting boldly and obviously
 * to the cursor rather than the previous restrained parallax). Each link
 * lerps toward the one ahead of it rather than all links lerping toward the
 * cursor directly, which is what gives the classic "inchworm" trailing feel
 * instead of a cluster of dots all converging independently. One instanced
 * draw call regardless of trail length.
 *
 * Color is its own system now, deliberately not tied to the celestial theme
 * tones ("the comet could be a different coloring system") — each instance
 * gets its own hue via `setColorAt`, continuously cycling through an
 * iridescent purple/magenta/cyan band independent of dark/light mode, so the
 * trail reads as a distinct, live element rather than an extension of
 * whichever theme is active. Hidden entirely under reduced motion — a
 * cursor-chasing trail is pure decorative motion with no functional
 * purpose, the clear case for removing it outright rather than just
 * freezing it. */
export function CursorComet({
  reduced,
  scrollProgress,
}: {
  reduced: boolean;
  scrollProgress: number;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  // Declared via JSX + ref below, not constructed with `new
  // THREE.MeshBasicMaterial()` in a useMemo — opacity needs mutating every
  // frame, and the project's react-hooks/immutability rule treats a
  // memoized value's properties as frozen once returned. A ref to the live
  // instance the renderer creates from the JSX is exempt, the same pattern
  // GlassShell/RippleShell use for their materials. Base color is white so
  // the automatic per-instance color multiplication three.js applies
  // whenever an InstancedMesh has an instanceColor attribute (populated via
  // setColorAt below) is a pure pass-through, not tinted by a second color.
  // Deliberately not using the material's own `vertexColors` flag — that's
  // for a *geometry*-level per-vertex color attribute (a different
  // mechanism), and this geometry doesn't have one; setting it anyway
  // multiplied the result by an unset (zeroed) attribute and rendered every
  // instance solid black, caught in testing.
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const geometry = useMemo(() => new THREE.SphereGeometry(1, 12, 12), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  // Trail links and scratch objects, held in a ref built lazily on the first
  // frame — never a useMemo (everything here is mutated every frame below)
  // and never read during render (only inside this useFrame callback), the
  // same two constraints every other imperative effect in this scene works
  // around the same way.
  const cometRef = useRef<CometState | null>(null);
  // R3F initializes state.pointer to exactly (0, 0) before any real pointer
  // event has landed on the canvas — a benign default for the camera
  // parallax and centerpiece tilt (it just means "centered, no offset yet"),
  // but for this trail it means "parked directly in front of the
  // centerpiece," which briefly showed up as a bright stray dot on first
  // load in testing. Stay hidden until the pointer has genuinely moved away
  // from that sentinel at least once.
  const activatedRef = useRef(false);

  useFrame((state) => {
    if (!meshRef.current) return;
    if (reduced) {
      meshRef.current.visible = false;
      return;
    }
    if (!activatedRef.current) {
      if (state.pointer.x !== 0 || state.pointer.y !== 0) {
        activatedRef.current = true;
      } else {
        meshRef.current.visible = false;
        return;
      }
    }
    meshRef.current.visible = true;
    if (cometRef.current === null) {
      cometRef.current = {
        links: Array.from({ length: COMET_TRAIL_LENGTH }, () => new THREE.Vector3()),
        matrix: new THREE.Matrix4(),
        quaternion: new THREE.Quaternion(),
        scaleVec: new THREE.Vector3(),
        instanceColor: new THREE.Color(),
        targetWorld: new THREE.Vector3(),
      };
    }
    const c = cometRef.current;
    c.targetWorld.set((state.pointer.x * state.viewport.width) / 2, (state.pointer.y * state.viewport.height) / 2, COMET_DEPTH);
    c.links[0].lerp(c.targetWorld, COMET_HEAD_LERP);
    for (let i = 1; i < COMET_TRAIL_LENGTH; i++) {
      c.links[i].lerp(c.links[i - 1], COMET_CHAIN_LERP);
    }

    if (materialRef.current) {
      materialRef.current.opacity = 1 - scrollProgress;
    }

    const t = state.clock.elapsedTime;
    for (let i = 0; i < COMET_TRAIL_LENGTH; i++) {
      const tailFraction = 1 - i / COMET_TRAIL_LENGTH;
      c.scaleVec.setScalar(0.05 + 0.09 * tailFraction * tailFraction);
      c.matrix.compose(c.links[i], c.quaternion, c.scaleVec);
      meshRef.current.setMatrixAt(i, c.matrix);
      // Each instance's hue drifts independently over time and along the
      // trail (the `i * 0.12` phase offset), so the gradient itself visibly
      // travels down the tail rather than staying static per-position.
      const hue = COMET_HUE_CENTER + Math.sin(t * 0.5 + i * 0.5) * COMET_HUE_SPREAD;
      c.instanceColor.setHSL(hue, 0.82, 0.64);
      meshRef.current.setColorAt(i, c.instanceColor);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geometry, undefined, COMET_TRAIL_LENGTH]} frustumCulled={false}>
      <meshBasicMaterial ref={materialRef} color="#ffffff" transparent depthWrite={false} blending={THREE.AdditiveBlending} />
    </instancedMesh>
  );
}
