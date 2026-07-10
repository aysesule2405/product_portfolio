import { ProblemCategory } from "@/lib/types";

export interface ExperienceRole {
  id: string;
  org: string;
  role: string;
  dates: string;
  detail: string;
  category: ProblemCategory;
  date: string;
  dateLabel: string;
  href?: string;
}

export const experienceRoles: ExperienceRole[] = [
  {
    id: "koc-university",
    org: "Koç University",
    role: "AI Research Intern, Pipeline Optimization",
    dates: "Jun 2022 – May 2023",
    detail:
      "Diagnosed and optimized Python data pipelines for a 2D-to-3D deep learning reconstruction system, cutting per-iteration compute overhead by about 30% and building diagnostic visualizations for graduate researchers.",
    category: "ai-trust",
    date: "2022-06",
    dateLabel: "Jun 2022 – May 2023",
  },
  {
    id: "forgemind",
    org: "ForgeMind",
    role: "Software Engineering Intern, Systems Performance & Data",
    dates: "Feb 2025 – Jul 2025",
    detail:
      "Profiled production Python services with py-spy and flame-graph analysis, cutting dashboard render latency by 40%, and built resilient ETL pipelines translating ambiguous product questions into data models and KPIs.",
    category: "data-clarity",
    date: "2025-02",
    dateLabel: "Feb 2025 – Jul 2025",
  },
  {
    id: "nau-it-systems",
    org: "North American University",
    role: "IT & Systems Associate",
    dates: "Sep 2024 – Present",
    detail:
      "Shipped and maintained the NAU Athletics and student portal, automated Python reporting workflows that eliminated 60% of manual processing, and built the reusable Figma design system behind it.",
    category: "campus-systems",
    date: "2024-09",
    dateLabel: "Sep 2024 – Present",
    href: "/work/nau-athletics-student-portal",
  },
];
