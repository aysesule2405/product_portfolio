import Link from "next/link";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Container } from "@/components/ui/Container";
import { Reveal } from "@/components/motion/Reveal";
import { WorkExplorer } from "@/components/work/WorkExplorer";
import { getFlagshipProjects } from "@/lib/data/projects";

export function FieldMapSection({ initialHiring }: { initialHiring?: string }) {
  const flagshipProjects = getFlagshipProjects(initialHiring);

  return (
    <section id="field-map" className="scroll-mt-20 border-t border-line py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Field map"
              title="Explore all work"
              description="The optional deep path: product work, work experience, visual practice, and community roles as four star clusters on one field — each its own constellation, threaded to the others wherever the work shares a problem type."
            />
          </div>
        </Reveal>

        <Reveal subtle className="mt-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
            New here? Start with —
          </span>
          {flagshipProjects.map((project, i) => (
            <span key={project.slug} className="flex items-center gap-2">
              <Link href={`/work/${project.slug}`} className="font-medium text-ink underline decoration-line-strong decoration-2 underline-offset-4 hover:text-accent-strong">
                {project.shortName}
              </Link>
              {i < flagshipProjects.length - 1 ? <span className="text-ink-faint">·</span> : null}
            </span>
          ))}
        </Reveal>

        <WorkExplorer
          initialHiring={initialHiring}
          defaultView="map"
          className="mt-8"
        />
      </Container>
    </section>
  );
}
