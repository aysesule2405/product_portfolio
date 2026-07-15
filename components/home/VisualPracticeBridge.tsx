import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { Reveal } from "@/components/motion/Reveal";
import { visualWork } from "@/lib/data/visual-work";

const featured = visualWork.filter((work) => work.id !== "playground");

export function VisualPracticeBridge() {
  return (
    <section className="border-t border-line py-16 sm:py-20">
      <Container>
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <FieldLabel>Visual practice</FieldLabel>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-ink-soft">
              Art trained the eye behind the product work — poster hierarchy, ceramic
              iteration, and atmosphere all show up in how I design interfaces.
            </p>
          </div>
          <Link
            href="/visual-practice"
            className="motion-press shrink-0 rounded-md border border-line-strong px-5 py-2.5 text-sm font-medium text-ink hover:bg-bg-inset"
          >
            Explore visual practice
          </Link>
        </Reveal>

        <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
          {featured.map((work) => (
            <Link
              key={work.id}
              href="/visual-practice"
              className="motion-card group relative aspect-[4/5] overflow-hidden rounded-xl border border-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              {work.image ? (
                <Image
                  src={work.image.src}
                  alt={work.image.alt}
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent" aria-hidden />
              <span className="absolute bottom-2 left-2 right-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-faint">
                {work.medium}
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </section>
  );
}
