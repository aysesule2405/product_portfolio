import Image from "next/image";
import { VisualWork } from "@/lib/data/visual-work";
import { categoryStyle } from "@/lib/category-color";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { visualWorkFileName } from "@/lib/data/file-tree";

export function VisualCard({ work }: { work: VisualWork }) {
  const isPlayground = work.id === "playground";

  return (
    <article
      id={work.id}
      className="motion-card scroll-mt-24 flex flex-col overflow-hidden rounded-2xl border border-line bg-bg-raised"
      style={categoryStyle(work.category)}
    >
      <WindowChrome
        filename={visualWorkFileName(work)}
        compact
        right={
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
            {work.fieldNumber}
          </span>
        }
      />
      <div className="cat-tint-bg relative aspect-[4/5] overflow-hidden border-b border-line">
        {work.image ? (
          <Image
            src={work.image.src}
            alt={work.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={isPlayground ? "object-cover object-top" : "object-cover object-center"}
          />
        ) : null}
        <span className="cat-tint-text absolute bottom-2 right-2 z-10 rounded-full bg-bg/85 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] backdrop-blur-sm">
          {work.medium.split(" & ")[0]}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <FieldLabel>{work.medium}</FieldLabel>
          <a
            href={work.galleryUrl}
            target="_blank"
            rel="noreferrer"
            className="cat-tint-text shrink-0 text-xs font-medium underline-offset-2 hover:underline"
          >
            View gallery ↗
          </a>
        </div>
        <h3 className="font-sans text-xl font-semibold text-ink">{work.title}</h3>
        <p className="cat-tint-text text-sm font-medium">{work.principle}</p>
        <p className="text-xs text-ink-faint">Featured: {work.featuredPiece}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">{work.lesson}</p>
      </div>
    </article>
  );
}
