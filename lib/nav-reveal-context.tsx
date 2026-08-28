"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { usePathname } from "next/navigation";

interface NavRevealContextValue {
  /** True while the homepage's full-screen moon/sun cover is still the thing
   * to look at — the Sidebar stays closed so it doesn't compete with it. */
  coverActive: boolean;
  revealNav: () => void;
}

const NavRevealContext = createContext<NavRevealContextValue | null>(null);

/** Only the homepage has a cover screen to scroll past; every other route
 * starts with the nav already revealed. Landing on "/" again (including via
 * client-side nav) replays the reveal rather than remembering a past visit —
 * it's a per-visit cinematic beat, not an onboarding flag. */
export function NavRevealProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [coverActive, setCoverActive] = useState(pathname === "/");
  const [prevPathname, setPrevPathname] = useState(pathname);

  // Adjusting state during render (not in an effect) is the same pattern
  // CommitConstellation uses to react to a prop change without an extra
  // render pass.
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setCoverActive(pathname === "/");
  }

  const revealNav = useCallback(() => setCoverActive(false), []);

  return (
    <NavRevealContext.Provider value={{ coverActive, revealNav }}>
      {children}
    </NavRevealContext.Provider>
  );
}

export function useNavReveal(): NavRevealContextValue {
  const ctx = useContext(NavRevealContext);
  if (!ctx) throw new Error("useNavReveal must be used within NavRevealProvider");
  return ctx;
}
