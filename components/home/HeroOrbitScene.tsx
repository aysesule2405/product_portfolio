"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html, OrbitControls, QuadraticBezierLine, Stars } from "@react-three/drei";
import * as THREE from "three";
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
    moon: "#e8c884",
    rim: "#66aaff",
    nodes: {
      practice: "#b9d9ff",
      experience: "#66aaff",
      work: "#f0c75a",
      community: "#f08a42",
    },
  },
  light: {
    moon: "#ffd873",
    rim: "#ffb066",
    // Stars are a dark-mode-only motif site-wide (see docs/DESIGN_SYSTEM.md) —
    // light mode swaps to the same coral/apricot "shell" family the flat
    // field map uses in `:root[data-theme=light] .field-map`.
    nodes: {
      practice: "#efb2a8",
      experience: "#f8caac",
      work: "#f58581",
      community: "#e8c9bc",
    },
  },
} as const;

/** Mirrors CommitConstellation's four field-map clusters (roots/experience/
 * projects/community) — this scene is a compressed 3D preview of that map,
 * so every node routes to the same #field-map anchor it lives in. */
const NODES = [
  { id: "practice", label: "Practice", position: new THREE.Vector3(-1.5, 1.1, 2.15) },
  { id: "experience", label: "Experience", position: new THREE.Vector3(1.5, 1.35, 1.7) },
  { id: "work", label: "Work", position: new THREE.Vector3(0.25, -2.15, 2.75) },
  { id: "community", label: "Community", position: new THREE.Vector3(1.5, -1.65, 1.5) },
] as const;

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

function readableInk(hex: string) {
  const c = new THREE.Color(hex);
  const luminance = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return luminance > 0.62 ? "#101826" : "#fff8e8";
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

/** Builds a color map + a bump (height) map for the centerpiece sphere.
 * "moon" scatters real craters (dark recessed floor, bright raised rim) into
 * both maps; "sun" skips the bump entirely and just mottles the color map
 * with a few brighter plasma-like blotches — a moon has relief, a sun reads
 * as a flat-lit glow. */
function useCenterpieceTextures(mode: "moon" | "sun", baseColor: string) {
  return useMemo(() => {
    const width = 512;
    const height = 256;
    const rand = mulberry32(hashString(mode));

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

    if (mode === "moon") {
      for (let i = 0; i < 60; i++) {
        const x = rand() * width;
        const y = height * 0.1 + rand() * height * 0.8;
        const r = 5 + rand() * 24;

        const cGrad = cctx.createRadialGradient(x, y, 0, x, y, r);
        cGrad.addColorStop(0, "rgba(20,14,4,0.32)");
        cGrad.addColorStop(0.7, "rgba(20,14,4,0.14)");
        cGrad.addColorStop(0.82, "rgba(255,246,222,0.16)");
        cGrad.addColorStop(1, "rgba(0,0,0,0)");
        cctx.fillStyle = cGrad;
        cctx.beginPath();
        cctx.arc(x, y, r, 0, Math.PI * 2);
        cctx.fill();

        const bGrad = bctx.createRadialGradient(x, y, 0, x, y, r);
        bGrad.addColorStop(0, "rgba(0,0,0,0.6)");
        bGrad.addColorStop(0.68, "rgba(0,0,0,0.3)");
        bGrad.addColorStop(0.82, "rgba(255,255,255,0.65)");
        bGrad.addColorStop(1, "rgba(128,128,128,0)");
        bctx.fillStyle = bGrad;
        bctx.beginPath();
        bctx.arc(x, y, r, 0, Math.PI * 2);
        bctx.fill();
      }
      for (let i = 0; i < 320; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const r = 0.5 + rand() * 1.4;
        cctx.fillStyle = `rgba(20,14,4,${0.05 + rand() * 0.07})`;
        cctx.beginPath();
        cctx.arc(x, y, r, 0, Math.PI * 2);
        cctx.fill();
      }
    } else {
      for (let i = 0; i < 34; i++) {
        const x = rand() * width;
        const y = rand() * height;
        const r = 14 + rand() * 46;
        const grad = cctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, "rgba(255,250,220,0.30)");
        grad.addColorStop(1, "rgba(255,180,80,0)");
        cctx.fillStyle = grad;
        cctx.beginPath();
        cctx.arc(x, y, r, 0, Math.PI * 2);
        cctx.fill();
      }
    }

    const colorTexture = new THREE.CanvasTexture(colorCanvas);
    colorTexture.colorSpace = THREE.SRGBColorSpace;
    colorTexture.needsUpdate = true;

    const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
    bumpTexture.needsUpdate = true;

    return { colorTexture, bumpTexture };
  }, [mode, baseColor]);
}

function Centerpiece({ mode, color, rimColor, reduced }: { mode: "moon" | "sun"; color: string; rimColor: string; reduced: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const { colorTexture, bumpTexture } = useCenterpieceTextures(mode, color);

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
      <Glow color={color} scale={mode === "sun" ? 7.5 : 4.6} opacity={mode === "sun" ? 0.9 : 0.75} />
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.75, 96, 96]} />
        {mode === "moon" ? (
          <meshStandardMaterial
            map={colorTexture}
            bumpMap={bumpTexture}
            bumpScale={0.05}
            roughness={0.9}
            metalness={0.02}
            emissive={color}
            emissiveIntensity={0.05}
          />
        ) : (
          <meshStandardMaterial
            map={colorTexture}
            roughness={1}
            metalness={0}
            emissive={color}
            emissiveIntensity={1.5}
            toneMapped={false}
          />
        )}
      </mesh>
      <pointLight color={rimColor} position={[-4, -2, -2.5]} intensity={16} distance={10} />
    </group>
  );
}

