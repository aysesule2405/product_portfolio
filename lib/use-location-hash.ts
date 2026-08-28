"use client";

import type { MouseEvent } from "react";
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("hashchange", callback);
  window.addEventListener("popstate", callback);
  return () => {
    window.removeEventListener("hashchange", callback);
    window.removeEventListener("popstate", callback);
  };
}

function getSnapshot() {
  return window.location.hash;
}

function getServerSnapshot() {
  return "";
}

/** Hydration-safe access to the current URL fragment for hash-aware editor navigation. */
export function useLocationHash() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Same-page hash links (fieldmap.md, contact.md, every visual-practice/ entry) need to be
 * handled by hand: Next's <Link> mishandles a second same-pathname hash navigation in a
 * row, concatenating fragments instead of replacing them (e.g. "#ceramics#playground").
 * A cross-route hash link is left alone since that first hop navigates correctly.
 */
export function handleHashLinkClick(event: MouseEvent<HTMLAnchorElement>, href: string, pathname: string) {
  const [linkPath, fragment] = href.split("#");
  if (!fragment || pathname !== linkPath) return;
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

  const el = document.getElementById(fragment);
  if (!el) return;
  event.preventDefault();
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
  history.replaceState(null, "", `#${fragment}`);
  // replaceState doesn't fire hashchange, so nudge useLocationHash to re-read the URL —
  // otherwise nav highlighting keeps showing whichever entry was active before this click.
  window.dispatchEvent(new Event("hashchange"));
}
