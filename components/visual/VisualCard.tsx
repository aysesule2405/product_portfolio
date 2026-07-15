import Image from "next/image";
import { VisualWork } from "@/lib/data/visual-work";
import { categoryStyle } from "@/lib/category-color";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Disclosure } from "@/components/work/Disclosure";

export function VisualCard({
  work,
  onImageClick,
}: {
  work: VisualWork;
  /** Opens the full-screen lightbox on this work's featured image. */
  onImageClick?: () => void;
}) {
  const isPlayground = work.id === "playground";

  return (
    <article
      id={work.id}
      className="motion-card scroll-mt-24 flex flex-col overflow-hidden rounded-2xl border border-line bg-bg-raised"
      style={categoryStyle(work.category)}
    >
      <button
        type="button"
        onClick={onImageClick}
        aria-label={`View ${work.featuredPiece} full-screen`}
        className="cat-tint-bg group relative aspect-[4/5] overflow-hidden border-b border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
      >
        {work.image ? (
          <Image
            src={work.image.src}
            alt={work.image.alt}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className={
              (isPlayground ? "object-cover object-top" : "object-cover object-center") +
              " transition-transform duration-500 ease-out group-hover:scale-105"
            }
          />
        ) : null}
        <span className="absolute left-2 top-2 rounded bg-bg/85 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint backdrop-blur-sm">
          {work.fieldNumber}
        </span>
        <span className="cat-tint-text absolute bottom-2 right-2 z-10 rounded-full bg-bg/85 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.08em] backdrop-blur-sm">
          {work.medium.split(" & ")[0]}
        </span>
      </button>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <FieldLabel>
            {work.medium} · {work.dateLabel}
          </FieldLabel>
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
        <p className="text-xs text-ink-faint">
          <span className="font-medium text-ink-soft">Trains:</span> {work.skill}
        </p>

        <Disclosure label="Process notes">
          <p><span className="font-medium text-ink">Featured: </span>{work.featuredPiece}</p>
          <p>{work.lesson}</p>
        </Disclosure>
      </div>
    </article>
  );
}
