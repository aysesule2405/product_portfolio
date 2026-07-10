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
}: {
  piece: GalleryPiece;
  index: number;
  category: ProblemCategory;
  texture: "paper" | "clay" | "charcoal" | "playground";
  aspect?: "portrait" | "landscape";
}) {
  return (
    <article className="motion-card flex flex-col overflow-hidden rounded-xl border border-line bg-bg-raised">
      <div
        className={clsx(
          "cat-tint-bg relative overflow-hidden border-b border-line",
          aspect === "landscape" ? "aspect-[16/10]" : "aspect-[4/5]"
        )}
      >
        {piece.image ? (
          <Image
            src={piece.image.src}
            alt={piece.image.alt}
            fill
            sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
            className={clsx("object-cover", aspect === "landscape" ? "object-top" : "object-center")}
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
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h4 className="font-sans text-sm font-semibold text-ink">{piece.title}</h4>
        <p className="text-xs leading-relaxed text-ink-soft">{piece.caption}</p>
      </div>
    </article>
  );
}
