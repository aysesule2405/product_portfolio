"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, QuadraticBezierLine, Stars, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { useTheme } from "next-themes";
import { useReducedMotion } from "@/lib/motion";

/**
 * Mirrors the --star-* / --accent tokens in app/globals.css. Hardcoded rather
 * than read from computed styles: three.js materials are plain JS state, not
 * CSS-cascaded, and the token values only change on a theme flip (not worth
 * a MutationObserver) — this keeps the two in sync by hand instead.
 */
const PALETTE = {
  dark: {
    // Pale warm ivory, matching the real moon-phase photography already used
    // in MoonPhaseChart elsewhere on the site — not the site's branded gold,
    // which read as a metallic/amber "sun" even in dark mode.
    keyLight: "#efe6c7",
    rim: "#5b8fd6",
    // Pushed more saturated than the ambient --star-* tokens on purpose —
    // these are the interactive focal points of the scene and need to read
    // as vivid, distinct little worlds against a fairly dim backdrop.
    nodes: {
      practice: "#5fc9ff",
      experience: "#3d6bff",
      work: "#ffcc33",
      community: "#ff6a1f",
    },
  },
  light: {
    // Warm daylight tint for the shared key light — the light-mode centerpiece
    // is a hot-air balloon now (see BalloonCenterpiece), not a self-lit sun,
    // so this only ever colors real scene lighting.
    keyLight: "#fff1cf",
    rim: "#ffb066",
    // Pulled straight from the hot-air balloon's own envelope stripe
    // palette (see useBalloonEnvelopeTexture) rather than an independent
    // set — the kites now read as belonging to the same sunlit-fabric
    // family as the centerpiece they fly around.
    nodes: {
      practice: lighten("#e8563f", 0.16),
      experience: lighten("#f5a623", 0.14),
      work: "#fdf8ec",
      community: lighten("#3d8bff", 0.2),
    },
  },
} as const;

/** Mirrors CommitConstellation's four field-map clusters (roots/experience/
 * projects/community) — this scene is a compressed 3D preview of that map,
 * so every node routes to the same #field-map anchor it lives in. */
const SATELLITES = [
  { id: "practice", label: "Practice" },
  { id: "experience", label: "Experience" },
  { id: "work", label: "Work" },
  { id: "community", label: "Community" },
] as const;

type SatelliteId = (typeof SATELLITES)[number]["id"];

/** Positions differ per centerpiece: the moon's satellites orbit a compact
 * sphere, while the balloon's kites need more spread and height variation to
 * read as flying alongside a tall, asymmetric shape instead of a ball. */
const MOON_POSITIONS: Record<SatelliteId, THREE.Vector3> = {
  practice: new THREE.Vector3(-1.5, 1.1, 2.15),
  experience: new THREE.Vector3(1.5, 1.35, 1.7),
  work: new THREE.Vector3(0.25, -2.15, 2.75),
  community: new THREE.Vector3(1.5, -1.65, 1.5),
};

// "work" pulled outward (mainly in y/z, not x, to avoid pushing the whole
// cluster wide enough to clip on narrow/mobile viewports) once the balloon
// model's own scale grew (3.8 -> 5.8) without these positions being
// revisited — it ended up sitting almost inside the enlarged basket instead
// of beside it. The other three already had enough clearance at their
// original spots.
const BALLOON_POSITIONS: Record<SatelliteId, THREE.Vector3> = {
  practice: new THREE.Vector3(-1.9, 1.7, 1.9),
  experience: new THREE.Vector3(1.9, 2.0, 1.3),
  work: new THREE.Vector3(0.3, -3.1, 2.6),
  community: new THREE.Vector3(1.75, -1.5, 0.6),
};

interface PositionedSatellite {
  id: SatelliteId;
  label: string;
  position: THREE.Vector3;
}

