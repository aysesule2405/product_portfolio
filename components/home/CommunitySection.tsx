import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Tag } from "@/components/ui/Tag";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { communityRoles, communityStat, workshopTopics } from "@/lib/data/community";

export function CommunitySection() {
  return (
    <section id="community" className="scroll-mt-20 border-t border-line bg-bg-raised py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Beyond the screen"
            title="Designing spaces where people can start"
            description="I care about building products, and about making the technical and creative spaces around them feel less intimidating to walk into."
          />
        </Reveal>

        <Stagger className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {communityRoles.map((role) => (
            <StaggerItem key={role.id} className="motion-card rounded-2xl border border-line bg-bg p-5">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-sans text-lg font-semibold text-ink">{role.org}</p>
                <p className="font-mono text-[10px] text-ink-faint">{role.dates}</p>
              </div>
              <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                {role.role}
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{role.detail}</p>
            </StaggerItem>
          ))}
        </Stagger>

        <Reveal subtle className="mt-6">
          <div className="motion-card rounded-2xl border border-line bg-bg p-6">
            <p className="font-sans text-2xl font-semibold text-ink">{communityStat}</p>
            <p className="mt-2 text-sm text-ink-soft">
              across workshops in full-stack development, applied AI, CS fundamentals,
              Python, Figma, visual communication, design principles, Canva, and Adobe
              Creative Suite.
            </p>
            <div className="mt-5 flex flex-wrap gap-1.5">
              {workshopTopics.map((topic) => (
                <Tag key={topic} category="learning-workflows" className="text-[11px]">
                  {topic}
                </Tag>
              ))}
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
