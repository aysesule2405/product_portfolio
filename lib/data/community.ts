export interface CommunityRole {
  id: string;
  org: string;
  role: string;
  dates: string;
  detail: string;
  date: string;
  dateLabel: string;
}

export const communityRoles: CommunityRole[] = [
  {
    id: "acm-women",
    org: "ACM-Women",
    role: "President",
    dates: "2025 – Present",
    detail:
      "Ran technical workshops on data science, applied AI, and CS fundamentals; mentored 50+ students on skill-building and career strategy; organized hackathon participation and outreach.",
    date: "2025-01",
    dateLabel: "2025 – Present",
  },
  {
    id: "gdsc",
    org: "Google Developer Student Club",
    role: "Founding Leader",
    dates: "2024 – Present",
    detail:
      "Launched the GDSC chapter at NAU from scratch; organized virtual workshops and events on emerging technologies and developer tools for students and faculty.",
    date: "2024-01",
    dateLabel: "2024 – Present",
  },
  {
    id: "design-club",
    org: "Design Club",
    role: "President",
    dates: "2024 – 2025",
    detail:
      "Led instruction on design principles, Figma, Canva, and Adobe Creative Suite; mentored 20+ members; coordinated campus creative events with a focus on visual communication and audience-focused storytelling.",
    date: "2024-06",
    dateLabel: "2024 – 2025",
  },
  {
    id: "art-club",
    org: "Art Club",
    role: "Vice President",
    dates: "North American University",
    detail:
      "Supported programming and events for NAU's student art community.",
    date: "2024-08",
    dateLabel: "2024",
  },
  {
    id: "world-u",
    org: "World U",
    role: "Student Ambassador",
    dates: "2025 – Present",
    detail:
      "Competitively selected, paid ambassador for World U's program on human identity and verification in the age of AI. Plans and executes campus events and introduces students to proof-of-personhood technology.",
    date: "2025-06",
    dateLabel: "2025 – Present",
  },
  {
    id: "girls-who-code",
    org: "Girls Who Code",
    role: "Student Ambassador",
    dates: "2025 – 2026",
    detail:
      "Delivered Python workshops and guided students through hands-on, data-driven projects, focused on foundational programming intuition for beginners.",
    date: "2025-09",
    dateLabel: "2025 – 2026",
  },
];

export const workshopTopics: string[] = [
  "Full-stack development",
  "Applied AI",
  "CS fundamentals",
  "Python",
  "Figma",
  "Visual communication",
  "Design principles",
  "Canva",
  "Adobe Creative Suite",
];

export const communityStat = "Mentored 70+ students across ACM-Women and Design Club";