function mulberry32(seed: number) {
  return function random() {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Lightens toward white by `amount` (0–1) — used to derive each satellite's
 * own crater-rim highlight tint from its base color, instead of a generic
 * cream that flattens every planet to the same look. */
function lighten(hex: string, amount: number) {
  const { r, g, b } = hexToRgb(hex);
  return rgbToHex({ r: r + (255 - r) * amount, g: g + (255 - g) * amount, b: b + (255 - b) * amount });
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

/** Returns 0→1 eased progress for a delayed entrance animation — call once
 * per frame with the scene clock's `elapsedTime`. `startRef` lazily captures
 * "now + delay" on its first call, so several instances that all mount in
 * the same React commit still stagger correctly off their own `delay`. */
function entranceProgress(
  startRef: { current: number | null },
  elapsedTime: number,
  delay: number,
  duration: number,
  reduced: boolean
) {
  if (reduced) return 1;
  if (startRef.current === null) startRef.current = elapsedTime + delay;
  const t = THREE.MathUtils.clamp((elapsedTime - startRef.current) / duration, 0, 1);
  return easeOutCubic(t);
}

const CLICK_PUNCH_DURATION = 0.4;

/** A quick scale-up-then-settle pulse starting the instant `active` goes
 * true — the click "punch" flourish, shared by both satellite variants. A
 * single sine hump (0 at both ends, peak at the midpoint) rather than a
 * spring: cheap, and it can't get caught mid-oscillation since the page
 * navigates away right as it finishes. */
function clickPunchScale(startRef: { current: number | null }, elapsedTime: number, active: boolean) {
  if (!active) {
    startRef.current = null;
    return 1;
  }
  if (startRef.current === null) startRef.current = elapsedTime;
  const t = THREE.MathUtils.clamp((elapsedTime - startRef.current) / CLICK_PUNCH_DURATION, 0, 1);
  return 1 + Math.sin(t * Math.PI) * 0.4;
}

function useGlowTexture() {
  return useMemo(() => {
    const size = 128;
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

/** A much softer, wider falloff than the core glow texture — layered behind
 * it, this is what actually reads as "light spilling into the scene" rather
 * than a hard-edged disc. Real screen-space bloom would do this job, but
 * UnrealBloomPass's stock combine shader doesn't preserve alpha and breaks
 * this canvas's required transparency (verified against a real screenshot,
 * not assumed) — two layered additive sprites get most of the same visual
 * payoff with none of that risk. */
function useHaloTexture() {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,0.5)");
    gradient.addColorStop(0.35, "rgba(255,255,255,0.2)");
    gradient.addColorStop(0.7, "rgba(255,255,255,0.06)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }, []);
}

function Glow({
  color,
  scale,
  opacity = 0.85,
  position = [0, 0, 0],
}: {
  color: string;
  scale: number;
  opacity?: number;
  position?: [number, number, number];
}) {
  const texture = useGlowTexture();
  const haloTexture = useHaloTexture();
  return (
    <>
      <sprite position={position} scale={[scale * 2.6, scale * 2.6, 1]}>
        <spriteMaterial
          map={haloTexture}
          color={color}
          transparent
          opacity={opacity * 0.55}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite position={position} scale={[scale, scale, 1]}>
        <spriteMaterial
          map={texture}
          color={color}
          transparent
          opacity={opacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </>
  );
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

/** A slightly-larger backside-only shell around a sphere, lit up only at
 * grazing viewing angles (a fresnel term) — the classic "planet atmosphere"
 * trick. Unlike the additive Glow sprite (a flat, camera-facing halo behind
 * the object), this actually traces the sphere's own silhouette, so the edge
 * itself glows rather than just the area around it. */
function RimGlow({ color, radius, power = 2.4, glowIntensity = 1.3 }: { color: string; radius: number; power?: number; glowIntensity?: number }) {
  const uniforms = useMemo(
    () => ({
      color: { value: new THREE.Color(color) },
      power: { value: power },
      glowIntensity: { value: glowIntensity },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color]
  );

  return (
    <mesh scale={1.22}>
      <sphereGeometry args={[radius, 32, 32]} />
      <shaderMaterial
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

/** Scatters real craters into both a color map (darkened floor, lit rim) and
 * a matching bump map (recessed floor, raised rim) so the relief reads under
 * real lighting instead of looking like flat dots painted on. */
function drawCraters(
  cctx: CanvasRenderingContext2D,
  bctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: () => number,
  count: number,
  minRadius: number,
  maxRadius: number,
  // Tints the lit rim of each crater — the neutral cream default suits the
  // centerpiece moon; satellites pass their own lightened hue instead, so
  // each little planet's shading feels like its own color, not a grey rock.
  highlightHex = "#fff6de",
  // Tints the crater floor — a near-black brown reads fine on the saturated
  // satellite colors, but flattens the moon's pale, muted reference photo
  // into harsh dark holes, so the moon call site passes a softer warm grey.
  floorHex = "#140e04",
  floorAlpha = 0.34
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

/** Large, soft, rimless dark patches — lunar maria — so the surface reads as
 * uneven terrain rather than a uniform field of same-size craters. */
function drawMaria(
  cctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: () => number,
  count: number,
  floorHex = "#140e04",
  alpha = 0.16
) {
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

function drawSpeckle(
  cctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: () => number,
  count: number,
  floorHex = "#140e04"
) {
  const fl = hexToRgb(floorHex);
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 0.4 + rand() * 1.3;
    cctx.fillStyle = `rgba(${fl.r},${fl.g},${fl.b},${0.05 + rand() * 0.07})`;
    cctx.beginPath();
    cctx.arc(x, y, r, 0, Math.PI * 2);
    cctx.fill();
  }
}

/** Derives a real per-pixel normal map from a grayscale height canvas via a
 * central-difference gradient — this is what actually makes crater relief
 * look sculpted under lighting, versus the coarser bumpMap approximation
 * (which only perturbs the lighting normal to a lower-precision degree and
 * reads noticeably flatter at this scale). Wraps horizontally to match the
 * sphere's seam and clamps vertically at the poles. */
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

/** Builds the moon's color map plus a *real* normal map (see
 * heightCanvasToNormalCanvas) derived from its own crater height data —
 * skipped entirely in sun mode via `enabled` so the expensive per-pixel pass
 * never runs when there's no moon on screen to use it. */
function useMoonTextures(baseColor: string, enabled: boolean) {
  return useMemo(() => {
    if (!enabled) return { colorTexture: null, normalTexture: null };

    const width = 1024;
    const height = 512;
    const rand = mulberry32(hashString("moon"));

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

    // Softer and sparser than the satellites on purpose: a near-black crater
    // floor and 110 crisp craters read as a busy, photoreal rock against the
    // rest of the site's clean vector/gradient language. A muted warm-grey
    // floor, fewer craters, and no fine speckle keeps the surface calm and
    // modern-stylized while still reading as a real, dimensional moon —
    // closer to the pale reference photo in MoonPhaseChart.
    drawMaria(cctx, width, height, rand, 4, "#a89a78", 0.22);
    drawCraters(cctx, hctx, width, height, rand, 46, 6, 40, "#fffaf0", "#8f8266", 0.26);

    const normalCanvas = heightCanvasToNormalCanvas(heightCanvas, 2.1);

    const colorTexture = new THREE.CanvasTexture(colorCanvas);
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.needsUpdate = true;

    // Normal maps encode directions, not perceptual color — must stay in the
    // texture's default linear color space, unlike the sRGB color map above.
    const normalTexture = new THREE.CanvasTexture(normalCanvas);
    normalTexture.needsUpdate = true;

    return { colorTexture, normalTexture };
  }, [baseColor, enabled]);
}

function Centerpiece({ color, rimColor, reduced }: { color: string; rimColor: string; reduced: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const introStart = useRef<number | null>(null);
  const radius = 1.75;
  const { colorTexture, normalTexture } = useMoonTextures(color, true);

  useFrame((state, delta) => {
    if (meshRef.current && !reduced) {
      meshRef.current.rotation.y += delta * 0.06;
    }
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    if (groupRef.current) {
      const targetX = reduced ? 0 : pointer.current.y * 0.14;
      const targetY = reduced ? 0 : pointer.current.x * 0.18;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.04);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetY, 0.04);
      // A slow "moonrise": climbs into place from below and grows to full
      // size on first mount, instead of simply appearing — the first thing
      // a visitor sees is the scene arriving, not a static frame.
      const intro = entranceProgress(introStart, state.clock.elapsedTime, 0, 1.8, reduced);
      groupRef.current.position.y = THREE.MathUtils.lerp(-4.5, 0, intro);
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.45, 1, intro));
    }
  });

  return (
    <group ref={groupRef}>
      <Glow color={color} scale={4.6} opacity={0.7} />
      {/* A dedicated raking key light, angled low across the surface so
          the normal-mapped craters actually cast visible shadow instead
          of being lit flat-on by the shared scene light. */}
      <pointLight color="#fff6de" position={[6, 0.8, 4]} intensity={30} distance={18} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 96, 96]} />
        {/* Lower roughness than a "realistic" matte moon would use — a
            soft glossy sheen (echoing the satellites' clearcoat look)
            is what makes it read as a polished, modern-stylized object
            rather than a rough photoreal rock. */}
        <meshStandardMaterial
          map={colorTexture ?? undefined}
          normalMap={normalTexture ?? undefined}
          normalScale={new THREE.Vector2(0.9, 0.9)}
          roughness={0.62}
          metalness={0.04}
          emissive={color}
          emissiveIntensity={0.06}
        />
      </mesh>
      <pointLight color={rimColor} position={[-4, -2, -2.5]} intensity={16} distance={10} />
    </group>
  );
}

const BALLOON_URL = "/models/hot_air_balloon.glb";
useGLTF.preload(BALLOON_URL);

/** The envelope ships with no texture at all (a blank white PBR material) —
 * this bakes classic vertical gore stripes onto it via the mesh's own UVs,
 * the same procedural-canvas technique used for the moon and satellites
 * rather than reaching for a photo texture. */
function useBalloonEnvelopeTexture() {
  return useMemo(() => {
    const size = 512;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    // Lightened from the original saturated set — a brighter, more
    // sun-washed fabric reads as lit-from-above rather than flat-colored.
    const colors = [lighten("#e8563f", 0.16), lighten("#f5a623", 0.14), "#fdf8ec", lighten("#3d8bff", 0.2)];
    const stripeCount = 16;
    const stripeWidth = size / stripeCount;
    for (let i = 0; i < stripeCount; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(i * stripeWidth, 0, stripeWidth, size);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }, []);
}

/** The envelope is one mesh, node-named "Cylinder001__0" in the source file;
 * "Box"-prefixed nodes are the basket, everything else (all "Cylinder*")
 * is rope/frame — verified by inspecting the downloaded glTF directly, not
 * guessed, since the generic FBX-export names give no semantic hint on
 * their own. */
function useBalloonModel() {
  const { scene } = useGLTF(BALLOON_URL);
  const envelopeTexture = useBalloonEnvelopeTexture();
  return useMemo(() => {
    const cloned = SkeletonUtils.clone(scene) as THREE.Group;
    const basketMaterial = new THREE.MeshStandardMaterial({ color: "#8a5a34", roughness: 0.88, metalness: 0.03 });
    const riggingMaterial = new THREE.MeshStandardMaterial({ color: "#332c24", roughness: 0.55, metalness: 0.35 });
    // Glossier and a touch emissive — a plain matte fabric material looked
    // flat under the same lights the satellites already read as "sunlit"
    // under, since clearcoat is what actually catches a bright highlight.
    const envelopeMaterial = new THREE.MeshPhysicalMaterial({
      map: envelopeTexture,
      roughness: 0.32,
      metalness: 0.02,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      emissive: "#fff6de",
      // Raised from 0.06 to help carry the "sunlit" look now that the
      // overhead point lights (see BalloonCenterpiece) run dimmer.
      emissiveIntensity: 0.16,
    });
    cloned.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (child.name === "Cylinder001__0") child.material = envelopeMaterial;
      else if (child.name.startsWith("Box")) child.material = basketMaterial;
      else child.material = riggingMaterial;
    });
    return cloned;
  }, [scene, envelopeTexture]);
}

/** Light mode's centerpiece — a real downloaded model (CC-BY-4.0, "Hot Air
 * Balloon" by Jacob Thompson — credit rendered in Hero.tsx) rather than
 * procedural geometry, per the redesign brief. A balloon drifts instead of
 * spinning: a slow vertical bob and a gentle sway replace the moon's
 * self-rotation. */
function BalloonCenterpiece({ reduced }: { reduced: boolean }) {
  const model = useBalloonModel();
  const groupRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const introStart = useRef<number | null>(null);

  useFrame((state) => {
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    const targetX = reduced ? 0 : pointer.current.y * 0.06;
    const targetZ = reduced ? 0 : pointer.current.x * 0.08;
    // Two mismatched, slow sine frequencies per axis read as a real gust
    // drifting through and easing off, rather than a metronomic pendulum —
    // the "hanging from a rope in the wind" motion a rigid tilt can't sell.
    const windTiltX = reduced ? 0 : Math.sin(t * 0.35) * 0.035 + Math.sin(t * 0.87 + 1.7) * 0.018;
    const windTiltZ = reduced ? 0 : Math.cos(t * 0.28 + 0.6) * 0.045 + Math.sin(t * 0.61) * 0.02;
    const windDriftX = reduced ? 0 : Math.sin(t * 0.22) * 0.16;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX + windTiltX, 0.05);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetZ + windTiltZ, 0.05);
    // Ascends into place on first mount, same beat as the moon's rise — a
    // balloon literally climbing into view is the obvious version of that
    // idea for this centerpiece. The idle bob fades in as the climb settles
    // rather than fighting it the whole way up.
    const intro = entranceProgress(introStart, t, 0, 2, reduced);
    const bob = reduced ? 0 : Math.sin(t * 0.45) * 0.14 * intro;
    groupRef.current.position.y = THREE.MathUtils.lerp(-6.5, 0, intro) + bob;
    groupRef.current.position.x = windDriftX * intro;
    groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.55, 1, intro));
  });

  return (
    <group ref={groupRef}>
      <Glow color="#fff2d2" scale={5.4} opacity={0.42} />
      {/* A bright, near-overhead light so the top of the envelope actually
          catches a hard highlight — "sunlight reflecting off it" reads as a
          real specular hit, not just an overall brightness bump. Kept modest
          (was 46/22): at full strength these two lights reached far enough
          to unevenly favor whichever kite satellite sits geometrically
          closest to them (the "experience" kite, which sits nearest to all
          three lights, was visibly brighter than its siblings as a result)
          — most of the balloon's own "sunlit" look now comes from its own
          material emissive instead, so it stays convincing lower down. */}
      <pointLight color="#fffaf0" position={[1.5, 8, 3]} intensity={16} distance={22} />
      <pointLight color="#fff6de" position={[6, 4, 4]} intensity={8} distance={20} />
      <pointLight color="#bcd8ff" position={[-5, -2, -3]} intensity={10} distance={16} />
      {/* Source geometry loads already correctly Y-up and close to scene
          scale via GLTFLoader — the model is simply enlarged and recentered
          here, not re-oriented. The -0.5015 factor keeps it vertically
          centered on world origin at any scale (half the model's own local
          y-extent, measured once off its bounding box). */}
      <primitive object={model} scale={5.8} position={[0, -0.5015 * 5.8, 0]} />
    </group>
  );
}

/** A small rocky surface for the orbiting satellites — same crater technique
 * as the centerpiece moon, scaled down, so they read as little planetoids
 * rather than flat color swatches. Kept theme-independent (always cratered,
 * never a mini sun) since these represent categories, not celestial bodies. */
function useSatelliteTextures(seedKey: string, baseColor: string) {
  return useMemo(() => {
    const width = 512;
    const height = 256;
    const rand = mulberry32(hashString(seedKey));
    const highlight = lighten(baseColor, 0.6);

    const colorCanvas = document.createElement("canvas");
    colorCanvas.width = width;
    colorCanvas.height = height;
    const cctx = colorCanvas.getContext("2d")!;
    cctx.fillStyle = baseColor;
    cctx.fillRect(0, 0, width, height);

    const bumpCanvas = document.createElement("canvas");
    bumpCanvas.width = width;
    bumpCanvas.height = height;
    const bctx = bumpCanvas.getContext("2d")!;
    bctx.fillStyle = "#808080";
    bctx.fillRect(0, 0, width, height);

    drawMaria(cctx, width, height, rand, 2);
    drawCraters(cctx, bctx, width, height, rand, 30, 5, 22, highlight);
    drawSpeckle(cctx, width, height, rand, 200);

    const colorTexture = new THREE.CanvasTexture(colorCanvas);
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.needsUpdate = true;

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.needsUpdate = true;

    return { colorTexture, bumpTexture };
  }, [seedKey, baseColor]);
}

/** The clickable/focusable label every satellite (planet or kite) shows
 * below itself — pulled out since both variants need the identical anchor. */
function SatelliteLabel({
  label,
  color,
  hovered,
  onHoverChange,
  onActivate,
}: {
  label: string;
  color: string;
  hovered: boolean;
  onHoverChange: (hovered: boolean) => void;
  onActivate: () => void;
}) {
  return (
    <a
      href="#field-map"
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
      onClick={(e) => {
        // A quick, satisfying "punch" flourish on the satellite itself
        // (scale + glow burst, see the caller's justClicked state) reads as
        // a real response to the click, not just an instant page-jump — the
        // navigation itself still happens, just a beat later.
        e.preventDefault();
        onActivate();
      }}
      className="pointer-events-auto block whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[13px] uppercase tracking-[0.1em] backdrop-blur-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      style={{
        color: hovered ? color : "var(--ink-soft)",
        background: "color-mix(in srgb, var(--bg) 42%, transparent)",
      }}
    >
      {label}
    </a>
  );
}

