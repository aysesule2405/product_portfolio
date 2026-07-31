export type ProblemCategory =
  | "ai-trust"
  | "learning-workflows"
  | "data-clarity"
  | "campus-systems"
  | "emotional-ux"
  | "creative-tools"
  | "community-learning"
  | "design-systems";

export interface CategoryMeta {
  id: ProblemCategory;
  label: string;
  shortLabel: string;
  description: string;
}

export interface DecisionLogEntry {
  decision: string;
  why: string;
  tradeoff: string;
  result: string;
}

export interface EvidenceRailData {
  users: string;
  timeline: string;
  team: string;
  role: string;
  tools: string[];
  constraints: string;
  outcome: string;
}

export interface CaseStudyContent {
  messyProblem: string;
  whyItMattered: string;
  northStar: string;
  whoIDesignedFor: string;
  constraints: string;
  role: string;
  research: string;
  productDecisionsIntro: string;
  designExplorations: string;
  systemOverview?: string;
  finalExperience: string;
  whatShipped: string;
  outcome: string;
  whatILearned: string;
  whatIdImproveNext: string;
  /** Snapshot's condensed problem/stakes/audience/constraints — ≤80 words, for the
   *  six-section case-study template. Full detail stays in the fields above, available
   *  on demand. */
  challengeSummary: string;
  /** The central realization the decisions below all trace back to — 30–50 words,
   *  paired with `northStar`'s guiding question. */
  keyInsightRealization: string;
  /** A 40–60 word reflection pairing what was learned with what's next, for the
   *  Outcome & reflection section — full detail stays in whatILearned/whatIdImproveNext. */
  reflectionSummary: string;
}

export interface ProjectVideo {
  src: string;
  webmSrc?: string;
  poster: string;
  alt: string;
  caption?: string;
}

export type EvidenceGlyph =
  | "retrieval-nodes"
  | "waveform-notes"
  | "nav-grid"
  | "diagnostic-scatter"
  | "mood-atmosphere"
  | "world-constellation"
  | "safety-signal";

export interface ProjectLink {
  label: string;
  href: string;
}

export interface ProjectImage {
  src: string;
  alt: string;
}

/** A real, already-substantiated fact pulled out of the case study prose
 * (a count, a result, an award) and given its own visual weight — never a
 * fabricated metric invented for the sake of having a number. */
export interface ProjectStat {
  value: string;
  label: string;
}

export interface Project {
  slug: string;
  title: string;
  shortName: string;
  oneLiner: string;
  categories: ProblemCategory[];
  primaryCategory: ProblemCategory;
  description: string;
  users: string;
  role: string;
  keyDecision: string;
  outcome?: string;
  tools: string[];
  links: ProjectLink[];
  glyph: EvidenceGlyph;
  fieldNumber: string;
  /** ISO "YYYY-MM" used for timeline placement */
  date: string;
  dateLabel: string;
  icon?: ProjectImage;
  /** Real logo/branding variations designed for this project — a wordmark, an icon-only
   *  mark, alternate backgrounds, etc. Shown as a row of square swatches on the case-study
   *  page, distinct from `icon`, which is the single uniform badge mark. */
  logos?: ProjectImage[];
  images: ProjectImage[];
  video?: ProjectVideo;
  decisionLog: DecisionLogEntry[];
  evidenceRail: EvidenceRailData;
  caseStudy: CaseStudyContent;
  stats: ProjectStat[];
}

/** Which lane a node occupies on the Commit Constellation timeline */
export type TimelineLane = "roots" | "experience" | "projects" | "community";

export type TimelineNodeKind = "project" | "visual-work" | "artwork" | "community" | "experience";

export interface TimelineNode {
  id: string;
  kind: TimelineNodeKind;
  lane: TimelineLane;
  title: string;
  dateLabel: string;
  /** sortable ISO "YYYY-MM"; roots-era entries use an approximate year */
  date: string;
  category: ProblemCategory;
  summary: string;
  href?: string;
  /** ids of other nodes this one threads to (shared category / theme) */
  threadsTo: string[];
}
