import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Tag } from "@/components/ui/Tag";
import { BrandGlow } from "@/components/ui/BrandGlow";
import { PhotoAlbum } from "@/components/about/PhotoAlbum";
import { CommunityTimeline } from "@/components/about/CommunityTimeline";
import { resumeHref } from "@/lib/data/nav";
import { capabilityGroups, positioning } from "@/lib/data/positioning";

export const metadata: Metadata = {
  title: "About — The Clarity Lab",
  description:
    "How Ayse Sule Ekiz brings engineering, design, data, and visual craft into one product-building practice.",
};

const values: { title: string; body: string; icon: React.ReactNode }[] = [
  {
    title: "Clarity",
    body: "I turn tangled workflows into interfaces people can understand, trust, and return to.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
        <path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="10" cy="10" r="2" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: "Emotion",
    body: "A technical tool is still used by a person with context, pressure, confidence, doubt, and curiosity.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M1 11h4l2-6 3 12 2-9 1.5 3H19"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Trust",
    body: "Especially in AI products, good design has to make uncertainty visible instead of hiding it.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M10 1.5 17 4v5.5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V4l7-2.5Z"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M7 10l2 2 4-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Access",
    body: "If only experts can use the system, the design has not finished its job.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M12 2H4v16h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 2l5 1.5v13L12 18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 10h9M15 7l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div>
      <header className="relative overflow-hidden border-b border-line">
        <BrandGlow className="-right-24 -top-28 h-[440px] w-[440px] rotate-12 sm:-right-12" />
        <Container className="relative py-16 sm:py-24">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.78fr)] lg:items-end">
            <div>
              <FieldLabel>About</FieldLabel>
              <h1 className="mt-5 max-w-3xl font-sans text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                {positioning.headline}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-soft sm:text-lg">
                I&rsquo;m Ayse Sule Ekiz. {positioning.story} I&rsquo;m currently studying
                computer science.
              </p>
            </div>

            <PhotoAlbum />
          </div>
        </Container>
      </header>

      <Container className="grid grid-cols-1 gap-12 py-14 sm:py-20 lg:grid-cols-[1fr_280px]">
        <div className="max-w-2xl space-y-6 text-base leading-relaxed text-ink-soft lg:pt-6">
          <p>
            I grew up making things with my hands before I ever wrote a line of code —
            ceramics, charcoal, posters — which trained my eye for composition,
            hierarchy, and emotional weight. Computer science gave me another material to
            work with: systems, data, and logic. Product design became the bridge between
            them — taking something structurally complex, like a local AI assistant or a
            campus platform, and making it legible enough to act on with confidence.
          </p>

          <blockquote className="border-l-2 border-accent py-1 pl-5 font-serif text-xl italic leading-snug text-ink sm:text-2xl">
            &ldquo;The interface is where a system proves whether it understands the person
            using it.&rdquo;
          </blockquote>

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            {values.map((value) => (
              <div key={value.title} className="rounded-2xl border border-line bg-bg-raised p-5">
                <div className="flex items-center gap-2.5 text-ink">
                  {value.icon}
                  <h3 className="font-sans text-base font-semibold">{value.title}</h3>
                </div>
                <p className="mt-2.5 text-sm leading-relaxed text-ink-soft">{value.body}</p>
              </div>
            ))}
          </div>

          <CommunityTimeline />

          <p className="pt-2">
            This portfolio is a map of that practice: shipped product work, design
            systems thinking, software engineering, AI experiments, brand work, and
            visual art. The disciplines support one another: design sets the direction,
            engineering makes it real, data keeps the decisions grounded, and visual
            craft gives the experience a point of view.
          </p>
          <p>
            I build with code. I think with art. Clarity isn&rsquo;t decoration to me
            — it&rsquo;s the requirement that tells you whether a system actually
            understands the person using it.
          </p>

          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              href={resumeHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-bg transition-transform hover:-translate-y-0.5"
            >
              View resume
            </Link>
            <Link
              href="/#contact"
              className="inline-flex min-h-11 items-center rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:bg-bg-raised"
            >
              Get in touch
            </Link>
          </div>
        </div>

        <aside className="h-max rounded-2xl border border-line bg-bg-raised p-6 lg:sticky lg:top-24">
          <FieldLabel>At a glance</FieldLabel>
          <dl className="mt-4 space-y-4 text-sm">
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Currently
              </dt>
              <dd className="mt-1 text-ink">
                Computer Science student
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Core practice
              </dt>
              <dd className="mt-1 text-ink">Designing and engineering complete product experiences</dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Opportunities
              </dt>
              <dd className="mt-2 space-y-2 text-ink">
                {capabilityGroups.map((group) => (
                  <div key={group.label}>
                    <span className="font-medium">{group.label}</span>
                    <span className="block text-xs leading-relaxed text-ink-soft">
                      {group.roles.join(" · ")}
                    </span>
                  </div>
                ))}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Work style
              </dt>
              <dd className="mt-1 text-ink">
                {positioning.workModes.join(" · ")} · open to US relocation
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Preferred hubs
              </dt>
              <dd className="mt-1 text-xs leading-relaxed text-ink-soft">
                {positioning.preferredLocations.join(" · ")}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                Focus
              </dt>
              <dd className="mt-2 flex flex-wrap gap-1.5">
                <Tag category="ai-trust">AI tools</Tag>
                <Tag category="design-systems">Design systems</Tag>
                <Tag category="emotional-ux">Emotional UX</Tag>
                <Tag category="learning-workflows">Education</Tag>
              </dd>
            </div>
          </dl>
        </aside>
      </Container>
    </div>
  );
}