const SATELLITE_ACTIVATE_DELAY_MS = 280;

/** Shared by both satellite variants: preventDefault'ing the label's click
 * and navigating on a short timer instead gives the punch animation time to
 * actually play before the page jumps to #field-map. */
function useSatelliteActivate(reduced: boolean) {
  const [justClicked, setJustClicked] = useState(false);
  const activate = () => {
    if (reduced) {
      window.location.hash = "field-map";
      return;
    }
    setJustClicked(true);
    window.setTimeout(() => {
      window.location.hash = "field-map";
    }, SATELLITE_ACTIVATE_DELAY_MS);
  };
  return { justClicked, activate };
}

function OrbitNode({
  node,
  color,
  reduced,
  index,
}: {
  node: PositionedSatellite;
  color: string;
  reduced: boolean;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const introStart = useRef<number | null>(null);
  const punchStart = useRef<number | null>(null);
  const { colorTexture, bumpTexture } = useSatelliteTextures(node.id, color);
  const bobSeed = useMemo(() => (node.id.charCodeAt(0) % 7) * 0.9, [node.id]);
  const spinSpeed = useMemo(() => 0.25 + (node.id.charCodeAt(1) % 5) * 0.08, [node.id]);
  const radius = 0.46;
  const { justClicked, activate } = useSatelliteActivate(reduced);
  const punchRef = useRef(1);

  useFrame((state, delta) => {
    // Each satellite rises into its resting spot below the centerpiece's own
    // entrance, staggered by index — a cascading "one after another" arrival
    // rather than the whole scene popping in at once.
    const intro = entranceProgress(introStart, state.clock.elapsedTime, 0.3 + index * 0.15, 1.1, reduced);
    punchRef.current = clickPunchScale(punchStart, state.clock.elapsedTime, justClicked);
    if (groupRef.current) {
      const bob = reduced ? 0 : Math.sin(state.clock.elapsedTime * 0.7 + bobSeed) * 0.08 * intro;
      const start = node.position.clone().add(new THREE.Vector3(0, -5, 0));
      groupRef.current.position.lerpVectors(start, node.position, intro).add(new THREE.Vector3(0, bob, 0));
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, intro) * punchRef.current);
    }
    if (sphereRef.current && !reduced) {
      sphereRef.current.rotation.y += delta * spinSpeed;
    }
  });

  return (
    <group ref={groupRef} position={node.position}>
      <QuadraticBezierLine
        start={new THREE.Vector3(0, 0, 0).sub(node.position)}
        end={[0, 0, 0]}
        mid={node.position
          .clone()
          .multiplyScalar(-0.45)
          .add(new THREE.Vector3(0, 0.5, 0))}
        color={color}
        lineWidth={1}
        dashed
        dashScale={6}
        transparent
        opacity={hovered || justClicked ? 0.65 : 0.3}
      />
      <Glow color={color} scale={(hovered ? radius * 4.2 : radius * 3) * (justClicked ? 1.5 : 1)} opacity={hovered || justClicked ? 0.85 : 0.7} />
      <pointLight color={color} intensity={(hovered ? 5 : 2.6) * (justClicked ? 1.6 : 1)} distance={2.4} position={[0.4, 0.3, 1]} />
      <group scale={hovered ? 1.12 : 1}>
        <mesh
          ref={sphereRef}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <sphereGeometry args={[radius, 32, 32]} />
          <meshPhysicalMaterial
            map={colorTexture}
            bumpMap={bumpTexture}
            bumpScale={0.03}
            roughness={0.55}
            metalness={0.06}
            clearcoat={0.65}
            clearcoatRoughness={0.25}
            sheen={0.5}
            sheenColor={color}
            emissive={color}
            emissiveIntensity={justClicked ? 0.55 : 0.28}
          />
        </mesh>
        <RimGlow color={color} radius={radius} glowIntensity={hovered || justClicked ? 1.9 : 1.3} />
      </group>
      <Html position={[0, -radius - 0.34, 0]} center distanceFactor={7} occlude={false}>
        <SatelliteLabel label={node.label} color={color} hovered={hovered} onHoverChange={setHovered} onActivate={activate} />
      </Html>
    </group>
  );
}

