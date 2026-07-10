import { ProblemCategory, TimelineNode } from "@/lib/types";
import { projects } from "@/lib/data/projects";
import { visualWork } from "@/lib/data/visual-work";
import { communityRoles } from "@/lib/data/community";
import { experienceRoles } from "@/lib/data/experience";
import { notableArtworks } from "@/lib/data/artworks";

interface RawNode {
  id: string;
  kind: TimelineNode["kind"];
  lane: TimelineNode["lane"];
  title: string;
  date: string;
  dateLabel: string;
  category: ProblemCategory;
  categories: ProblemCategory[];
  summary: string;
  href?: string;
}

function buildRawNodes(): RawNode[] {
  const projectNodes: RawNode[] = projects.map((project) => ({
    id: `project-${project.slug}`,
    kind: "project",
    lane: "projects",
    title: project.shortName,
    date: project.date,
    dateLabel: project.dateLabel,
    category: project.primaryCategory,
    categories: project.categories,
    summary: project.oneLiner,
    href: `/work/${project.slug}`,
  }));

  const visualNodes: RawNode[] = visualWork.map((work) => ({
    id: `visual-${work.id}`,
    kind: "visual-work",
    lane: "roots",
    title: work.medium,
    date: work.date,
    dateLabel: work.dateLabel,
    category: work.category,
    categories: [work.category],
    summary: work.principle,
    href: `/visual-practice#${work.id}`,
  }));

  const artworkNodes: RawNode[] = notableArtworks.map((art) => ({
    id: `artwork-${art.id}`,
    kind: "artwork",
    lane: "roots",
    title: art.title,
    date: art.date,
    dateLabel: art.dateLabel,
    category: art.category,
    categories: [art.category],
    summary: art.detail,
    href: art.href,
  }));

  const experienceNodes: RawNode[] = experienceRoles.map((role) => ({
    id: `experience-${role.id}`,
    kind: "experience",
    lane: "experience",
    title: role.org,
    date: role.date,
    dateLabel: role.dateLabel,
    category: role.category,
    categories: [role.category],
    summary: role.role,
    href: role.href ?? "/about",
  }));

  const communityNodes: RawNode[] = communityRoles.map((role) => ({
    id: `community-${role.id}`,
    kind: "community",
    lane: "community",
    title: role.org,
    date: role.date,
    dateLabel: role.dateLabel,
    category: "community-learning",
    categories: ["community-learning"],
    summary: role.role,
    href: "/#community",
  }));

  return [...visualNodes, ...artworkNodes, ...experienceNodes, ...projectNodes, ...communityNodes].sort(
    (a, b) => a.date.localeCompare(b.date)
  );
}

export function buildTimelineNodes(): TimelineNode[] {
  const raw = buildRawNodes();

  return raw.map((node) => {
    const threadsTo = raw
      .filter((other) => other.id !== node.id)
      .filter((other) => other.categories.some((c) => node.categories.includes(c)))
      .map((other) => other.id);

    return {
      id: node.id,
      kind: node.kind,
      lane: node.lane,
      title: node.title,
      date: node.date,
      dateLabel: node.dateLabel,
      category: node.category,
      summary: node.summary,
      href: node.href,
      threadsTo,
    };
  });
}
