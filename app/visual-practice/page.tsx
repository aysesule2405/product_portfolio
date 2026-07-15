import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { VisualCard } from "@/components/visual/VisualCard";
import { ArtworkPieceCard } from "@/components/visual/ArtworkPieceCard";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { visualWork } from "@/lib/data/visual-work";

export const metadata: Metadata = {
  title: "Visual Practice — The Clarity Lab",
  description:
    "Graphic design, ceramics, painting, and playground experiments — the art practice that trains the eye behind Ayse Sule Ekiz's product work.",
};

export default function VisualPracticePage() {
  return (
    <div>
      <header className="border-b border-line">
        <Container className="py-16 sm:py-24">
          <FieldLabel>Visual practice</FieldLabel>
          <h1 className="mt-5 max-w-2xl font-sans text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            My art practice isn&rsquo;t separate from my product work. It trains the
            same eye.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Composition, hierarchy, emotion, material, contrast, storytelling — these
            aren&rsquo;t design-school abstractions to me, they&rsquo;re things I&rsquo;ve
            practiced with my hands, in clay and charcoal and layout grids, long before I
            practiced them in Figma. Every section below names the medium, the principle
            I was actually working on, and what it taught the product side of my work.
          </p>
        </Container>
      </header>

      <Container className="py-14 sm:py-20">
        <Stagger className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visualWork.filter((work) => work.id !== "playground").map((work) => (
            <StaggerItem key={work.id}>
              <VisualCard work={work} />
            </StaggerItem>
          ))}
        </Stagger>
      </Container>

      {visualWork.map((work) =>
        work.pieces.length > 0 ? (
          <Container key={`gallery-${work.id}`} className="border-t border-line py-12">
            <Reveal subtle>
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <FieldLabel>{work.fieldNumber} · From {work.medium}</FieldLabel>
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
              {work.pieces.map((piece, index) => (
                <StaggerItem key={`${work.id}-${piece.title}`}>
                  <ArtworkPieceCard
                    piece={piece}
                    index={index}
                    category={work.category}
                    texture={work.texture}
                    aspect={work.pieceAspect}
                  />
                </StaggerItem>
              ))}
            </Stagger>
          </Container>
        ) : null
      )}
    </div>
  );
}
