"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, QuadraticBezierLine, Stars, useAnimations, useGLTF } from "@react-three/drei";
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
    // Stars are a dark-mode-only motif site-wide (see docs/DESIGN_SYSTEM.md) —
    // light mode swaps to the same coral/apricot "shell" family the flat
    // field map uses in `:root[data-theme=light] .field-map`, pushed more
    // saturated for the same reason as the dark-mode set above.
    nodes: {
      practice: "#ff8fae",
      experience: "#ff9d4d",
      work: "#ff5a4d",
      community: "#c98a4b",
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

const BALLOON_POSITIONS: Record<SatelliteId, THREE.Vector3> = {
  practice: new THREE.Vector3(-1.9, 1.7, 1.9),
  experience: new THREE.Vector3(1.9, 2.0, 1.3),
  work: new THREE.Vector3(0.3, -2.4, 2.0),
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

function Glow({ color, scale, opacity = 0.85 }: { color: string; scale: number; opacity?: number }) {
  const texture = useGlowTexture();
  return (
    <sprite scale={[scale, scale, 1]}>
      <spriteMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </sprite>
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
      emissiveIntensity: 0.06,
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

  useFrame((state) => {
    pointer.current.x = state.pointer.x;
    pointer.current.y = state.pointer.y;
    if (!groupRef.current) return;
    const targetX = reduced ? 0 : pointer.current.y * 0.06;
    const targetZ = reduced ? 0 : pointer.current.x * 0.08;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetX, 0.04);
    groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetZ, 0.04);
    if (!reduced) {
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.45) * 0.14;
    }
  });

  return (
    <group ref={groupRef}>
      <Glow color="#fff2d2" scale={5.4} opacity={0.42} />
      {/* A bright, near-overhead light so the top of the envelope actually
          catches a hard highlight — "sunlight reflecting off it" reads as a
          real specular hit, not just an overall brightness bump. */}
      <pointLight color="#fffaf0" position={[1.5, 8, 3]} intensity={46} distance={22} />
      <pointLight color="#fff6de" position={[6, 4, 4]} intensity={22} distance={20} />
      <pointLight color="#bcd8ff" position={[-5, -2, -3]} intensity={10} distance={16} />
      {/* Source geometry loads already correctly Y-up and close to scene
          scale via GLTFLoader — the model is simply enlarged and recentered
          here, not re-oriented. */}
      <primitive object={model} scale={3.8} position={[0, -1.9, 0]} />
    </group>
  );
}

const KITE_URL = "/models/kite.glb";
useGLTF.preload(KITE_URL);

/** The source scene bundles two distinct kite rigs (each its own armature +
 * flutter animation) plus a cloud sphere and trailing ground-string meshes
 * we don't want — already stripped out at the asset level (see
 * public/models/credits and the kite.glb generation). Both rigs' bone tracks
 * live in one shared "Animation" clip; `boneNames` lets each instance filter
 * down to just its own tracks instead of logging "no target found" for the
 * other rig's bones every frame.
 *
 * (three.js's GLTFLoader strips "." from node names at load time — dots
 * delimit animation-track paths — so the source file's "Armature.001_12" is
 * "Armature001_12" once loaded; kite.glb was re-exported with matching
 * dot-free names throughout so the embedded clip's track targets resolve.) */
const KITE_VARIANTS = [
  { armature: "Armature_7", boneNames: ["Bone_4", "Bone002_3", "Object_12"] },
  { armature: "Armature001_12", boneNames: ["Bone_9", "Bone002_8", "Object_21"] },
] as const;

