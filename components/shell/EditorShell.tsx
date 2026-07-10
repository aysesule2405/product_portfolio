"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { StatusBar } from "@/components/shell/StatusBar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { CelestialBackdrop } from "@/components/celestial/CelestialBackdrop";
import { OutlineProvider } from "@/lib/outline-context";

export function EditorShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
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
        setPaletteOpen((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setSidebarCollapsed((v) => !v);
      }
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setSidebarOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <OutlineProvider>
      <div className="relative isolate flex min-h-screen w-full">
        <CelestialBackdrop />
        <Sidebar
          mobileOpen={sidebarOpen}
          collapsed={sidebarCollapsed}
          onCloseMobile={() => setSidebarOpen(false)}
          onToggleCollapsed={() => setSidebarCollapsed((v) => !v)}
        />
        <div className="relative z-10 flex min-h-screen min-w-0 flex-1 flex-col">
          <TopBar onOpenSidebar={() => setSidebarOpen(true)} onOpenPalette={() => setPaletteOpen(true)} />
          <main id="main" className="flex-1">
            {children}
          </main>
          <StatusBar />
        </div>
        <AnimatePresence>
          {paletteOpen ? <CommandPalette onClose={() => setPaletteOpen(false)} /> : null}
        </AnimatePresence>
      </div>
    </OutlineProvider>
  );
}
