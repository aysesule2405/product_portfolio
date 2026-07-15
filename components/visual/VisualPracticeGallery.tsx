"use client";

import { useMemo, useState } from "react";
import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { VisualCard } from "@/components/visual/VisualCard";
import { ArtworkPieceCard } from "@/components/visual/ArtworkPieceCard";
import { Lightbox, LightboxItem } from "@/components/visual/Lightbox";
import { VisualWork } from "@/lib/data/visual-work";

function buildGallery(work: VisualWork) {
  const items: LightboxItem[] = [];
  const pieceIndexByTitle = new Map<string, number>();

  if (work.image) {
    items.push({
      src: work.image.src,
      alt: work.image.alt,
      title: work.featuredPiece,
      medium: work.medium,
      dateLabel: work.dateLabel,
    });
  }
  for (const piece of work.pieces) {
    if (!piece.image) continue;
    pieceIndexByTitle.set(piece.title, items.length);
    items.push({
      src: piece.image.src,
      alt: piece.image.alt,
      title: piece.title,
      medium: work.medium,
      dateLabel: work.dateLabel,
      caption: piece.caption,
    });
  }
  return { items, pieceIndexByTitle };
}

export function VisualPracticeGallery({ works }: { works: VisualWork[] }) {
  const intro = works.filter((w) => w.id !== "playground");
  const playground = works.find((w) => w.id === "playground");

  const [open, setOpen] = useState<{ workId: string; index: number } | null>(null);

  const galleries = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildGallery>>();
    for (const work of works) map.set(work.id, buildGallery(work));
    return map;
  }, [works]);

  const activeItems = open ? galleries.get(open.workId)?.items ?? [] : [];
  const activeItem = open ? activeItems[open.index] ?? null : null;

  function step(delta: number) {
    if (!open || activeItems.length === 0) return;
    const nextIndex = (open.index + delta + activeItems.length) % activeItems.length;
    setOpen({ workId: open.workId, index: nextIndex });
  }

  return (
    <>
      <Container className="py-14 sm:py-20">
        <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {intro.map((work) => (
            <StaggerItem key={work.id}>
              <VisualCard work={work} onImageClick={() => setOpen({ workId: work.id, index: 0 })} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>

      {intro.map((work) => {
        if (work.pieces.length === 0) return null;
        const gallery = galleries.get(work.id);
        return (
          <Container key={`gallery-${work.id}`} className="border-t border-line py-12">
            <Reveal subtle>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <FieldLabel>
                  {work.fieldNumber} · From {work.medium}
                </FieldLabel>
                <a
                  href={work.galleryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="motion-press text-xs font-medium text-ink-soft underline-offset-2 hover:text-ink hover:underline"
                >
                  View the full gallery ↗
                </a>
              </div>
            </Reveal>
            <Stagger className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
              {work.pieces.map((piece, index) => {
                const itemIndex = gallery?.pieceIndexByTitle.get(piece.title);
                return (
                  <StaggerItem key={`${work.id}-${piece.title}`}>
                    <ArtworkPieceCard
                      piece={piece}
                      index={index}
                      category={work.category}
                      texture={work.texture}
                      aspect={work.pieceAspect}
                      onImageClick={
                        itemIndex !== undefined ? () => setOpen({ workId: work.id, index: itemIndex }) : undefined
                      }
                    />
                  </StaggerItem>
                );
              })}
            </Stagger>
          </Container>
        );
      })}

      {playground ? (
        <Container className="border-t border-line py-12">
          <Reveal>
            <FieldLabel>Interactive experiments</FieldLabel>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
              Playground work lives apart from the finished pieces above — small, unpolished
              interaction prototypes built purely out of curiosity.
            </p>
          </Reveal>
          <div className="mt-6 max-w-md">
            <VisualCard work={playground} onImageClick={() => setOpen({ workId: playground.id, index: 0 })} />
          </div>
        </Container>
      ) : null}

      <Lightbox
        item={activeItem}
        onClose={() => setOpen(null)}
        onPrev={activeItems.length > 1 ? () => step(-1) : undefined}
        onNext={activeItems.length > 1 ? () => step(1) : undefined}
      />
    </>
  );
}
