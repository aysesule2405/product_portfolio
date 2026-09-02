"use client";

import { Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import clsx from "clsx";
import type { TimelineLane } from "@/lib/types";
import type { FieldMapSelection } from "@/components/home/FieldMapNav";

const HeroOrbitScene = dynamic(
  () => import("./HeroOrbitScene").then((mod) => mod.HeroOrbitScene),
  {
    ssr: false,
    loading: () => <OrbitPlaceholder />,
  }
);

function OrbitPlaceholder() {
  return (
    <div aria-hidden className="flex h-full w-full items-center justify-center">
      <div
        className="h-24 w-24 animate-pulse rounded-full"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--accent) 45%, transparent), transparent 70%)",
        }}
      />
    </div>
  );
}

/** WebGL context creation can fail (old GPUs, some sandboxed browsers, driver
 * blocklists) — react-three-fiber throws when it does. A class boundary is
 * the only way to catch a render-time throw from a descendant. */
class OrbitErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return <OrbitPlaceholder />;
    return this.props.children;
  }
}

export function HeroOrbit({
  className,
  selection,
  onHoverChange,
}: {
  className?: string;
  selection: FieldMapSelection;
  onHoverChange: (id: TimelineLane, hovered: boolean) => void;
}) {
  return (
    <div className={clsx("h-full w-full", className)}>
      <OrbitErrorBoundary>
        <HeroOrbitScene selection={selection} onHoverChange={onHoverChange} />
      </OrbitErrorBoundary>
    </div>
  );
}
