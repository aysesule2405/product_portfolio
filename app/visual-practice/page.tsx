import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { VisualPracticeGallery } from "@/components/visual/VisualPracticeGallery";
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
            Each medium below trained one specific skill I still use in product work —
            click any piece for a full-screen view.
          </p>
        </Container>
      </header>

      <VisualPracticeGallery works={visualWork} />
    </div>
  );
}
