export interface ProcessStep {
  id: string;
  letter: string;
  title: string;
  summary: string;
  activities: string[];
  fieldNote: string;
}

export const processSteps: ProcessStep[] = [
  {
    id: "listen",
    letter: "01",
    title: "Listen",
    summary:
      "Before I design anything, I try to find out what's actually messy — for the user, and for whoever has to maintain what I build.",
    activities: [
      "Stakeholder discovery",
      "User research & interviews",
      "Mapping constraints",
      "Sitting with ambiguity before resolving it",
    ],
    fieldNote:
      "Most bad interfaces I've seen weren't badly designed — they were designed against the wrong problem.",
  },
  {
    id: "shape",
    letter: "02",
    title: "Shape",
    summary:
      "Once the real problem is legible, I start giving it a structure — the smallest version of a system that could hold it.",
    activities: [
      "Information architecture",
      "User flows & wireframes",
      "Prototyping",
      "Naming the product decision, out loud",
    ],
    fieldNote:
      "I write the decision down before I get attached to the screen. The screen changes; the reasoning should survive.",
  },
  {
    id: "systemize",
    letter: "03",
    title: "Systemize",
    summary:
      "A design that only works once isn't finished. I build the patterns that let it hold up the second, tenth, and hundredth time.",
    activities: [
      "Design systems & reusable patterns",
      "Accessibility (WCAG)",
      "Documentation",
      "Developer handoff",
    ],
    fieldNote:
      "Documentation is a design deliverable. The component library outlives whichever screen shipped first.",
  },
  {
    id: "ship",
    letter: "04",
    title: "Ship",
    summary:
      "I build the frontend myself when I can, because the gap between a design file and a running interface is where the real decisions get made.",
    activities: [
      "Frontend implementation",
      "Testing & iteration",
      "Watching real usage",
      "Production-quality craft",
    ],
    fieldNote:
      "Shipping is not the last step after design — it's a design step that happens to produce code.",
  },
];
