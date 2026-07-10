import { CSSProperties } from "react";
import { ProblemCategory } from "@/lib/types";

export function categoryColorVar(category: ProblemCategory): string {
  return `var(--cat-${category})`;
}

/** Sets the shared --cat-color custom property so .cat-tint-* utility
 * classes (defined in globals.css) resolve to this category's hue. */
export function categoryStyle(category: ProblemCategory): CSSProperties {
  return { ["--cat-color" as string]: categoryColorVar(category) } as CSSProperties;
}
