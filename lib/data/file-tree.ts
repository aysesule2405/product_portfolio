import { projects } from "@/lib/data/projects";
import { visualWork } from "@/lib/data/visual-work";

export interface FileTreeEntry {
  label: string;
  href: string;
}

export interface FileTreeGroup {
  label: string;
  entries: FileTreeEntry[];
}

export function toFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9]+/g, "");
}

export function projectFileName(project: { shortName: string }): string {
  return `${toFileName(project.shortName)}.tsx`;
}

export function visualWorkFileName(work: { id: string }): string {
  return `${work.id.replace(/-/g, "_")}.md`;
}

export const rootFiles: FileTreeEntry[] = [
  { label: "index.tsx", href: "/" },
  { label: "process.md", href: "/#process" },
  { label: "community.md", href: "/#community" },
  { label: "about.md", href: "/about" },
  { label: "contact.md", href: "/#contact" },
];

export const fileTreeGroups: FileTreeGroup[] = [
  {
    label: "work/",
    entries: projects.map((project) => ({
      label: projectFileName(project),
      href: `/work/${project.slug}`,
    })),
  },
  {
    label: "practice/",
    entries: visualWork.map((work) => ({
      label: visualWorkFileName(work),
      href: `/visual-practice#${work.id}`,
    })),
  },
];
