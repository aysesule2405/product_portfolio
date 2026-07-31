import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Tag } from "@/components/ui/Tag";
import { EvidenceGlyph } from "@/components/ui/EvidenceGlyph";
import { DecisionLog } from "@/components/work/DecisionLog";
import { CaseStudySnapshot } from "@/components/work/CaseStudySnapshot";
import { Disclosure } from "@/components/work/Disclosure";
import { NorthStar } from "@/components/work/NorthStar";
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
  // Product decisions: keep no more than three in the scannable template — the rest of
  // the authored decision log stays in the data, available if a future pass wants it.
  const decisions = project.decisionLog.slice(0, 3);

  const currentIndex = projects.findIndex((p) => p.slug === project.slug);
  const next = projects[(currentIndex + 1) % projects.length];

  const sections: OutlineSection[] = [
    { id: "snapshot", label: "Snapshot" },
    { id: "challenge", label: "Challenge" },
    { id: "key-insight", label: "Key insight" },
    { id: "decisions", label: "Product decisions" },
    { id: "final-experience", label: "Final experience" },
    { id: "outcome-reflection", label: "Outcome & reflection" },
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

              {project.logos && project.logos.length > 0 ? (
                <div className="mt-6 flex flex-wrap gap-3">
                  {project.logos.map((logo) => (
                    <div
                      key={logo.src}
                      className="logo-swatch relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-line bg-white shadow-md sm:h-24 sm:w-24"
                    >
                      <Image src={logo.src} alt={logo.alt} fill sizes="96px" className="object-contain p-3" />
                    </div>
                  ))}
                </div>
              ) : null}

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

      <Container className="py-14 sm:py-20">
        <div className="mx-auto max-w-3xl space-y-14">
          <CaseStudySnapshot
            id="snapshot"
            data={project.evidenceRail}
            stats={project.stats}
            category={project.primaryCategory}
          />

          <section id="challenge" className="scroll-mt-20">
            <FieldLabel>Challenge</FieldLabel>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">{caseStudy.challengeSummary}</p>
            <Disclosure label="Full context — problem, audience, constraints">
              <p><span className="font-medium text-ink">The messy problem. </span>{caseStudy.messyProblem}</p>
              <p><span className="font-medium text-ink">Why it mattered. </span>{caseStudy.whyItMattered}</p>
              <p><span className="font-medium text-ink">Who I designed for. </span>{caseStudy.whoIDesignedFor}</p>
              <p><span className="font-medium text-ink">Constraints. </span>{caseStudy.constraints}</p>
              <p><span className="font-medium text-ink">Research. </span>{caseStudy.research}</p>
            </Disclosure>
          </section>

          <NorthStar
            id="key-insight"
            question={caseStudy.northStar}
            realization={caseStudy.keyInsightRealization}
            category={project.primaryCategory}
          />

          <section id="decisions" className="scroll-mt-20">
            <FieldLabel>Product decisions</FieldLabel>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">
              {caseStudy.productDecisionsIntro}
            </p>
            <div className="mt-6">
              <DecisionLog entries={decisions} category={project.primaryCategory} />
            </div>
            <Disclosure label="Design explorations">
              <p>{caseStudy.designExplorations}</p>
            </Disclosure>
          </section>

          <section id="final-experience" className="scroll-mt-20">
            <FieldLabel>Final experience</FieldLabel>

            {project.video ? (
              <div className="mt-5 overflow-hidden rounded-xl border border-line bg-bg-raised">
                <video controls poster={project.video.poster} aria-label={project.video.alt} className="aspect-video w-full">
                  <source src={project.video.src} type="video/mp4" />
                  {project.video.webmSrc ? <source src={project.video.webmSrc} type="video/webm" /> : null}
                </video>
                {project.video.caption ? (
                  <p className="px-4 py-3 text-xs text-ink-faint">{project.video.caption}</p>
                ) : null}
              </div>
            ) : project.images.length > 0 ? (
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {project.images.map((image) => (
                  <div
                    key={image.src}
                    className="group relative aspect-video overflow-hidden rounded-xl border border-line bg-bg-raised"
                  >
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                  </div>
                ))}
              </div>
            ) : null}

            <p className="mt-5 text-base leading-relaxed text-ink-soft">{caseStudy.finalExperience}</p>

            {caseStudy.systemOverview ? (
              <Disclosure label="How it works — system overview">
                <p>{caseStudy.systemOverview}</p>
              </Disclosure>
            ) : null}
          </section>

          <section id="outcome-reflection" className="scroll-mt-20">
            <FieldLabel>Outcome &amp; reflection</FieldLabel>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">{caseStudy.whatShipped}</p>
            <p className="project-hero-accent mt-3 font-medium">{caseStudy.outcome}</p>
            <p className="mt-4 text-base leading-relaxed text-ink-soft">{caseStudy.reflectionSummary}</p>
            <Disclosure label="Full reflection">
              <p><span className="font-medium text-ink">What I learned. </span>{caseStudy.whatILearned}</p>
              <p><span className="font-medium text-ink">What I&rsquo;d improve next. </span>{caseStudy.whatIdImproveNext}</p>
            </Disclosure>
          </section>
        </div>
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