/** A small texture-mapped "planet" — the label is baked straight onto its
 * surface rather than floating beside it as a UI pill. Billboarded to the
 * camera every frame so the text stays legible no matter how far the scene
 * gets dragged around. */
function usePlanetTexture(label: string, color: string) {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, size, size);

    const rand = mulberry32(hashString(label));
    for (let i = 0; i < 5; i++) {
      const x = rand() * size;
      const y = size * 0.2 + rand() * size * 0.6;
      const r = 16 + rand() * 30;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(0,0,0,0.14)");
      grad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const text = label.toUpperCase();
    // Deliberately tight: a word that spans the full canvas width wraps out
    // toward the sphere's limb, where curvature foreshortens it to near
    // invisibility even with a perfect billboard. Keeping it inside a narrow
    // central band means the whole word stays on the part of the surface
    // that's actually facing the camera.
    const maxWidth = size * 0.4;
    let fontSize = 46;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    const width = ctx.measureText(text).width;
    if (width > maxWidth) {
      fontSize = Math.floor(fontSize * (maxWidth / width));
      ctx.font = `700 ${fontSize}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    }
    ctx.fillStyle = readableInk(color);
    ctx.fillText(text, size / 2, size / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, [label, color]);
}

function OrbitNode({
  node,
  color,
  reduced,
}: {
  node: (typeof NODES)[number];
  color: string;
  reduced: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const groupRef = useRef<THREE.Group>(null);
  const planetRef = useRef<THREE.Mesh>(null);
  const texture = usePlanetTexture(node.label, color);
  const seed = useMemo(() => (node.id.charCodeAt(0) % 7) * 0.9, [node.id]);
  const radius = 0.46;

  useFrame(({ camera, clock }) => {
    if (groupRef.current && !reduced) {
      const bob = Math.sin(clock.elapsedTime * 0.7 + seed) * 0.08;
      groupRef.current.position.copy(node.position).add(new THREE.Vector3(0, bob, 0));
    }
    // Billboard the planet toward the camera so its baked-on label always
    // reads correctly. This has to be a per-planet lookAt, not a copy of the
    // camera's own quaternion (sprite-style) — these planets sit well off
    // the camera's central axis, so a shared orientation leaves the ones on
    // the sides staring past the camera at a grazing angle instead of
    // straight at it. three.js's SphereGeometry also puts UV u=0.5 (the
    // label's horizontal center) at local +X rather than local +Z, so
    // lookAt's default facing needs the same quarter-turn correction.
    if (planetRef.current) {
      planetRef.current.lookAt(camera.position);
      planetRef.current.rotateY(-Math.PI / 2);
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
      <Glow color={color} scale={hovered ? radius * 3.4 : radius * 2.4} opacity={0.6} />
      <mesh ref={planetRef} scale={hovered ? 1.12 : 1}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          map={texture}
          roughness={0.65}
          metalness={0.08}
          emissive={color}
          emissiveIntensity={0.35}
        />
      </mesh>
      <Html center distanceFactor={7} occlude={false}>
        <a
          href="#field-map"
          aria-label={`${node.label} — jump to the interactive field map`}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          className="pointer-events-auto block rounded-full focus-visible:outline-none"
          style={{
            width: 78,
            height: 78,
            boxShadow: hovered ? `0 0 0 2px color-mix(in srgb, ${color} 75%, transparent)` : "none",
            transition: "box-shadow 0.15s ease",
          }}
        >
          <span className="sr-only">{node.label} — jump to the interactive field map</span>
        </a>
      </Html>
    </group>
  );
}

function Rig({ reduced }: { reduced: boolean }) {
  const { invalidate } = useThree();
  return (
    <OrbitControls
      enableZoom={false}
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
  const mode = resolvedTheme === "light" ? "sun" : "moon";
  const wrapperRef = useRef<HTMLDivElement>(null);

  // OrbitControls swallows the wheel event even with enableZoom off — with
  // the scene now filling the full-viewport hero, that would trap anyone
  // trying to scroll past it with a mouse. Forward the delta to the page
  // manually and stop it before three.js's own listener sees it. This has to
  // be a native, non-passive listener: React's synthetic onWheel is passive
  // by default, so preventDefault() inside it is silently ignored.
  useEffect(() => {
    const node = wrapperRef.current;
    if (!node) return;
    function onWheel(e: WheelEvent) {
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
        camera={{ position: [0, 0, 13.5], fov: 40 }}
        frameloop={reduced ? "demand" : "always"}
        style={{ touchAction: "pan-y" }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 3.5, 6]} intensity={26} distance={16} color={palette.moon} />
        {mode === "moon" ? (
          <Stars radius={20} depth={28} count={reduced ? 250 : 700} factor={1.6} saturation={0} fade speed={reduced ? 0 : 0.6} />
        ) : null}
        <Centerpiece mode={mode} color={palette.moon} rimColor={palette.rim} reduced={reduced} />
        {NODES.map((node) => (
          <OrbitNode key={node.id} node={node} color={palette.nodes[node.id]} reduced={reduced} />
        ))}
        <Rig reduced={reduced} />
      </Canvas>
    </div>
  );
}
