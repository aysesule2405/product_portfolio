import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { BrandGlow } from "@/components/ui/BrandGlow";
import { Reveal } from "@/components/motion/Reveal";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { MoonPhaseChart } from "@/components/celestial/MoonPhaseChart";
import { ContactForm } from "@/components/home/ContactForm";
import { socialLinks, resumeHref } from "@/lib/data/nav";

const directRoutes = [...socialLinks.filter((l) => l.label === "Email" || l.label === "LinkedIn"), { label: "Resume", href: resumeHref }, ...socialLinks.filter((l) => l.label !== "Email" && l.label !== "LinkedIn")];

const lunarPoem =
  "The moon phase is a small live signal for timing and tone: some nights are for starting, some for refining, some for reflecting. Wherever you are in the cycle, a message is a way to find the same sky for a moment.";

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-line py-20 sm:py-28">
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
                    Let&rsquo;s make complexity feel clear.
                  </h2>
                  <p className="mt-5 max-w-xl text-base leading-relaxed text-ink-soft">
                    Open to product design, design engineering, and AI product roles —
                    send a note or use a direct link.
                  </p>
                  <p
                    className="lunar-poem mt-4 max-w-xl border-l-2 border-accent pl-4 text-sm leading-relaxed text-ink-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                    tabIndex={0}
                    aria-label={lunarPoem}
                  >
                    {lunarPoem.split(" ").map((word, wordIndex) => (
                      <span key={`${word}-${wordIndex}`} aria-hidden>
                        <span className="lunar-poem-word">
                          {word.split("").map((letter, letterIndex) => {
                            const index = wordIndex * 8 + letterIndex;
                            return (
                              <span
                                key={`${letter}-${wordIndex}-${letterIndex}`}
                                className="lunar-poem-letter"
                                style={{ ["--letter-index" as string]: index }}
                              >
                                {letter}
                              </span>
                            );
                          })}
                        </span>{" "}
                      </span>
                    ))}
                  </p>

                  <div className="mt-8">
                    <ContactForm />
                  </div>
                </div>

                <aside className="flex min-w-0 flex-col gap-4">
                  <MoonPhaseChart />

                  <div className="rounded-2xl border border-line bg-bg-inset/70 p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Direct routes
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {directRoutes.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target={link.label === "Resume" ? "_blank" : undefined}
                          rel={link.label === "Resume" ? "noreferrer" : undefined}
                          className="motion-press rounded-full border border-line-strong bg-bg px-4 py-2 text-sm font-medium text-ink hover:bg-bg-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
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