const KITE_URL = "/models/kite.glb";
useGLTF.preload(KITE_URL);

// The downloaded "kites in clouds" file bundles two individually-posed kite
// meshes under two separate armatures, each driven by its own bones in the
// shared baked animation clip. Isolating each armature into its own group
// (see useKiteVariant) and comparing rendered angles against the file's own
// "side" view showed both kites already share one vertical (world Y) axis —
// only their yaw into camera-space needed a shared +90° correction to read
// face-on instead of edge-on/flipped, which is what the original "flipped
// sideways" bug actually was.
const KITE_TARGET_HEIGHT = 1.5;
const KITE_TIP = KITE_TARGET_HEIGHT / 2;
const KITE_CORRECTION_Y_DEG = 90;
// Each model's small tail-flag decoration hangs below the diamond's own
// bottom point, so centering on the whole mesh's bounding box (as
// useKiteVariant does, to get a reliable bottom-tip for the rope) pulls
// that center down below the diamond's actual visual middle — the glow
// needs a correction or it reads as floating low/off-center against the
// kite itself. The two source meshes carry noticeably different flag-to-
// diamond proportions (measured off real renders: variant 0's cross-spar
// sits ~6% of the total height above its bbox center, variant 1's sits
// ~19% above), so this is per-variant rather than one shared constant.
const KITE_GLOW_Y_OFFSET: [number, number] = [KITE_TARGET_HEIGHT * 0.06, KITE_TARGET_HEIGHT * 0.19];

