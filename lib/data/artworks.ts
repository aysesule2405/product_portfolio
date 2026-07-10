import { ProblemCategory, ProjectImage } from "@/lib/types";

const GH_PAGES = "https://aysesule2405.github.io/ayse-sule-ekiz-portfolio";

export interface NotableArtwork {
  id: string;
  title: string;
  medium: string;
  detail: string;
  category: ProblemCategory;
  date: string;
  dateLabel: string;
  href: string;
  image: ProjectImage;
}

/** A handful of standout individual pieces (beyond the four medium-level
 * cards on Visual Practice) that give the field map's "roots" cluster more
 * real, varied stars instead of just one per medium. */
export const notableArtworks: NotableArtwork[] = [
  {
    id: "flexing-woman-figure",
    title: "Flexing Woman Figure",
    medium: "Ceramics",
    detail:
      "Brown-clay scale study built from Ayse's own body as reference, exploring definition and confidence rather than an idealized, passive form.",
    category: "community-learning",
    date: "2022-03",
    dateLabel: "High school, 2019–2023",
    href: "/visual-practice#ceramics",
    image: {
      src: `${GH_PAGES}/images/ceramics/woman_figure_2.jpg`,
      alt: "Flexing Woman ceramic figure, glazed",
    },
  },
  {
    id: "willow-maid",
    title: "The Willow Maid — Pattern Poster",
    medium: "Graphic Design & Digital Art",
    detail:
      "Stained-glass-inspired poster study in organic, branching pattern, part of the song-and-design-principle poster series.",
    category: "creative-tools",
    date: "2022-11",
    dateLabel: "High school, 2022–2023",
    href: "/visual-practice#graphic-design",
    image: {
      src: `${GH_PAGES}/images/dijital_art/The%20Willow%20Maid%20-%20Patern%20Poster.jpg`,
      alt: "The Willow Maid, pattern poster",
    },
  },
  {
    id: "night-sea",
    title: "Night Sea",
    medium: "Painting & Charcoal",
    detail:
      "Acrylic moonlit seascape — a single gold streak of moonlight cutting across a dark, luminous cyan sky.",
    category: "emotional-ux",
    date: "2023-08",
    dateLabel: "2023",
    href: "/visual-practice#painting-charcoal",
    image: {
      src: `${GH_PAGES}/images/paintings/night%20sea_1.jpg`,
      alt: "Night Sea, acrylic painting",
    },
  },
];