function filterClipToNodes(clip: THREE.AnimationClip, nodeNames: readonly string[]) {
  const tracks = clip.tracks.filter((track) => nodeNames.some((name) => track.name.startsWith(`${name}.`)));
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
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
}: {
  label: string;
  color: string;
  hovered: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  return (
    <a
      href="#field-map"
      onPointerEnter={() => onHoverChange(true)}
      onPointerLeave={() => onHoverChange(false)}
      onFocus={() => onHoverChange(true)}
      onBlur={() => onHoverChange(false)}
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

function OrbitNode({
  node,
  color,
  reduced,
}: {
  node: PositionedSatellite;
  color: string;
  reduced: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const sphereRef = useRef<THREE.Mesh>(null);
  const { colorTexture, bumpTexture } = useSatelliteTextures(node.id, color);
  const bobSeed = useMemo(() => (node.id.charCodeAt(0) % 7) * 0.9, [node.id]);
  const spinSpeed = useMemo(() => 0.25 + (node.id.charCodeAt(1) % 5) * 0.08, [node.id]);
  const radius = 0.46;

  useFrame((state, delta) => {
    if (groupRef.current && !reduced) {
      const bob = Math.sin(state.clock.elapsedTime * 0.7 + bobSeed) * 0.08;
      groupRef.current.position.copy(node.position).add(new THREE.Vector3(0, bob, 0));
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
        opacity={hovered ? 0.65 : 0.3}
      />
      <Glow color={color} scale={hovered ? radius * 4.2 : radius * 3} opacity={hovered ? 0.85 : 0.7} />
      <pointLight color={color} intensity={hovered ? 5 : 2.6} distance={2.4} position={[0.4, 0.3, 1]} />
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
            emissiveIntensity={0.28}
          />
        </mesh>
        <RimGlow color={color} radius={radius} glowIntensity={hovered ? 1.9 : 1.3} />
      </group>
      <Html position={[0, -radius - 0.34, 0]} center distanceFactor={7} occlude={false}>
        <SatelliteLabel label={node.label} color={color} hovered={hovered} onHoverChange={setHovered} />
      </Html>
    </group>
  );
}

/** Recolors a clone of the kite fabric mesh to match its category's color —
 * the source model ships one kite red and one grey, but each satellite here
 * needs its own established palette color, same as the planet satellites. */
function tintKiteMaterials(root: THREE.Object3D, color: string) {
  root.traverse((child) => {
    if (!(child instanceof THREE.SkinnedMesh) && !(child instanceof THREE.Mesh)) return;
    const source = child.material as THREE.MeshStandardMaterial;
    const material = source.clone();
    material.color = new THREE.Color(color);
    material.emissive = new THREE.Color(color);
    material.emissiveIntensity = 0.16;
    material.roughness = 0.55;
    child.material = material;
  });
}

/** Light mode's satellites — the two rigged kite meshes from kite.glb,
 * alternated across the four category slots and recolored per category, each
 * cloned via SkeletonUtils (a plain Object3D.clone() shares bone bindings
 * and would make every instance animate in lockstep) so the built-in flutter
 * animation runs independently — and out of phase — per instance. */
function KiteSatellite({
  node,
  color,
  variant,
  reduced,
}: {
  node: PositionedSatellite;
  color: string;
  variant: number;
  reduced: boolean;
}) {
  const { scene, animations } = useGLTF(KITE_URL);
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const kiteRef = useRef<THREE.Group>(null);
  const bobSeed = useMemo(() => (node.id.charCodeAt(0) % 7) * 0.9, [node.id]);

  const kiteVariant = KITE_VARIANTS[variant % KITE_VARIANTS.length];

  const kite = useMemo(() => {
    const source = scene.getObjectByName(kiteVariant.armature);
    if (!source) return null;
    const cloned = SkeletonUtils.clone(source) as THREE.Group;
    tintKiteMaterials(cloned, color);
    // The source scene positions each kite rig arbitrarily within its own
    // original composition — recenter so this instance's own visual center
    // lands exactly at the group origin, matching where node.position and
    // the connecting string actually point.
    const center = new THREE.Box3().setFromObject(cloned).getCenter(new THREE.Vector3());
    cloned.position.sub(center);
    return cloned;
  }, [scene, color, kiteVariant]);

  const filteredAnimations = useMemo(
    () => animations.map((clip) => filterClipToNodes(clip, kiteVariant.boneNames)),
    [animations, kiteVariant]
  );
  const { actions } = useAnimations(filteredAnimations, kiteRef);

  useEffect(() => {
    const action = actions?.Animation;
    if (!action) return;
    if (reduced) {
      action.stop();
      return;
    }
    action.reset().play();
    // THREE.AnimationAction is a mutable, stateful class instance (three.js's
    // own imperative animation API), not React state — setting .time desyncs
    // each kite instance's flutter phase so all four don't move in lockstep.
    // eslint-disable-next-line react-hooks/immutability
    action.time = bobSeed;
    return () => {
      action.stop();
    };
  }, [actions, reduced, bobSeed]);

  useFrame((state) => {
    if (!groupRef.current || reduced) return;
    const bob = Math.sin(state.clock.elapsedTime * 0.6 + bobSeed) * 0.16;
    groupRef.current.position.copy(node.position).add(new THREE.Vector3(0, bob, 0));
  });

  if (!kite) return null;

  // A real kite's line trails down toward whoever's holding it, not sideways
  // to another object in the sky — down and slightly out, per-instance drift
  // (from the same seed as the bob) so the four don't all hang dead straight
  // and parallel.
  const stringLength = 2.6;
  const driftX = Math.sin(bobSeed) * 0.6;
  const driftZ = Math.cos(bobSeed) * 0.6;

  return (
    <group ref={groupRef} position={node.position}>
      <QuadraticBezierLine
        start={[0, 0, 0]}
        end={[driftX, -stringLength, driftZ]}
        mid={[driftX * 0.4, -stringLength * 0.55, driftZ * 0.4]}
        color={color}
        lineWidth={1}
        transparent
        opacity={hovered ? 0.55 : 0.26}
      />
      <group
        ref={kiteRef}
        scale={hovered ? 0.26 : 0.22}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <primitive object={kite} />
      </group>
      <Html position={[0, -0.55, 0]} center distanceFactor={7} occlude={false}>
        <SatelliteLabel label={node.label} color={color} hovered={hovered} onHoverChange={setHovered} />
      </Html>
    </group>
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
      >
        {/* Lower ambient for the moon on purpose — deep, real shadow inside
            each crater is what sells the relief. The balloon scene wants a
            brighter, even daylight fill instead. */}
        <ambientLight intensity={mode === "moon" ? 0.3 : 0.7} />
        <pointLight position={[5, 3.5, 6]} intensity={mode === "moon" ? 12 : 18} distance={20} color={palette.keyLight} />
        {mode === "moon" ? (
          <Stars radius={20} depth={28} count={reduced ? 250 : 700} factor={1.6} saturation={0} fade speed={reduced ? 0 : 0.6} />
        ) : null}
        <Suspense fallback={null}>
          {mode === "moon" ? (
            <Centerpiece color={palette.keyLight} rimColor={palette.rim} reduced={reduced} />
          ) : (
            <BalloonCenterpiece reduced={reduced} />
          )}
          {satellites.map((node, i) =>
            mode === "moon" ? (
              <OrbitNode key={node.id} node={node} color={palette.nodes[node.id]} reduced={reduced} />
            ) : (
              <KiteSatellite key={node.id} node={node} color={palette.nodes[node.id]} variant={i} reduced={reduced} />
            )
          )}
        </Suspense>
        <Rig reduced={reduced} />
      </Canvas>
    </div>
  );
}
