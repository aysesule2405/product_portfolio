import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { communityRoles, communityStat } from "@/lib/data/community";

export function CommunitySection() {
  const orgCount = communityRoles.length;

  return (
    <section id="community" className="scroll-mt-20 border-t border-line bg-bg-raised py-16 sm:py-20">
      <Container>
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            eyebrow="Beyond the screen"
            title="Designing spaces where people can start"
            className="max-w-xl"
          />
          <div className="motion-card shrink-0 rounded-2xl border border-line bg-bg p-6 sm:w-72">
            <p className="font-sans text-2xl font-semibold text-ink">{communityStat}</p>
            <p className="mt-2 text-sm text-ink-soft">
              Leadership roles across {orgCount} organizations — ACM-Women, GDSC, Design
              Club, and more.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
