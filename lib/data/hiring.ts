import { ProblemCategory } from "@/lib/types";

export interface HiringLens {
  id: string;
  label: string;
  description: string;
  categories: ProblemCategory[];
}

export const hiringLenses: HiringLens[] = [
  {
    id: "product-design",
    label: "Product & UX Design",
    description:
      "Product strategy, interface design, systems thinking, and emotionally aware experiences.",
    categories: ["design-systems", "campus-systems", "emotional-ux", "ai-trust"],
  },
  {
    id: "full-stack",
    label: "Software & Full-Stack",
    description:
      "Frontend craft, full-stack implementation, data clarity, and production-minded engineering.",
    categories: [
      "learning-workflows",
      "data-clarity",
      "campus-systems",
      "creative-tools",
      "ai-trust",
    ],
  },
  {
    id: "creative-technology",
    label: "Creative Technology & Brand",
    description:
      "Visual craft, interactive storytelling, creative tools, and cohesive brand experiences.",
    categories: ["creative-tools", "emotional-ux", "design-systems"],
  },
];

export function getHiringLens(id: string | null | undefined): HiringLens | undefined {
  return hiringLenses.find((lens) => lens.id === id);
}
