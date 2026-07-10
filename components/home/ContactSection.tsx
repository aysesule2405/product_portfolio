import { Container } from "@/components/ui/Container";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { BrandGlow } from "@/components/ui/BrandGlow";
import { Reveal } from "@/components/motion/Reveal";
import { WindowChrome } from "@/components/ui/WindowChrome";
import { MoonPhaseChart } from "@/components/celestial/MoonPhaseChart";
import { socialLinks } from "@/lib/data/nav";

const topics = ["Collaboration", "Job / Internship", "Feedback", "Just saying hi"];

export function ContactSection() {
  return (
    <section id="contact" className="scroll-mt-20 border-t border-line py-20 sm:py-28">
      <Container>
        <Reveal>
          <div className="relative overflow-hidden">
            <BrandGlow className="-left-20 -bottom-24 h-96 w-96 -rotate-12" />
            <div className="motion-card relative overflow-hidden rounded-2xl border border-line bg-bg-raised/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
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
                    Open to product design, design engineering, and AI product roles. Send
                    a note through the form, or use one of the direct links.
                  </p>

                  <div className="mt-8">
                    <form id="contactForm" action="https://api.web3forms.com/submit" method="POST" className="space-y-4">
                      <input type="hidden" name="access_key" value="7b268203-c0a5-47d9-acbe-7eb03d4af6a6" />
                      <input type="hidden" name="subject" value="New message from your portfolio website" />
                      <input type="hidden" name="from_name" value="Portfolio Contact Form" />
                      <input
                        type="checkbox"
                        name="botcheck"
                        className="hidden"
                        style={{ display: "none" }}
                        tabIndex={-1}
                        autoComplete="off"
                      />

                      <div>
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                          I&rsquo;m reaching out about
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {topics.map((topic) => (
                            <label key={topic} className="cursor-pointer">
                              <input type="radio" name="topic" value={topic} className="peer sr-only" required={topic === topics[0]} />
                              <span className="motion-press block rounded-full border border-line px-3 py-1.5 text-xs font-medium text-ink-soft peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-on hover:border-line-strong hover:text-ink">
                                {topic}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="name" className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                            Name
                          </label>
                          <input
                            type="text"
                            id="name"
                            name="name"
                            placeholder="Your name"
                            required
                            className="w-full rounded-lg border border-line bg-bg-inset/70 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="mb-1 block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                            Email
                          </label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="your@email.com"
                            required
                            className="w-full rounded-lg border border-line bg-bg-inset/70 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-1 flex items-center justify-between gap-3">
                          <label htmlFor="message" className="block font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                            Message
                          </label>
                          <span className="font-mono text-[10px] text-ink-faint">max 500</span>
                        </div>
                        <textarea
                          id="message"
                          name="message"
                          placeholder="What should we make clearer?"
                          rows={5}
                          required
                          maxLength={500}
                          className="w-full resize-none rounded-lg border border-line bg-bg-inset/70 px-3 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </div>

                      <button
                        id="submit-btn"
                        type="submit"
                        className="motion-press inline-flex w-full items-center justify-center rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-accent-on hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                      >
                        Send message
                      </button>
                    </form>
                  </div>
                </div>

                <aside className="flex min-w-0 flex-col gap-4">
                  <MoonPhaseChart />

                  <div className="rounded-2xl border border-line bg-bg-inset/70 p-5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-faint">
                      Direct routes
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {socialLinks.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
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
