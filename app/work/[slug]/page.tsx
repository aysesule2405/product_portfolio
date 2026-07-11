import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Tag } from "@/components/ui/Tag";
import { EvidenceGlyph } from "@/components/ui/EvidenceGlyph";
import { DecisionLog } from "@/components/work/DecisionLog";
import { EvidenceRail } from "@/components/work/EvidenceRail";
import { CaseStudyEntry } from "@/components/work/CaseStudyEntry";
import { NorthStar } from "@/components/work/NorthStar";
import { CaseStudyStats } from "@/components/work/CaseStudyStats";
import { CaseStudyOutlineRegistrar } from "@/components/work/CaseStudyOutlineRegistrar";
import { projects, getProjectBySlug } from "@/lib/data/projects";
import { categories } from "@/lib/data/categories";
import { OutlineSection } from "@/lib/outline-context";

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.title} — The Clarity Lab`,
    description: project.oneLiner,
  };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { caseStudy } = project;

  const currentIndex = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(currentIndex + 1) % projects.length];

  const sections: OutlineSection[] = [
    { id: "messy-problem", label: "The messy problem" },
    { id: "why-it-mattered", label: "Why it mattered" },
    { id: "north-star", label: "North star" },
    { id: "who-designed-for", label: "Who I designed for" },
    { id: "constraints", label: "Constraints" },
    { id: "my-role", label: "My role" },
    { id: "research", label: "Research & discovery" },
    { id: "product-decisions", label: "Product decisions" },
    { id: "decision-log", label: "Decision log" },
    { id: "design-explorations", label: "Design explorations" },
    ...(caseStudy.systemOverview ? [{ id: "system-overview", label: "System overview" }] : []),
    { id: "final-experience", label: "Final experience" },
    { id: "what-shipped", label: "What shipped" },
    { id: "outcome", label: "Outcome" },
    { id: "what-learned", label: "What I learned" },
    { id: "improve-next", label: "What I'd improve next" },
  ];

  return (
    <article className={`project-case project-theme-${project.slug}`}>
      <CaseStudyOutlineRegistrar sections={sections} />
      <header className="project-hero border-b">
        <Container className="py-14 sm:py-20">
          <Link
            href="/#field-map"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink"
          >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className="rotate-180">
              <path d="M0.5 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            All field studies
          </Link>

          <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <FieldLabel>
                {project.fieldNumber} · Case study · {project.dateLabel}
              </FieldLabel>
              <h1 className="project-hero-title mt-4 font-sans text-3xl font-semibold leading-tight sm:text-5xl">
                {project.title}
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-ink-soft">{project.oneLiner}</p>

              <div className="mt-6 flex flex-wrap gap-1.5">
                {project.categories.map((catId) => {
                  const cat = categories.find((c) => c.id === catId);
                  if (!cat) return null;
                  return (
                    <Tag key={catId} category={cat.id}>
                      {cat.label}
                    </Tag>
                  );
                })}
              </div>

              {project.links.length > 0 ? (
                <div className="mt-5 flex flex-wrap gap-4">
                  {project.links.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium text-ink underline decoration-line-strong decoration-2 underline-offset-4 hover:text-ink-soft"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="project-hero-icon relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-full border shadow-xl backdrop-blur">
              {project.icon ? (
                <Image
                  src={project.icon.src}
                  alt=""
                  fill
                  sizes="112px"
                  className="project-icon-img object-contain p-5"
                />
              ) : (
                <EvidenceGlyph glyph={project.glyph} category={project.primaryCategory} className="h-20 w-24" />
              )}
            </div>
          </div>
        </Container>
      </header>

      {project.images.length > 0 ? (
        <Container className="py-10">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {project.images.map((image) => (
              <div
                key={image.src}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-line bg-bg-raised"
              >
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        </Container>
      ) : null}

      {project.stats.length > 0 ? (
        <Container className="pb-10">
          <CaseStudyStats stats={project.stats} category={project.primaryCategory} />
        </Container>
      ) : null}

      <Container className="grid grid-cols-1 gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_320px]">
        <div className="lg:pt-6">
          <CaseStudyEntry id="messy-problem" label="The messy problem">
            <p>{caseStudy.messyProblem}</p>
          </CaseStudyEntry>
          <CaseStudyEntry id="why-it-mattered" label="Why it mattered">
            <p>{caseStudy.whyItMattered}</p>
          </CaseStudyEntry>

          <NorthStar id="north-star" question={caseStudy.northStar} category={project.primaryCategory} />

          <CaseStudyEntry id="who-designed-for" label="Who I designed for">
            <p>{caseStudy.whoIDesignedFor}</p>
          </CaseStudyEntry>
          <CaseStudyEntry id="constraints" label="Constraints">
            <p>{caseStudy.constraints}</p>
          </CaseStudyEntry>
          <CaseStudyEntry id="my-role" label="My role">
            <p>{caseStudy.role}</p>
          </CaseStudyEntry>
          <CaseStudyEntry id="research" label="Research & discovery">
            <p>{caseStudy.research}</p>
          </CaseStudyEntry>

          <CaseStudyEntry id="product-decisions" label="Product decisions">
            <p>{caseStudy.productDecisionsIntro}</p>
          </CaseStudyEntry>

          <div id="decision-log" className="scroll-mt-20 border-t border-line py-7">
            <DecisionLog entries={project.decisionLog} category={project.primaryCategory} />
          </div>

          <CaseStudyEntry id="design-explorations" label="Design explorations">
            <p>{caseStudy.designExplorations}</p>
          </CaseStudyEntry>
          {caseStudy.systemOverview ? (
            <CaseStudyEntry id="system-overview" label="System overview">
              <p>{caseStudy.systemOverview}</p>
            </CaseStudyEntry>
          ) : null}
          <CaseStudyEntry id="final-experience" label="Final experience">
            <p>{caseStudy.finalExperience}</p>
          </CaseStudyEntry>
          <CaseStudyEntry id="what-shipped" label="What shipped">
            <p>{caseStudy.whatShipped}</p>
          </CaseStudyEntry>
          <CaseStudyEntry id="outcome" label="Outcome">
            <p className="project-hero-accent font-medium">{caseStudy.outcome}</p>
          </CaseStudyEntry>
          <CaseStudyEntry id="what-learned" label="What I learned">
            <p>{caseStudy.whatILearned}</p>
          </CaseStudyEntry>
          <CaseStudyEntry id="improve-next" label="What I'd improve next">
            <p>{caseStudy.whatIdImproveNext}</p>
          </CaseStudyEntry>
        </div>

        <EvidenceRail data={project.evidenceRail} category={project.primaryCategory} />
      </Container>

      <Container className="border-t border-line py-10">
        <div className="flex items-center justify-between gap-4">
          <FieldLabel>Next field study</FieldLabel>
          <Link
            href={`/work/${next.slug}`}
            className="group flex items-center gap-2 font-sans text-lg font-semibold text-ink hover:text-ink-soft"
          >
            {next.shortName}
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden className="transition-transform group-hover:translate-x-1">
              <path d="M0.5 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </Container>
    </article>
  );
}
