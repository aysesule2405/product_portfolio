import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { BrandGlow } from "@/components/ui/BrandGlow";
import { Reveal } from "@/components/motion/Reveal";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { MoonPhaseChart } from "@/components/celestial/MoonPhaseChart";
import { ContactForm } from "@/components/home/ContactForm";
import { socialLinks } from "@/lib/data/nav";

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-line py-16 sm:py-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden">
            <BrandGlow className="-left-20 -bottom-24 h-96 w-96 -rotate-12" />
            <div className="motion-card motion-card-static relative overflow-hidden rounded-2xl border border-line bg-bg-raised/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <WindowChrome
                filename="contact.md"
                right={
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-faint">
                    open channel
                  </span>
                }
              />

              <div className="grid gap-8 p-5 sm:p-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
                <div>
                  <FieldLabel>Get in touch</FieldLabel>
                  <h2 className="mt-5 max-w-2xl font-sans text-3xl font-semibold leading-tight text-ink sm:text-5xl">
                    Have a role, project, or idea in mind?
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
                    Tell me what you&rsquo;re building, hiring for, or curious about. I&rsquo;m
                    especially interested in product design, design engineering, and AI
                    product work.
                  </p>
                  <div className="mt-4 flex max-w-xl items-center gap-2 border-l-2 border-accent py-1 pl-4 text-sm text-ink-soft">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-positive" aria-hidden />
                    <p>Your message goes directly to my inbox. I read every note.</p>
                  </div>

                  <div className="mt-8">
                    <ContactForm />
                  </div>
                </div>

                <aside className="flex min-w-0 flex-col gap-4">
                  <div className="order-2 lg:order-1">
                    <MoonPhaseChart />
                  </div>

                  <div className="order-1 rounded-2xl border border-line bg-bg-inset/70 p-5 lg:order-2">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Prefer another channel?
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {socialLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          className="motion-press inline-flex min-h-11 items-center rounded-full border border-line-strong bg-bg px-4 py-2 text-sm font-medium text-ink hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </div>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