const KITE_VARIANTS = [
  { armature: "Armature_7", nodes: ["Bone_4", "Bone002_3", "Object_12"] },
  { armature: "Armature001_12", nodes: ["Bone_9", "Bone002_8", "Object_21"] },
] as const;

/** three.js animation track names are "<nodeName>.<property>" — this keeps
 * only the tracks that belong to one variant's own bones/mesh, so playing
 * the clip on an isolated single-kite clone doesn't spam "no target node
 * found" warnings for the other kite's bones it doesn't contain. */
function filterClipToNodes(clip: THREE.AnimationClip, nodeNames: readonly string[]) {
  const tracks = clip.tracks.filter((t) => nodeNames.some((n) => t.name === n || t.name.startsWith(`${n}.`)));
  return new THREE.AnimationClip(`${clip.name}:${nodeNames[0]}`, clip.duration, tracks);
}

/** Loads the real downloaded kite model (CC-BY-NC — credited in Hero.tsx),
 * isolates one of its two armatures into its own normalized, upright,
 * bottom-tip-centered group, recolors it to the satellite's own palette
 * color, and plays its baked wind-flutter animation (real bone + cloth
 * morph-target motion authored by the original artist, not a hand-rolled
 * sine wave) at a per-instance phase offset so the four kites don't flutter
 * in lockstep. */
