"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { StatusBar } from "@/components/shell/StatusBar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { MotionLab } from "@/components/shell/MotionLab";
import { CelestialBackdrop } from "@/components/celestial/CelestialBackdrop";
import { OutlineProvider } from "@/lib/outline-context";
import { NavRevealProvider, useNavReveal } from "@/lib/nav-reveal-context";

function EditorShellInner({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { coverActive, revealNav } = useNavReveal();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [motionLabOpen, setMotionLabOpen] = useState(false);
  const sidebarPreferenceLoaded = useRef(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("clarity-sidebar-collapsed");
    const frame = window.requestAnimationFrame(() => {
      if (saved) {
        setSidebarCollapsed(saved === "true");
      }
      sidebarPreferenceLoaded.current = true;
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!sidebarPreferenceLoaded.current) return;
    window.localStorage.setItem("clarity-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMotionLabOpen(false);
        setSidebarOpen(false);
        setPaletteOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        revealNav();
        setSidebarCollapsed((v) => !v);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setMotionLabOpen(false);
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [revealNav]);

  useEffect(() => {
    if (!sidebarOpen && !paletteOpen && !motionLabOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [sidebarOpen, paletteOpen, motionLabOpen]);

  function openSidebar() {
    revealNav();
    setPaletteOpen(false);
    setMotionLabOpen(false);
    setSidebarOpen(true);
  }

  function toggleCollapsed() {
    revealNav();
    setSidebarCollapsed((v) => !v);
  }

  function openPalette() {
    setSidebarOpen(false);
    setMotionLabOpen(false);
    setPaletteOpen(true);
  }

  return (
    <OutlineProvider>
      <div className="relative isolate flex min-h-screen w-full">
        <CelestialBackdrop />
        <Sidebar
          mobileOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          hidden={coverActive}
          onCloseMobile={() => setSidebarOpen(false)}
          onToggleCollapsed={toggleCollapsed}
        />
        <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col">
          <TopBar onOpenSidebar={openSidebar} onOpenPalette={openPalette} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <StatusBar />
        </div>
        <AnimatePresence>
          {paletteOpen ? (
            <CommandPalette
              onClose={() => setPaletteOpen(false)}
              onOpenMotionLab={() => {
                setPaletteOpen(false);
                setMotionLabOpen(true);
              }}
            />
          ) : null}
        </AnimatePresence>
        <AnimatePresence>
          {motionLabOpen ? <MotionLab onClose={() => setMotionLabOpen(false)} /> : null}
        </AnimatePresence>
      </div>
    </OutlineProvider>
  );
}

export function EditorShell({ children }: { children: React.ReactNode }) {
  return (
    <NavRevealProvider>
      <EditorShellInner>{children}</EditorShellInner>
    </NavRevealProvider>
  );
}
