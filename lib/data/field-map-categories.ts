import type { TimelineLane } from "@/lib/types";

/** The single source of truth for the site's four top-level categories —
 * consumed by both the home hero's 3D field map (HeroOrbitScene / FieldMapNav)
 * and the 2D CommitConstellation visualization. `id` reuses TimelineLane
 * rather than inventing a second identifier scheme, since TimelineNode.lane
 * already keys every timeline entry against these same four values. Layout
 * data specific to one presentation (CommitConstellation's cx/cy/spread,
 * HeroOrbitScene's 3D positions) stays local to that component — only
 * identity (label, description, destination, color) lives here. */
export interface FieldMapCategory {
  id: TimelineLane;
  label: string;
  /** A one-line descriptor for compact contexts (the hero's field map). */
  shortDescription: string;
  /** The longer, narrative blurb CommitConstellation shows per cluster. */
  blurb: string;
  href: string;
  /** Dark-mode (moon/crystal) tint. */
  colorDark: string;
  /** Light-mode (sun/prism) tint. Deepened in Phase 2C — the original
   * pastel values washed out against the cloud background; a satellite's
   * own GlassShell back-face pass darkens this further for internal
   * contrast, so this value only needs to hold up as the *front* tint. */
  colorLight: string;
}

export const FIELD_MAP_CATEGORIES: FieldMapCategory[] = [
  {
    id: "roots",
    label: "Practice",
    shortDescription: "Visual design and creative exploration",
    blurb: "Ceramics, painting, and design — where the eye training started, long before product work.",
    href: "/visual-practice",
    // deep coral -> soft coral
    colorDark: "#9c5240",
    colorLight: "#d18e73",
  },
  {
    id: "experience",
    label: "Experience",
    shortDescription: "Product, engineering, and collaborative roles",
    blurb: "Two internships and a campus IT role — systems, data, and design put into production.",
    href: "/#field-map",
    // smoked indigo (with a controlled-violet undertone) -> lavender
    colorDark: "#4f4a7a",
    colorLight: "#9686bd",
  },
  {
    id: "projects",
    label: "Work",
    shortDescription: "Software, product design, and data/AI projects",
    blurb: "Seven shipped projects — AI tools, learning platforms, campus systems, and more.",
    href: "/work",
    // antique gold -> pale amber
    colorDark: "#a68a4a",
    colorLight: "#d1a94e",
  },
  {
    id: "community",
    label: "Community",
    shortDescription: "Leadership, mentorship, and creative communities",
    blurb: "Leading ACM-Women, GDSC, and Design Club — mentoring 70+ students along the way.",
    href: "/#field-map",
    // muted cyan -> powder blue
    colorDark: "#3f7a82",
    colorLight: "#6fa0c2",
  },
];

export function getFieldMapCategory(id: TimelineLane): FieldMapCategory {
  const category = FIELD_MAP_CATEGORIES.find((c) => c.id === id);
  if (!category) throw new Error(`Unknown field map category: ${id}`);
  return category;
}
