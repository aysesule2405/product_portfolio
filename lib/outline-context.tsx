"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface OutlineSection {
  id: string;
  label: string;
}

interface OutlineContextValue {
  sections: OutlineSection[];
  activeId: string | null;
  setSections: (sections: OutlineSection[]) => void;
}

const OutlineContext = createContext<OutlineContextValue | null>(null);

/** Mirrors an editor's "Outline" panel: whichever page is open registers its
 * own section list here, and this provider tracks which section is
 * currently in view — the Sidebar renders whatever is registered, the same
 * way VS Code's Outline view reflects whatever file is open. */
export function OutlineProvider({ children }: { children: React.ReactNode }) {
  const [sections, setSectionsState] = useState<OutlineSection[]>([]);
  const [rawActiveId, setActiveId] = useState<string | null>(null);
  // Derived rather than reset-in-effect: once sections are cleared, there's
  // nothing to be "active", regardless of whatever the observer last saw.
  const activeId = sections.length > 0 ? rawActiveId : null;

  const setSections = (next: OutlineSection[]) => {
    setSectionsState((prev) => {
      const same =
        prev.length === next.length && prev.every((s, i) => s.id === next[i]?.id);
      return same ? prev : next;
    });
  };

  useEffect(() => {
    if (sections.length === 0) return;

    const elements = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topMost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        setActiveId(topMost.target.id);
      },
      { rootMargin: "-15% 0px -70% 0px", threshold: [0, 1] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const value = useMemo(
    () => ({ sections, activeId, setSections }),
    [sections, activeId]
  );

  return <OutlineContext.Provider value={value}>{children}</OutlineContext.Provider>;
}

export function useOutline(): OutlineContextValue {
  const ctx = useContext(OutlineContext);
  if (!ctx) throw new Error("useOutline must be used within OutlineProvider");
  return ctx;
}

/** Called by a page to register its own outline; clears on unmount so the
 * Sidebar doesn't keep showing a stale outline after navigating away. */
export function usePageOutline(sections: OutlineSection[]) {
  const { setSections } = useOutline();
  const key = sections.map((s) => s.id).join("|");

  useEffect(() => {
    setSections(sections);
    return () => setSections([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
