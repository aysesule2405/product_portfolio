"use client";

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
