"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/motion/Reveal";
import { motionEasing, motionTimings } from "@/lib/motion";
import { processSteps } from "@/lib/data/process";

export function ProcessSection() {
  return (
    <section id="process" className="scroll-mt-20 border-t border-line bg-bg-raised py-20 sm:py-28">
      <Container>
        <Reveal>
          <SectionHeading
            eyebrow="Method"
            title="How I work"
            description="Four moves I return to on every project, whether the deliverable is a shipped product or a single clearer diagram."
          />
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, i) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: motionTimings.base, delay: i * 0.08, ease: motionEasing }}
              className="motion-card flex flex-col rounded-2xl border border-line bg-bg p-6"
            >
              <span className="font-mono text-xs text-ink-faint">{step.letter}</span>
              <h3 className="mt-2 font-sans text-2xl font-semibold text-ink">{step.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{step.summary}</p>

              <ul className="mt-5 space-y-1.5 text-sm text-ink-soft">
                {step.activities.map((activity) => (
                  <li key={activity} className="flex items-start gap-2">
                    <span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-line-strong" />
                    {activity}
                  </li>
                ))}
              </ul>

              <p className="mt-6 border-t border-line pt-4 font-serif text-sm italic leading-relaxed text-ink-soft">
                “{step.fieldNote}”
              </p>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