function useKiteVariant(
  variantIndex: 0 | 1,
  color: string,
  phaseOffset: number,
  reduced: boolean,
  hovered: boolean
) {
  const { scene, animations } = useGLTF(KITE_URL);

  const { holder, material } = useMemo(() => {
    const variant = KITE_VARIANTS[variantIndex];
    const clonedScene = SkeletonUtils.clone(scene) as THREE.Group;
    clonedScene.updateMatrixWorld(true);
    const armature = clonedScene.getObjectByName(variant.armature) as THREE.Object3D;

    // Re-root the armature under a fresh group carrying its exact original
    // world transform, then zero its own local transform — this bakes away
    // the source scene's arbitrary ancestor rotations into a single, known
    // node we can freely recenter and correct without disturbing the
    // (already correctly re-bound, via SkeletonUtils.clone) skinning.
    const holder = new THREE.Group();
    holder.matrix.copy(armature.matrixWorld);
    holder.matrix.decompose(holder.position, holder.quaternion, holder.scale);
    holder.add(armature);
    armature.position.set(0, 0, 0);
    armature.quaternion.identity();
    armature.scale.set(1, 1, 1);

    const box = new THREE.Box3().setFromObject(holder);
    const center = box.getCenter(new THREE.Vector3());
    holder.position.sub(center);

    const correction = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      (KITE_CORRECTION_Y_DEG * Math.PI) / 180
    );
    holder.quaternion.premultiply(correction);

    // Normalize both variants to the same on-screen height — the source
    // scene posed one kite noticeably larger than the other for its own
    // cluttered-sky composition, which reads as inconsistent once each is
    // its own standalone satellite.
    const height = box.max.y - box.min.y;
    holder.scale.setScalar(KITE_TARGET_HEIGHT / height);

    const material = new THREE.MeshPhysicalMaterial({
      color,
      side: THREE.DoubleSide,
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.4,
      clearcoatRoughness: 0.3,
      emissive: color,
      emissiveIntensity: 0.22,
      sheen: 0.6,
      sheenColor: lighten(color, 0.5),
    });
    holder.traverse((child) => {
      if (child instanceof THREE.Mesh) child.material = material;
    });

    return { holder, material };
  }, [scene, variantIndex, color]);

  const mixer = useMemo(() => new THREE.AnimationMixer(holder), [holder]);

  useEffect(() => {
    const variant = KITE_VARIANTS[variantIndex];
    const clip = filterClipToNodes(animations[0], variant.nodes);
    const action = mixer.clipAction(clip);
    action.play();
    mixer.setTime(phaseOffset);
    return () => {
      mixer.stopAllAction();
    };
  }, [mixer, animations, variantIndex, phaseOffset]);

  useEffect(() => {
    // THREE.MeshPhysicalMaterial is a mutable class instance (three.js's own
    // imperative material API), not React state — flipping a property on
    // hover is the standard way to react to interaction on it.
    // eslint-disable-next-line react-hooks/immutability
    material.emissiveIntensity = hovered ? 0.34 : 0.22;
  }, [material, hovered]);

  useFrame((_, delta) => {
    if (!reduced) mixer.update(delta);
  });

  return holder;
}

const KITE_TAIL_FLAG_TS = [0.2, 0.42, 0.64, 0.86] as const;
const KITE_TAIL_SEGMENTS = 24;

/** How far a point at `along` (0 = anchored at the kite, 1 = the free end)
 * has swayed from its rest position at time `t` — the anchored end barely
 * moves and the free end swings the most, same as a real hanging ribbon in
 * wind, which is what actually reads as "moving with the kite" instead of a
 * rigid drawn curve. */
function kiteTailSway(along: number, t: number, phaseOffset: number) {
  return {
    x: Math.sin(t * 1.8 + along * 4 + phaseOffset) * 0.16 * along,
    z: Math.cos(t * 1.4 + along * 3 + phaseOffset) * 0.1 * along,
  };
}

/** The tail — small flags threaded along the same line that stands in for
 * the flying line, both anchored at the sail's real bottom tip. Doubles as
 * the "rope" the redesign asked for and a decorative kite tail at once,
 * rather than drawing two redundant lines from the same point. The line
 * geometry and the flags share one sway function keyed on `phaseOffset` (the
 * same value driving that kite's own wind-flutter animation) so the whole
 * assembly reads as one physically connected object, not a static curve
 * with independently-jittering flags stapled to it. */
