import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Project } from "@/lib/types";
import { categories } from "@/lib/data/categories";
import { categoryStyle } from "@/lib/category-color";
import { EvidenceGlyph } from "@/components/ui/EvidenceGlyph";
import { Tag } from "@/components/ui/Tag";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { projectFileName } from "@/lib/data/file-tree";

export function ProjectCard({ project }: { project: Project }) {
  const cover = project.images[0];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="motion-card group relative flex flex-col overflow-hidden rounded-2xl border border-line bg-bg-raised"
      style={categoryStyle(project.primaryCategory)}
    >
      <Link
        href={`/work/${project.slug}`}
        className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        aria-label={`Read the case study for ${project.title}`}
      >
        <WindowChrome
          filename={projectFileName(project)}
          compact
          right={
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
              {project.fieldNumber}
            </span>
          }
        />
        <div className="cat-tint-bg relative flex h-36 items-center justify-center overflow-hidden border-b border-line">
          {cover ? (
            <Image
              src={cover.src}
              alt={cover.alt}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover opacity-90 transition-[transform,opacity] duration-500 ease-out group-hover:scale-105 group-hover:opacity-100"
            />
          ) : (
            <EvidenceGlyph glyph={project.glyph} category={project.primaryCategory} className="h-24 w-32" />
          )}
        </div>

        <div className="flex flex-1 flex-col gap-3 p-6">
          <div className="flex flex-wrap gap-1.5">
            {project.categories.map((catId) => {
              const cat = categories.find((c) => c.id === catId);
              if (!cat) return null;
              return (
                <Tag key={catId} category={cat.id} className="text-[11px]">
                  {cat.label}
                </Tag>
              );
            })}
          </div>

          <h3 className="font-sans text-xl font-semibold text-ink">{project.title}</h3>
          <p className="text-sm leading-relaxed text-ink-soft">{project.oneLiner}</p>

          <div className="mt-auto space-y-2 border-t border-line pt-4 text-sm">
            <p className="text-ink-soft">
              <span className="font-medium text-ink">Key decision — </span>
              {project.keyDecision}
            </p>
            {project.outcome ? (
              <p className="cat-tint-text font-medium">{project.outcome}</p>
            ) : null}
          </div>

          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink transition-transform group-hover:translate-x-1">
            Read the case study
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden>
              <path d="M0.5 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </Link>
    </motion.article>
  );
}
