import { ProblemCategory, ProjectImage } from "@/lib/types";

const GH_PAGES = "https://aysesule2405.github.io/ayse-sule-ekiz-portfolio";

export interface GalleryPiece {
  title: string;
  caption: string;
  pillLabel: string;
  image?: ProjectImage;
}

export interface VisualWork {
  id: string;
  medium: string;
  title: string;
  featuredPiece: string;
  principle: string;
  /** The one product-design skill this medium trains — the explicit bridge back to
   *  product work, shown as its own callout rather than left implicit in `principle`. */
  skill: string;
  lesson: string;
  category: ProblemCategory;
  texture: "paper" | "clay" | "charcoal" | "playground";
  date: string;
  dateLabel: string;
  fieldNumber: string;
  galleryUrl: string;
  /** Screenshots (playground) read better wide; photographed art reads better tall. */
  pieceAspect?: "portrait" | "landscape";
  image?: ProjectImage;
  pieces: GalleryPiece[];
}

export const visualWork: VisualWork[] = [
  {
    id: "graphic-design",
    medium: "Graphic Design & Digital Art",
    title: "Typography and poster design",
    featuredPiece: "Lilith — Symmetrical Balance Poster",
    principle: "Hierarchy, rhythm, visual storytelling.",
    skill: "Hierarchy",
    lesson:
      "Posters have one shot to tell you what matters first. That's the same job as a dashboard's header, or an onboarding screen's first sentence — designing a poster is practice for designing attention. The AP portfolio series on Turkish food traditions (yaprak sarması, made stage by stage) was the first time I translated a lived, cultural process into deliberate composition and color.",
    category: "creative-tools",
    texture: "paper",
    date: "2022-09",
    dateLabel: "2022–2023",
    fieldNumber: "VP-01",
    galleryUrl: `${GH_PAGES}/graphicdesign.html`,
    image: {
      src: "/images/Lilith - Symetrical Balance Poster.jpg",
      alt: "Lilith — Symmetrical Balance Poster, stained-glass inspired central figure",
    },
    pieces: [
      {
        title: "Lilith",
        caption: "Symmetrical, stained-glass-inspired poster exploring duality and divine femininity.",
        pillLabel: "Poster · Balance",
        image: {
          src: `${GH_PAGES}/images/dijital_art/Lilith%20-%20Symetrical%20Balance%20Poster.jpg`,
          alt: "Lilith, symmetrical balance poster",
        },
      },
      {
        title: "The Willow Maid",
        caption: "Organic, branching pattern poster echoing a folk melody's natural setting.",
        pillLabel: "Poster · Pattern",
        image: {
          src: `${GH_PAGES}/images/dijital_art/The%20Willow%20Maid%20-%20Patern%20Poster.jpg`,
          alt: "The Willow Maid, pattern poster",
        },
      },
      {
        title: "Monocro No Kiss",
        caption: "Hierarchy-driven poster using strong structure, typography, and focal points.",
        pillLabel: "Poster · Hierarchy",
        image: {
          src: `${GH_PAGES}/images/dijital_art/Monocro%20No%20Kiss%20-%20Hierarchy%20Poster.jpg`,
          alt: "Monocro No Kiss, hierarchy poster",
        },
      },
      {
        title: "Chambers",
        caption: "Emphasis poster built around a heart as both physical space and emotional chamber.",
        pillLabel: "Poster · Emphasis",
        image: {
          src: `${GH_PAGES}/images/dijital_art/Chambers%20-%20Emphasis%20Poster.jpg`,
          alt: "Chambers, emphasis poster",
        },
      },
    ],
  },
  {
    id: "ceramics",
    medium: "Sculpting & Ceramics",
    title: "Working the wheel",
    featuredPiece: "Head Figure, metallic glaze",
    principle: "Material, patience, form, iteration.",
    skill: "Material feedback & iteration",
    lesson:
      "Clay is the slowest, most honest medium I know — it cannot be rushed and shows every hesitation. The Giant Woman figure, built at roughly 50cm and inspired by Chiparus's Cleopatra, needed real structural planning to stay upright before it ever got a glaze. It's the most direct feedback loop I've worked in, and it's made me more patient with the slower parts of product iteration.",
    category: "community-learning",
    texture: "clay",
    date: "2021-09",
    dateLabel: "2019–2023",
    fieldNumber: "VP-02",
    galleryUrl: `${GH_PAGES}/ceramics.html`,
    image: {
      src: "/images/head_figure_0.jpg",
      alt: "Ceramic head figure with a reflective metallic glaze",
    },
    pieces: [
      {
        title: "Giant Woman Figure",
        caption: "Ivy-glazed reclining figure inspired by Chiparus's Cleopatra, ~50cm tall.",
        pillLabel: "Ceramics · Figure",
        image: {
          src: `${GH_PAGES}/images/ceramics/giant_woman_figure_2.jpg`,
          alt: "Giant Woman Figure, glazed",
        },
      },
      {
        title: "Fox Figure",
        caption: "Glazed fox sculpture — an alert, mid-motion study in gesture and personality.",
        pillLabel: "Ceramics · Figure",
        image: {
          src: `${GH_PAGES}/images/ceramics/fox_figure_4.jpg`,
          alt: "Fox Figure, glazed",
        },
      },
      {
        title: "Flexing Woman Figure",
        caption: "Scale study built from Ayse's own body, exploring strength over an idealized form.",
        pillLabel: "Ceramics · Figure",
        image: {
          src: `${GH_PAGES}/images/ceramics/woman_figure_2.jpg`,
          alt: "Flexing Woman Figure, glazed",
        },
      },
      {
        title: "Head Figure",
        caption: "Metallic-glazed head exploring facial planes and reflected light.",
        pillLabel: "Ceramics · Metal glaze",
        image: {
          src: `${GH_PAGES}/images/ceramics/head_figure_0.jpg`,
          alt: "Head Figure, metallic glaze",
        },
      },
    ],
  },
  {
    id: "painting-charcoal",
    medium: "Painting & Charcoal",
    title: "Light, contrast, and atmosphere",
    featuredPiece: "Girl & Moon (oil on canvas)",
    principle: "Light, contrast, emotional atmosphere.",
    skill: "Atmosphere & focal control",
    lesson:
      "Girl & Moon was painted in one sitting on an actual full-moon night in 2023, after watching The Tale of Princess Kaguya — cool lunar light against warm skin, a girl and the moon mirroring each other's lonely glow. Charcoal work later stripped that same instinct down further: think in light and shadow before you decide what anything looks like in detail. I use that instinct when deciding what an interface should emphasize before I decide what it should contain.",
    category: "emotional-ux",
    texture: "charcoal",
    date: "2023-04",
    dateLabel: "2023",
    fieldNumber: "VP-03",
    galleryUrl: `${GH_PAGES}/painting.html`,
    image: {
      src: "/images/girl&moon.jpg",
      alt: "Girl & Moon, oil on canvas",
    },
    pieces: [
      {
        title: "Girl & Moon",
        caption: "Oil on canvas, painted in one sitting on an actual full-moon night.",
        pillLabel: "Oil painting",
        image: {
          src: `${GH_PAGES}/images/paintings/girl%26moon.jpg`,
          alt: "Girl & Moon, oil on canvas",
        },
      },
      {
        title: "Night Sea",
        caption: "Acrylic moonlit seascape — one gold streak of light cutting a dark, luminous sky.",
        pillLabel: "Acrylic painting",
        image: {
          src: `${GH_PAGES}/images/paintings/night%20sea_1.jpg`,
          alt: "Night Sea, acrylic painting",
        },
      },
      {
        title: "The Hike",
        caption: "Acrylic landscape capturing a glacial lake framed by ancient trees and snow peaks.",
        pillLabel: "Acrylic landscape",
        image: {
          src: `${GH_PAGES}/images/paintings/the%20hike.JPG`,
          alt: "The Hike, acrylic landscape",
        },
      },
      {
        title: "Venus After Botticelli",
        caption: "Colored pencil reinterpretation of the Birth of Venus, bold outlines and flat color.",
        pillLabel: "Colored pencil",
        image: {
          src: `${GH_PAGES}/images/paintings/venus_1.jpg`,
          alt: "Venus After Botticelli, colored pencil",
        },
      },
    ],
  },
  {
    id: "playground",
    medium: "Playable Experiments",
    title: "The Moon & Tide Arcade",
    featuredPiece: "Tidepool Pair, Star Stitch, Moonlit Pixels",
    principle: "Small games shaped by sea, sky, and curiosity.",
    skill: "Playful interaction prototyping",
    lesson:
      "A shell-pairing memory game, a constellation-stitching challenge, and a tiny pixel painting studio — made to give visitors something to do, not just something to scroll past.",
    category: "learning-workflows",
    texture: "playground",
    date: "2025-09",
    dateLabel: "Ongoing",
    fieldNumber: "VP-04",
    galleryUrl: `${GH_PAGES}/playground.html`,
    pieceAspect: "landscape",
    image: {
      src: "/images/playground.png",
      alt: "The Moon and Tide Arcade interactive playground",
    },
    pieces: [
      {
        title: "Tidepool Pair",
        caption: "A shell-matching memory game set at low tide.",
        pillLabel: "Memory · Game",
      },
      {
        title: "Star Stitch",
        caption: "Wake each star in sequence to draw a new shoreline constellation.",
        pillLabel: "Celestial · Game",
      },
      {
        title: "Moonlit Pixels",
        caption: "Paint and download a tiny moonlit seascape one pixel at a time.",
        pillLabel: "Pixel art · Toy",
      },
    ],
  },
];
