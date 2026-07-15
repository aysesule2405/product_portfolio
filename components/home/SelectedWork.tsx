import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { ProjectCard } from "@/components/work/ProjectCard";
import { getFlagshipProjects } from "@/lib/data/projects";

export function SelectedWork({ hiringId }: { hiringId?: string | null }) {
  const projects = getFlagshipProjects(hiringId);

  return (
    <section id="selected-work" className="scroll-mt-20 border-t border-line py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Selected work"
            title="Three projects worth your sixty seconds"
            description="Product problem, defining decision, concrete result — before the full field map."
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Container>
    </section>
  );
}
