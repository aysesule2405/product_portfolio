"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";
import { useReducedMotion } from "@/lib/motion";
import type { TimelineLane } from "@/lib/types";
import { FIELD_MAP_CATEGORIES } from "@/lib/data/field-map-categories";
import type { FieldMapSelection } from "@/components/home/FieldMapNav";
import { CelestialBody } from "./orbit/CelestialBody";
import { SatelliteNode } from "./orbit/SatelliteNode";
import { CameraRig } from "./orbit/CameraRig";
import { AtmosphereDust } from "./orbit/procedural";
import { SceneLightingRig } from "./orbit/glass";
import { useThemeMorph } from "./orbit/useThemeMorph";
import { useQualityTier, DPR_CAP, DUST_COUNT, STAR_COUNT } from "./orbit/quality";
import {
  SATELLITE_POSITIONS,
  MOBILE_SATELLITE_POSITIONS,
  MOBILE_BREAKPOINT_PX,
  MOBILE_CENTERPIECE_SCALE,
  DESKTOP_CAMERA_Z,
  MOBILE_CAMERA_Z,
  CATEGORY_ORDER,
} from "./orbit/config";

/** Tracks whether the hero is scrolled into view, so the render loop can
 * fully stop (frameloop="demand") rather than animate off-screen — this
 * covers the "pause when outside the viewport" requirement; the scroll-
 * departure sequence itself (centerpiece receding, satellites separating,
 * constellation lines fading) is Phase 3 work layered on top of this same
 * observer, not a replacement for it. */
function useInHeroView(node: HTMLElement | null) {
  const [inView, setInView] = useState(true);
  useEffect(() => {
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);
  return inView;
}

function useDocumentVisible() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    function onVisibilityChange() {
      setVisible(document.visibilityState === "visible");
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  return visible;
}

/** Drives the mobile-specific composition (see MOBILE_SATELLITE_POSITIONS /
 * MOBILE_CENTERPIECE_SCALE / MOBILE_CAMERA_Z in config.ts) — a real
 * viewport-width switch, not the desktop composition uniformly scaled
 * down, since a uniform shrink was what produced the "centerpiece still
 * dominates, satellites still crowd it" mobile result flagged in review. */
function useIsCompactViewport() {
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX}px)`);
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return compact;
}

export function HeroOrbitScene({
  selection,
  onHoverChange,
}: {
  selection: FieldMapSelection;
  onHoverChange: (id: TimelineLane, hovered: boolean) => void;
}) {
  const reduced = useReducedMotion();
  const { theme } = useThemeMorph();
  const qualityTier = useQualityTier();
  const [wrapperNode, setWrapperNode] = useState<HTMLDivElement | null>(null);
  const inView = useInHeroView(wrapperNode);
  const documentVisible = useDocumentVisible();
  const compact = useIsCompactViewport();

  const frameloop = reduced || !inView || !documentVisible ? "demand" : "always";
  const satellitePositions = compact ? MOBILE_SATELLITE_POSITIONS : SATELLITE_POSITIONS;
  const cameraZ = compact ? MOBILE_CAMERA_Z : DESKTOP_CAMERA_Z;

  // A plain wheel/scroll should scroll the page — with the scene filling the
  // full-viewport hero, letting the canvas eat every wheel event would trap
  // anyone trying to scroll past it. There's no in-canvas zoom gesture left
  // to preserve (OrbitControls is gone — see CameraRig), so every wheel
  // event forwards to the page unconditionally. Has to be a native,
  // non-passive listener: React's synthetic onWheel is passive by default,
  // so preventDefault() inside it is silently ignored.
  useEffect(() => {
    if (!wrapperNode) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      window.scrollBy({ top: e.deltaY, behavior: "auto" });
    }
    wrapperNode.addEventListener("wheel", onWheel, { passive: false });
    return () => wrapperNode.removeEventListener("wheel", onWheel);
  }, [wrapperNode]);

  return (
    <div ref={setWrapperNode} className="h-full w-full">
      <Canvas
        dpr={[1, DPR_CAP[qualityTier]]}
        gl={{ alpha: true, antialias: true }}
        camera={{ position: [0, 0, cameraZ], fov: 40 }}
        frameloop={frameloop}
        style={{ touchAction: "pan-y" }}
        aria-hidden
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.15;
        }}
      >
        <SceneLightingRig theme={theme} />
        {theme === "dark" ? (
          <Stars radius={20} depth={28} count={reduced ? 200 : STAR_COUNT[qualityTier]} factor={1.6} saturation={0} fade speed={reduced ? 0 : 0.6} />
        ) : null}
        <AtmosphereDust
          color={theme === "dark" ? "#bcd4ff" : "#fff3d6"}
          seed={`dust-${theme}`}
          size={theme === "dark" ? 0.1 : 0.09}
          opacity={theme === "dark" ? 0.55 : 0.4}
          count={DUST_COUNT[qualityTier]}
          reduced={reduced}
        />
        <Suspense fallback={null}>
          <group scale={compact ? MOBILE_CENTERPIECE_SCALE : 1}>
            <CelestialBody theme={theme} reduced={reduced} />
          </group>
          {CATEGORY_ORDER.map((id, index) => {
            const category = FIELD_MAP_CATEGORIES.find((c) => c.id === id)!;
            return (
              <SatelliteNode
                key={id}
                category={category}
                theme={theme}
                reduced={reduced}
                index={index}
                position={satellitePositions[id]}
                isHovered={selection.hoveredId === id}
                isActive={selection.activeId === id}
                onHoverChange={(hovered) => onHoverChange(id, hovered)}
              />
            );
          })}
        </Suspense>
        <CameraRig />
      </Canvas>
    </div>
  );
}
