import Image from "next/image";
import clsx from "clsx";
import { GalleryPiece } from "@/lib/data/visual-work";
import { VisualTexture } from "@/components/visual/VisualTexture";
import { ProblemCategory } from "@/lib/types";

export function ArtworkPieceCard({
  piece,
  index,
  category,
  texture,
  aspect = "portrait",
  onImageClick,
}: {
  piece: GalleryPiece;
  index: number;
  category: ProblemCategory;
  texture: "paper" | "clay" | "charcoal" | "playground";
  aspect?: "portrait" | "landscape";
  /** Opens the full-screen lightbox on this piece — omitted when there's no image to view. */
  onImageClick?: () => void;
}) {
  return (
    <article className="motion-card flex flex-col overflow-hidden rounded-xl border border-line bg-bg-raised">
      <button
        type="button"
        data-sound={piece.image ? "shell-flip" : undefined}
        onClick={piece.image ? onImageClick : undefined}
        disabled={!piece.image}
        aria-label={piece.image ? `View ${piece.title} full-screen` : piece.title}
        className={clsx(
          "cat-tint-bg group relative overflow-hidden border-b border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
          aspect === "landscape" ? "aspect-[16/10]" : "aspect-[4/5]",
          !piece.image && "cursor-default"
        )}
      >
        {piece.image ? (
          <Image
            src={piece.image.src}
            alt={piece.image.alt}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className={clsx(
              "object-cover transition-transform duration-500 ease-out group-hover:scale-105",
              aspect === "landscape" ? "object-top" : "object-center"
            )}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <VisualTexture texture={texture} category={category} className="h-20 w-28" />
          </div>
        )}
        <span className="absolute left-2 top-2 flex h-6 w-8 items-center justify-center rounded bg-bg/85 font-mono text-[10px] text-ink-faint backdrop-blur-sm">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="cat-tint-text absolute bottom-2 right-2 rounded-full bg-bg/85 px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.06em] backdrop-blur-sm">
          {piece.pillLabel}
        </span>
      </button>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h4 className="font-sans text-sm font-semibold text-ink">{piece.title}</h4>
        <p className="text-xs leading-relaxed text-ink-soft">{piece.caption}</p>
      </div>
    </article>
  );
}