function KiteTail({
  color,
  hovered,
  reduced,
  phaseOffset,
}: {
  color: string;
  hovered: boolean;
  reduced: boolean;
  phaseOffset: number;
}) {
  const flagRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lineGeometryRef = useRef<THREE.BufferGeometry>(null);
  const curve = useMemo(
    () =>
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(0, -KITE_TIP, 0),
        new THREE.Vector3(0.35, -KITE_TIP - 1.3, 0.25),
        new THREE.Vector3(0.55, -KITE_TIP - 2.6, 0.45)
      ),
    []
  );
  const baseFlagPoints = useMemo(() => KITE_TAIL_FLAG_TS.map((t) => curve.getPoint(t)), [curve]);
  const basePoints = useMemo(() => curve.getPoints(KITE_TAIL_SEGMENTS), [curve]);
  const positions = useMemo(
    () => Float32Array.from(basePoints.flatMap((p) => [p.x, p.y, p.z])),
    [basePoints]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (lineGeometryRef.current) {
      const posAttr = lineGeometryRef.current.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < basePoints.length; i++) {
        const along = i / (basePoints.length - 1);
        const base = basePoints[i];
        const sway = reduced ? { x: 0, z: 0 } : kiteTailSway(along, t, phaseOffset);
        posAttr.setXYZ(i, base.x + sway.x, base.y, base.z + sway.z);
      }
      posAttr.needsUpdate = true;
    }
    flagRefs.current.forEach((mesh, i) => {
      if (!mesh) return;
      const along = KITE_TAIL_FLAG_TS[i];
      const base = baseFlagPoints[i];
      const sway = reduced ? { x: 0, z: 0 } : kiteTailSway(along, t, phaseOffset);
      mesh.position.set(base.x + sway.x, base.y, base.z + sway.z);
      mesh.rotation.z = reduced ? 0 : Math.sin(t * 3 + i * 1.3 + phaseOffset) * 0.45;
    });
  });

  return (
    <group>
      <line>
        <bufferGeometry ref={lineGeometryRef}>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} count={basePoints.length} itemSize={3} />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={hovered ? 0.6 : 0.32} />
      </line>
      {baseFlagPoints.map((p, i) => (
        <mesh key={i} ref={(el) => { flagRefs.current[i] = el; }} position={p}>
          <planeGeometry args={[0.16, 0.1]} />
          <meshStandardMaterial color={color} side={THREE.DoubleSide} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** Light mode's satellites — the real downloaded "kites in clouds" model
 * (see useKiteVariant), alternating its two bundled kite meshes across the
 * four satellite slots. Billboards around Y only (not a full sprite-style
 * billboard) so the kite always stays upright with its tail hanging straight
 * down, however far the scene gets dragged around — a full billboard was
 * the "flipped sideways" bug this scene was originally asked to fix. */
function KiteSatellite({
  node,
  color,
  reduced,
  index,
}: {
  node: PositionedSatellite;
  color: string;
  reduced: boolean;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const kiteRef = useRef<THREE.Group>(null);
  const introStart = useRef<number | null>(null);
  const punchStart = useRef<number | null>(null);
  const bobSeed = useMemo(() => (node.id.charCodeAt(0) % 7) * 0.9, [node.id]);
  const phaseOffset = useMemo(() => (hashString(node.id) % 500) / 100, [node.id]);
  const variantIndex = (index % 2) as 0 | 1;
  const holder = useKiteVariant(variantIndex, color, phaseOffset, reduced, hovered);
  const { justClicked, activate } = useSatelliteActivate(reduced);

  useFrame(({ clock, camera }) => {
    const intro = entranceProgress(introStart, clock.elapsedTime, 0.3 + index * 0.15, 1.1, reduced);
    const punch = clickPunchScale(punchStart, clock.elapsedTime, justClicked);
    if (groupRef.current) {
      const bob = reduced ? 0 : Math.sin(clock.elapsedTime * 0.6 + bobSeed) * 0.16 * intro;
      // A slow, wide side-to-side drift on top of the vertical bob — reads
      // as the whole kite being gently pushed by the same wind gusts as the
      // balloon (see BalloonCenterpiece), not just floating in place.
      const drift = reduced ? 0 : Math.sin(clock.elapsedTime * 0.3 + bobSeed * 1.7) * 0.14 * intro;
      const start = node.position.clone().add(new THREE.Vector3(0, -5, 0));
      groupRef.current.position.lerpVectors(start, node.position, intro).add(new THREE.Vector3(drift, bob, 0));
      groupRef.current.scale.setScalar(THREE.MathUtils.lerp(0.3, 1, intro) * punch);
    }
    if (kiteRef.current && groupRef.current) {
      const dx = camera.position.x - groupRef.current.position.x;
      const dz = camera.position.z - groupRef.current.position.z;
      kiteRef.current.rotation.y = Math.atan2(dx, dz);
      kiteRef.current.scale.setScalar(hovered ? 1.15 : 1);
    }
  });

  return (
    <group ref={groupRef} position={node.position}>
      <Glow
        color={color}
        scale={(hovered ? 1.4 : 1) * (justClicked ? 1.6 : 1)}
        opacity={hovered || justClicked ? 0.5 : 0.3}
        position={[0, KITE_GLOW_Y_OFFSET[variantIndex], 0]}
      />
      <group
        ref={kiteRef}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <primitive object={holder} />
        <KiteTail color={color} hovered={hovered} reduced={reduced} phaseOffset={phaseOffset} />
      </group>
      <Html position={[0, -KITE_TIP - 0.15, 0]} center distanceFactor={7} occlude={false}>
        <SatelliteLabel label={node.label} color={color} hovered={hovered} onHoverChange={setHovered} onActivate={activate} />
      </Html>
    </group>
  );
}

const DUST_COUNT = 70;

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

function useDustLayout(seed: string) {
  return useMemo(() => {
    const rand = mulberry32(hashString(seed));
    const positions = new Float32Array(DUST_COUNT * 3);
    const seeds = new Float32Array(DUST_COUNT);
    for (let i = 0; i < DUST_COUNT; i++) {
      positions[i * 3] = (rand() - 0.5) * 17;
      positions[i * 3 + 1] = (rand() - 0.5) * 11;
      positions[i * 3 + 2] = (rand() - 0.5) * 9 + 1.5;
      seeds[i] = rand() * 10;
    }
    return { positions, seeds };
  }, [seed]);
}

/** Slow-drifting sparkle motes filling the space between the centerpiece
 * and its satellites — dark mode already has drei's Stars for this kind of
 * ambient depth, but the balloon/kite scene had nothing occupying that
 * space at all. A single THREE.Points draw call, not per-particle sprites,
 * so the extra atmosphere is effectively free. */
function AtmosphereDust({ color, seed, size, opacity, reduced }: { color: string; seed: string; size: number; opacity: number; reduced: boolean }) {
  const texture = useDustTexture();
  const { positions, seeds } = useDustLayout(seed);
  const basePositions = useMemo(() => Float32Array.from(positions), [positions]);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  useFrame((state) => {
    if (reduced || !geometryRef.current) return;
    const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < DUST_COUNT; i++) {
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
        <bufferAttribute attach="attributes-position" args={[positions, 3]} count={DUST_COUNT} itemSize={3} />
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

function Rig({ reduced }: { reduced: boolean }) {
  const { invalidate } = useThree();
  return (
    <OrbitControls
      enableZoom
      minDistance={8}
      maxDistance={22}
      zoomSpeed={0.6}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      minPolarAngle={0.5}
      maxPolarAngle={Math.PI - 0.5}
      autoRotate={!reduced}
      autoRotateSpeed={0.45}
      onChange={() => invalidate()}
    />
  );
}

export function HeroOrbitScene() {
  const { resolvedTheme } = useTheme();
  const reduced = useReducedMotion();
  const palette = resolvedTheme === "light" ? PALETTE.light : PALETTE.dark;
  const mode: "moon" | "balloon" = resolvedTheme === "light" ? "balloon" : "moon";
  const wrapperRef = useRef<HTMLDivElement>(null);

  const satellites: PositionedSatellite[] = useMemo(
    () =>
      SATELLITES.map((s) => ({
        ...s,
        position: (mode === "moon" ? MOON_POSITIONS : BALLOON_POSITIONS)[s.id],
      })),
    [mode]
  );

  // A plain wheel/scroll should scroll the page — with the scene filling the
  // full-viewport hero, letting OrbitControls eat every wheel event would
  // trap anyone trying to scroll past it with a mouse. Pinch-to-zoom (and
  // Ctrl+scroll, the same gesture browsers use for trackpad pinch) is the
  // one exception: those fire wheel events with ctrlKey true, so letting
  // that specific case through to the canvas gives zoom a real, deliberate
  // gesture that never collides with normal scrolling. This has to be a
  // native, non-passive listener: React's synthetic onWheel is passive by
  // default, so preventDefault() inside it is silently ignored.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    function onWheel(e: WheelEvent) {
      if (e.ctrlKey) return;
      e.stopPropagation();
      e.preventDefault();
      window.scrollBy({ top: e.deltaY, behavior: "auto" });
    }
    node.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => node.removeEventListener("wheel", onWheel, { capture: true });
  }, []);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <Canvas
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, 14.5], fov: 40 }}
        frameloop={reduced ? "demand" : "always"}
        style={{ touchAction: "pan-y" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        {/* Lower ambient for the moon on purpose — deep, real shadow inside
            each crater is what sells the relief. The balloon scene wants a
            brighter, even daylight fill instead. */}
        <ambientLight intensity={mode === "moon" ? 0.3 : 0.7} />
        <pointLight position={[5, 3.5, 6]} intensity={mode === "moon" ? 12 : 18} distance={20} color={palette.keyLight} />
        {mode === "moon" ? (
          <>
            <Stars radius={20} depth={28} count={reduced ? 250 : 700} factor={1.6} saturation={0} fade speed={reduced ? 0 : 0.6} />
            <AtmosphereDust color="#bcd4ff" seed="dust-moon" size={0.1} opacity={0.55} reduced={reduced} />
          </>
        ) : (
          <AtmosphereDust color="#fff3d6" seed="dust-balloon" size={0.09} opacity={0.4} reduced={reduced} />
        )}
        <Suspense fallback={null}>
          {mode === "moon" ? (
            <Centerpiece color={palette.keyLight} rimColor={palette.rim} reduced={reduced} />
          ) : (
            <BalloonCenterpiece reduced={reduced} />
          )}
          {satellites.map((node, i) =>
            mode === "moon" ? (
              <OrbitNode key={node.id} node={node} color={palette.nodes[node.id]} reduced={reduced} index={i} />
            ) : (
              <KiteSatellite key={node.id} node={node} color={palette.nodes[node.id]} reduced={reduced} index={i} />
            )
          )}
        </Suspense>
        <Rig reduced={reduced} />
      </Canvas>
    </div>
  );
}
