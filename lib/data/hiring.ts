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
    label: "Product Design",
    description: "Campus systems, design systems, emotional UX — end-to-end product ownership.",
    categories: ["design-systems", "campus-systems", "emotional-ux"],
  },
  {
    id: "ai-ml",
    label: "AI & ML",
    description: "AI trust and data clarity — retrieval, classification, model behavior made legible.",
    categories: ["ai-trust", "data-clarity"],
  },
  {
    id: "full-stack",
    label: "Full-Stack Engineering",
    description: "Learning workflows and creative tools — shipped, full-stack, production code.",
    categories: ["learning-workflows", "creative-tools"],
  },
];

export function getHiringLens(id: string | null | undefined): HiringLens | undefined {
  return hiringLenses.find((lens) => lens.id === id);
}
