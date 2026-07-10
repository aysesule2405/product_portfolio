"use client";

import { usePageOutline, OutlineSection } from "@/lib/outline-context";

/** Registers this case study's sections with the Sidebar's Outline panel.
 * Rendered as a client-component leaf inside the (server) case study page,
 * since registering with context requires an effect. */
export function CaseStudyOutlineRegistrar({ sections }: { sections: OutlineSection[] }) {
  usePageOutline(sections);
  return null;
}
