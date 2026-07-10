import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { aiTools } from "@/lib/data/ai-tools";

export function AICraftSection() {
  return (
    <section className="border-t border-line py-20 sm:py-28">
      <Container className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_1fr]">
        <Reveal>
          <SectionHeading
            eyebrow="Working method"
            title="AI + craft"
            description={
              <>
                I use AI tools to prototype faster, explore product directions, test copy,
                and accelerate implementation — Claude, ChatGPT, Gemini, Cursor, Codex, and
                Figma AI all show up somewhere in how I build. But the tool doesn&rsquo;t make
                the decision. AI clears space for design judgment; it doesn&rsquo;t replace it.
                Every prototype it helps me reach faster still gets held to the same bar for
                intentionality, trust, and craft.
              </>
            }
          />
        </Reveal>

        <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {aiTools.map((tool) => (
            <StaggerItem
              key={tool.name}
              className="motion-card rounded-xl border border-line bg-bg-raised p-4"
            >
              <p className="font-sans font-semibold text-base text-ink">{tool.name}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">{tool.use}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </Container>
    </section>
  );
}
