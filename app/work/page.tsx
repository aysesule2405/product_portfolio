import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { SelectedWork } from "@/components/home/SelectedWork";
import { WorkExplorer } from "@/components/work/WorkExplorer";

export const metadata: Metadata = {
  title: "Work — The Clarity Lab",
  description:
    "Ayse Sule Ekiz's product work — flagship case studies, the full field map, and every shipped project, filterable by product area or hiring intent.",
};

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ hiring?: string }>;
}) {
  const { hiring } = await searchParams;

  return (
    <div>
      <header className="border-b border-line">
        <Container className="py-14 sm:py-20">
          <FieldLabel>Work</FieldLabel>
          <h1 className="mt-5 max-w-3xl font-sans text-4xl font-semibold leading-tight text-ink sm:text-5xl">
            All work
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
            Flagship case studies first, the rest below — filter by product area or what
            you&rsquo;re hiring for, and browse as a grid, a scannable list, or the full
            field map.
          </p>
        </Container>
      </header>

      <SelectedWork hiringId={hiring} />

      <section className="border-t border-line py-20 sm:py-28">
        <Container>
          <Reveal>
            <SectionHeading
              eyebrow="Everything else"
              title="The full field"
              description="Every project, threaded by problem type — switch views or filter to browse your own way."
            />
          </Reveal>

          <WorkExplorer
            initialHiring={hiring}
            defaultView="grid"
            hideFlagshipFromLists
            className="mt-10"
          />
        </Container>
      </section>
    </div>
  );
}
